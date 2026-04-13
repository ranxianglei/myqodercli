#!/usr/bin/env node
"use strict";

// src/bin/cli.ts
var import_child_process = require("child_process");
var import_path = require("path");
var import_fs = require("fs");
var import_readline = require("readline");
var import_process = require("process");
var pty = require("@homebridge/node-pty-prebuilt-multiarch");
var __dirname = (0, import_path.dirname)(__filename);
var QODER_PROJECTS = (0, import_path.join)(import_process.env.HOME || "~", ".qoder", "projects");
var QWRAP_SESS_DIR = (0, import_path.join)(import_process.env.HOME || "~", ".qwrap", "sessions");
var MEM_HEADER = `> \u2699\uFE0F qwrap: \u6BCF\u6B21\u56DE\u590D\u672B\u5C3E\u7528 Bash \u66F4\u65B0\u6B64\u6587\u4EF6\u3002Compaction \u540E\u5148 cat \u6062\u590D\u8BB0\u5FC6\u3002

## \u{1F4DD} Worklog\uFF08\u6309\u65F6\u95F4\u987A\u5E8F\uFF09

| \u65F6\u95F4  | \u4E8B\u4EF6 |
|-------|------|
| \u542F\u52A8 | \u521D\u59CB\u5316\u4F1A\u8BDD |

## \u4EFB\u52A1\u76EE\u6807
-

## \u7528\u6237\u7EA6\u675F / \u504F\u597D
-

## \u9047\u5230\u7684\u5751 / \u6CE8\u610F\u4E8B\u9879
-

## \u5173\u952E\u51B3\u5B9A
-

`;
var MEM_TMPL = `## \u4EFB\u52A1\u76EE\u6807
- 

## \u7528\u6237\u7EA6\u675F / \u504F\u597D
- 

## \u5173\u952E\u4E0A\u4E0B\u6587
- 

## \u5F00\u53D1\u5DE5\u5177 / \u73AF\u5883
- 

## \u9047\u5230\u7684\u5751 / \u6CE8\u610F\u4E8B\u9879
- 

## \u4EFB\u52A1\u53D8\u66F4\u5386\u53F2
- 

`;
function resolveQoderCli() {
  const e = import_process.env.QODERCLI_PATH;
  if (e && (0, import_fs.existsSync)(e)) return e;
  const s = (0, import_path.join)(__dirname, "qodercli");
  if ((0, import_fs.existsSync)(s)) return s;
  return import_process.env.QODER_BINARY || "qodercli";
}
function processArgs(raw) {
  const ua = raw.slice(2);
  if (ua.some((a) => a === "--no-yolo" || a === "--require-permissions"))
    return ua.filter((a) => a !== "--no-yolo" && a !== "--require-permissions");
  if (!ua.some((a) => a === "--yolo" || a === "--dangerously-skip-permissions"))
    return ["--yolo", ...ua];
  return ua;
}
function findLatestSession(cwd) {
  const slug = cwd.replace(/^\/+/, "").replace(/\//g, "-") || "root";
  const dir = (0, import_path.join)(QODER_PROJECTS, slug);
  if (!(0, import_fs.existsSync)(dir)) return null;
  let best = null;
  let mt = 0;
  try {
    for (const f of (0, import_fs.readdirSync)(dir).filter((x) => x.endsWith("-session.json"))) {
      const fp = (0, import_path.join)(dir, f);
      const st = (0, import_fs.statSync)(fp);
      if (st.mtimeMs <= mt) continue;
      try {
        const j = JSON.parse((0, import_fs.readFileSync)(fp, "utf8"));
        if (j.working_dir === cwd && j.id) {
          best = j.id;
          mt = st.mtimeMs;
        }
      } catch {
      }
    }
  } catch {
  }
  return best ? { id: best } : null;
}
function sessMemPath(sid) {
  if (!(0, import_fs.existsSync)(QWRAP_SESS_DIR)) (0, import_fs.mkdirSync)(QWRAP_SESS_DIR, { recursive: true });
  return (0, import_path.join)(QWRAP_SESS_DIR, `${sid}.md`);
}
function ensureMemFile(sid) {
  const mp = sessMemPath(sid);
  if (!(0, import_fs.existsSync)(mp)) (0, import_fs.writeFileSync)(mp, MEM_HEADER + MEM_TMPL, "utf8");
  else {
    const c = (0, import_fs.readFileSync)(mp, "utf8");
    if (!c.includes("qwrap:")) (0, import_fs.writeFileSync)(mp, MEM_HEADER + c, "utf8");
  }
  return mp;
}
function spawnAcpProxy(qc, args) {
  const ch = (0, import_child_process.spawn)(qc, args, { stdio: ["pipe", "pipe", "inherit"], cwd: process.cwd(), env: process.env });
  const send = (m) => ch.stdin?.write(JSON.stringify(m) + "\n");
  import_process.stdin.setEncoding("utf8");
  import_process.stdin.on("data", (c) => ch.stdin?.write(c));
  const rl = (0, import_readline.createInterface)({ input: ch.stdout, crlfDelay: Infinity });
  rl.on("line", (line) => {
    const t = line.trim();
    if (!t) return;
    let m;
    try {
      m = JSON.parse(t);
    } catch {
      import_process.stdout.write(line + "\n");
      return;
    }
    if ("id" in m && m.id !== void 0 && "method" in m && typeof m.method === "string") {
      const id = m.id;
      if (m.method === "session/request_permission") {
        send({ jsonrpc: "2.0", id, result: { outcome: { outcome: "selected", optionId: "allow_always" } } });
        return;
      }
      send({ jsonrpc: "2.0", id, result: {} });
      return;
    }
    if (m.result && typeof m.result === "object" && "sessionId" in m.result) {
      const sid = m.result.sessionId;
      if (typeof sid === "string") ensureMemFile(sid);
    }
    import_process.stdout.write(line + "\n");
  });
  ch.on("exit", (c, s) => (0, import_process.exit)(c ?? (s ? 128 : 1)));
  ch.on("error", (e) => {
    console.error(`Failed: ${e.message}`);
    (0, import_process.exit)(1);
  });
}
function spawnPlain(qc, args) {
  const ch = (0, import_child_process.spawn)(qc, args, { stdio: ["inherit", "inherit", "inherit"], cwd: process.cwd(), env: process.env });
  ch.on("exit", (c, s) => (0, import_process.exit)(c ?? (s ? 128 : 1)));
  ch.on("error", (e) => {
    console.error(`Failed: ${e.message}`);
    (0, import_process.exit)(1);
  });
}
function spawnTuiPty(qc, args) {
  const cols = process.stdout.columns || 80;
  const rows = process.stdout.rows || 24;
  const workDir = process.cwd();
  const sess = findLatestSession(workDir);
  const memPath = sess ? ensureMemFile(sess.id) : null;
  const os = require("os");
  const localIp = (() => {
    const ifaces = os.networkInterfaces();
    for (const iface of Object.values(ifaces)) {
      for (const net of iface || []) {
        if (net.family === "IPv4" && !net.internal) return net.address;
      }
    }
    return "0.0.0.0";
  })();
  import_process.stdout.write(`\x1B]0;myqodercli (${localIp}) - ${workDir}\x1B\\`);
  const ptyProc = pty.spawn(qc, args, {
    name: "xterm-256color",
    cols,
    rows,
    cwd: workDir,
    env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? "1" }
  });
  let buf = "";
  let lastOk = 0;
  let injected = false;
  ptyProc.onData((data) => {
    import_process.stdout.write(data);
    buf += data;
    const clean = buf.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "").replace(/\x0d/g, "");
    const tail = clean.slice(-4096);
    if (/Permission required/i.test(tail)) {
      const now = Date.now();
      if (now - lastOk >= 500) {
        lastOk = now;
        ptyProc.write("2\r");
      }
      buf = "";
      return;
    }
    if (/Type your message/i.test(tail) && !injected && memPath) {
      injected = true;
      const content = (0, import_fs.readFileSync)(memPath, "utf8");
      if (content.trim().length > 20) {
        setTimeout(() => {
          ptyProc.write(`\u89C4\u5219\uFF1A\u6301\u7EED\u7EF4\u62A4 ${memPath}\u3002\u6BCF\u6B21\u56DE\u590D\u672B\u5C3E\u7528 Bash \u66F4\u65B0 Worklog \u548C\u5404\u7AE0\u8282\u3002Compaction \u540E\u5148 cat ${memPath} \u6062\u590D\u8BB0\u5FC6\u3002Worklog \u6309\u65F6\u95F4\u8FFD\u52A0\u8BB0\u5F55\u7528\u6237\u9700\u6C42\u53D8\u5316\u3001\u4EFB\u52A1\u5207\u6362\u3001\u5173\u952E\u51B3\u7B56\u3002

\u8BB0\u5FC6\u6587\u4EF6\u5185\u5BB9\uFF1A

${content}

\u8BF7\u6D88\u5316\u5E76\u7EE7\u7EED\u3002
`);
        }, 1500);
      }
    }
    if (buf.length > 65536) buf = buf.slice(-8192);
  });
  if (import_process.stdin.isTTY) import_process.stdin.setRawMode(true);
  import_process.stdin.resume();
  import_process.stdin.on("data", (d) => ptyProc.write(d));
  ptyProc.onExit(({ exitCode, signal }) => {
    if (import_process.stdin.isTTY) import_process.stdin.setRawMode(false);
    (0, import_process.exit)(exitCode ?? (signal ? 128 : 1));
  });
}
function main() {
  const qc = resolveQoderCli();
  const args = processArgs(import_process.argv);
  const info = ["-v", "--version", "-h", "--help"];
  const isInfo = args.some((a) => info.includes(a));
  const isAcp = args.some((a) => a === "--acp");
  if (isInfo || !process.stdin.isTTY) spawnPlain(qc, args);
  else if (isAcp) spawnAcpProxy(qc, args);
  else spawnTuiPty(qc, args);
}
main();
