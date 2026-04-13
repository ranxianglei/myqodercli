import { spawn } from 'child_process'
import { join, dirname } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync, statSync, readdirSync } from 'fs'
import { createInterface } from 'readline'
import { stdin, stdout, argv, exit, env } from 'process'
// @ts-ignore
const pty: typeof import('node-pty') = require('@homebridge/node-pty-prebuilt-multiarch')

const __dirname = dirname(__filename)
const QODER_PROJECTS = join(env.HOME || '~', '.qoder', 'projects')
const QWRAP_SESS_DIR = join(env.HOME || '~', '.qwrap', 'sessions')

const MEM_HEADER =
`> ⚙️ qwrap: 每次回复末尾用 Bash 更新此文件。Compaction 后先 cat 恢复记忆。

## 📝 Worklog（按时间顺序）

| 时间  | 事件 |
|-------|------|
| 启动 | 初始化会话 |

## 任务目标
-

## 用户约束 / 偏好
-

## 遇到的坑 / 注意事项
-

## 关键决定
-

`

const MEM_TMPL = `## 任务目标
- 

## 用户约束 / 偏好
- 

## 关键上下文
- 

## 开发工具 / 环境
- 

## 遇到的坑 / 注意事项
- 

## 任务变更历史
- 

`

function resolveQoderCli(): string {
  const e = env.QODERCLI_PATH
  if (e && existsSync(e)) return e
  const s = join(__dirname, 'qodercli')
  if (existsSync(s)) return s
  return env.QODER_BINARY || 'qodercli'
}

function processArgs(raw: string[]): string[] {
  const ua = raw.slice(2)
  if (ua.some(a => a === '--no-yolo' || a === '--require-permissions'))
    return ua.filter(a => a !== '--no-yolo' && a !== '--require-permissions')
  if (!ua.some(a => a === '--yolo' || a === '--dangerously-skip-permissions'))
    return ['--yolo', ...ua]
  return ua
}

function findLatestSession(cwd: string): { id: string } | null {
  const slug = cwd.replace(/^\/+/, '').replace(/\//g, '-') || 'root'
  const dir = join(QODER_PROJECTS, slug)
  if (!existsSync(dir)) return null
  let best: string | null = null
  let mt = 0
  try {
    for (const f of readdirSync(dir).filter((x: string) => x.endsWith('-session.json'))) {
      const fp = join(dir, f)
      const st = statSync(fp)
      if (st.mtimeMs <= mt) continue
      try {
        const j = JSON.parse(readFileSync(fp, 'utf8'))
        if (j.working_dir === cwd && j.id) { best = j.id; mt = st.mtimeMs }
      } catch {
      }
    }
  } catch {
  }
  return best ? { id: best } : null
}

function sessMemPath(sid: string): string {
  if (!existsSync(QWRAP_SESS_DIR)) mkdirSync(QWRAP_SESS_DIR, { recursive: true })
  return join(QWRAP_SESS_DIR, `${sid}.md`)
}

function ensureMemFile(sid: string): string {
  const mp = sessMemPath(sid)
  if (!existsSync(mp)) writeFileSync(mp, MEM_HEADER + MEM_TMPL, 'utf8')
  else {
    const c = readFileSync(mp, 'utf8')
    if (!c.includes('qwrap:')) writeFileSync(mp, MEM_HEADER + c, 'utf8')
  }
  return mp
}

function spawnAcpProxy(qc: string, args: string[]): void {
  const ch = spawn(qc, args, { stdio: ['pipe','pipe','inherit'], cwd: process.cwd(), env: process.env })
  const send = (m: unknown) => ch.stdin?.write(JSON.stringify(m)+'\n')
  stdin.setEncoding('utf8')
  stdin.on('data', (c: string) => ch.stdin?.write(c))
  const rl = createInterface({ input: ch.stdout!, crlfDelay: Infinity })
  rl.on('line', (line: string) => {
    const t = line.trim()
    if (!t) return
    let m: Record<string, unknown>
    try { m = JSON.parse(t) as Record<string, unknown> } catch { stdout.write(line+'\n'); return }
    if ('id' in m && m.id !== undefined && 'method' in m && typeof m.method === 'string') {
      const id = m.id as number
      if (m.method === 'session/request_permission') {
        send({ jsonrpc:'2.0', id, result: { outcome: { outcome:'selected', optionId:'allow_always' }}})
        return
      }
      send({ jsonrpc:'2.0', id, result: {} })
      return
    }
    if (m.result && typeof m.result === 'object' && 'sessionId' in (m.result as object)) {
      const sid = (m.result as Record<string, unknown>).sessionId as string
      if (typeof sid === 'string') ensureMemFile(sid)
    }
    stdout.write(line+'\n')
  })
  ch.on('exit', (c, s) => exit(c ?? (s ? 128 : 1)))
  ch.on('error', (e) => { console.error(`Failed: ${e.message}`); exit(1) })
}

function spawnPlain(qc: string, args: string[]): void {
  const ch = spawn(qc, args, { stdio: ['inherit','inherit','inherit'], cwd: process.cwd(), env: process.env })
  ch.on('exit', (c, s) => exit(c ?? (s ? 128 : 1)))
  ch.on('error', (e) => { console.error(`Failed: ${e.message}`); exit(1) })
}

function spawnTuiPty(qc: string, args: string[]): void {
  const cols = process.stdout.columns || 80
  const rows = process.stdout.rows || 24
  const workDir = process.cwd()
  const sess = findLatestSession(workDir)
  const memPath = sess ? ensureMemFile(sess.id) : null

  const ptyProc = pty.spawn(qc, args, {
    name: 'xterm-256color', cols, rows, cwd: workDir,
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? '1' },
  })

  let buf = ''
  let lastOk = 0
  let injected = false
  let cwdShown = false

  ptyProc.onData((data: string) => {
    const filtered = data.replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '🌐')
    stdout.write(filtered)
    buf += filtered
    const clean = buf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '').replace(/\x0d/g, '')
    const tail = clean.slice(-4096)

    if (/Permission required/i.test(tail)) {
      const now = Date.now()
      if (now - lastOk >= 500) { lastOk = now; ptyProc.write('2\r') }
      buf = ''
      return
    }

    if (/Type your message/i.test(tail) && !injected && memPath) {
      injected = true
      const content = readFileSync(memPath, 'utf8')
      if (content.trim().length > 20) {
        setTimeout(() => {
          ptyProc.write(`规则：持续维护 ${memPath}。每次回复末尾用 Bash 更新 Worklog 和各章节。Compaction 后先 cat ${memPath} 恢复记忆。Worklog 按时间追加记录用户需求变化、任务切换、关键决策。\n\n记忆文件内容：\n\n${content}\n\n请消化并继续。\n`)
        }, 1500)
      }
    }

    if (!cwdShown && /Type your message/i.test(tail)) {
      cwdShown = true
      stdout.write(`\n \x1b[48;5;235m\x1b[38;5;147m 📁 ${workDir} \x1b[0m\n`)
    }

    if (buf.length > 65536) buf = buf.slice(-8192)
  })

  if (stdin.isTTY) stdin.setRawMode(true)
  stdin.resume()
  stdin.on('data', (d: Buffer) => ptyProc.write(d))
  ptyProc.onExit(({ exitCode, signal }: { exitCode: number | undefined; signal: string }) => {
    if (stdin.isTTY) stdin.setRawMode(false)
    exit(exitCode ?? (signal ? 128 : 1))
  })
}

function main(): void {
  const qc = resolveQoderCli()
  const args = processArgs(argv)
  const info = ['-v','--version','-h','--help']
  const isInfo = args.some(a => info.includes(a))
  const isAcp = args.some(a => a === '--acp')

  if (isInfo || !process.stdin.isTTY) spawnPlain(qc, args)
  else if (isAcp) spawnAcpProxy(qc, args)
  else spawnTuiPty(qc, args)
}

main()
