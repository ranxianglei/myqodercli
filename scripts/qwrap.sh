#!/usr/bin/env bash
set -euo pipefail

# ──────────────────────────────────────────────────────────────
# qwrap.sh — Pure bash/expect PTY proxy for qodercli
#
# Replaces node-pty for TUI mode. ACP proxy still delegates to
# the Node.js implementation (it does not need PTY).
# ──────────────────────────────────────────────────────────────

QODER_PROJECTS="${HOME}/.qoder/projects"
QWRAP_SESS_DIR="${HOME}/.qwrap/sessions"

MEM_HEADER="> ⚙️ qwrap: 每次回复末尾用 Bash 更新此文件。Compaction 后先 cat 恢复记忆。

## 📝 Worklog（按时间顺序）

| 时间  | 事件 |
|-------|------|
| 启动 | 初始化会话 |

## 任务目标
-

## 用户约束 / 偏好
-

## 关键决定
-

"

MEM_TMPL="## 任务目标
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

"

# ── resolve qodercli ──────────────────────────────────────────
resolve_qodercli() {
  if [[ -n "${QODERCLI_PATH:-}" && -f "$QODERCLI_PATH" ]]; then
    printf '%s' "$QODERCLI_PATH"
    return
  fi
  local bundled
  bundled="$(cd "$(dirname "$0")" && pwd)/qodercli"
  if [[ -f "$bundled" ]]; then
    printf '%s' "$bundled"
    return
  fi
  if command -v qodercli &>/dev/null; then
    printf '%s' "$(command -v qodercli)"
    return
  fi
  if [[ -n "${QODER_BINARY:-}" ]]; then
    printf '%s' "$QODER_BINARY"
    return
  fi
  echo "Error: qodercli not found. Set QODERCLI_PATH or install qodercli." >&2
  exit 1
}

# ── find latest session for cwd ───────────────────────────────
find_latest_session() {
  local cwd="$1"
  local slug
  slug="$(printf '%s' "$cwd" | sed 's|^/||;s|/|-|g')"
  [[ -z "$slug" ]] && slug="root"

  local dir="${QODER_PROJECTS}/${slug}"
  [[ -d "$dir" ]] || return 1

  local best="" best_mt=0
  for f in "$dir"/*-session.json; do
    [[ -f "$f" ]] || continue
    local mt
    mt="$(stat -c %Y "$f" 2>/dev/null || stat -f %m "$f" 2>/dev/null || echo 0)"
    # Extract working_dir and id from JSON (lightweight, no jq needed)
    local wdir sid
    wdir="$(sed -n 's/.*"working_dir"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$f" | head -1)"
    sid="$(sed -n 's/.*"id"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$f" | head -1)"
    if [[ "$wdir" == "$cwd" && -n "$sid" && "$mt" -gt "$best_mt" ]]; then
      best="$sid"
      best_mt="$mt"
    fi
  done

  [[ -n "$best" ]] && printf '%s' "$best"
}

# ── ensure memory file ────────────────────────────────────────
ensure_mem_file() {
  local sid="$1"
  mkdir -p "$QWRAP_SESS_DIR"
  local mp="${QWRAP_SESS_DIR}/${sid}.md"
  if [[ ! -f "$mp" ]]; then
    printf '%s%s' "$MEM_HEADER" "$MEM_TMPL" > "$mp"
  else
    if ! grep -q 'qwrap:' "$mp" 2>/dev/null; then
      local tmp="${mp}.tmp.$$"
      printf '%s' "$MEM_HEADER" > "$tmp"
      cat "$mp" >> "$tmp"
      mv "$tmp" "$mp"
    fi
  fi
  printf '%s' "$mp"
}

# ── process args (mimics TS processArgs logic) ────────────────
HAS_NO_YOLO=false
HAS_ACP=false
HAS_CONTINUE=false
EXTRA_ARGS=()
WORKDIR=""
PROMPT=""

raw_args=("$@")
i=0
while [[ $i -lt ${#raw_args[@]} ]]; do
  arg="${raw_args[$i]}"
  case "$arg" in
    --no-yolo|--require-permissions)
      HAS_NO_YOLO=true
      ;;
    --acp)
      HAS_ACP=true
      EXTRA_ARGS+=("$arg")
      ;;
    --continue)
      HAS_CONTINUE=true
      EXTRA_ARGS+=("$arg")
      ;;
    -w)
      i=$((i + 1))
      WORKDIR="${raw_args[$i]:-}"
      EXTRA_ARGS+=("-w" "$WORKDIR")
      ;;
    -p)
      i=$((i + 1))
      PROMPT="${raw_args[$i]:-}"
      EXTRA_ARGS+=("-p" "$PROMPT")
      ;;
    -v|--version|-h|--help)
      EXTRA_ARGS+=("$arg")
      ;;
    *)
      EXTRA_ARGS+=("$arg")
      ;;
  esac
  i=$((i + 1))
done

# Inject --yolo if not opted out and not already present
if ! $HAS_NO_YOLO; then
  if [[ ! " ${EXTRA_ARGS[*]:-} " =~ " --yolo " ]] && [[ ! " ${EXTRA_ARGS[*]:-} " =~ " --dangerously-skip-permissions " ]]; then
    EXTRA_ARGS=("--yolo" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}")
  fi
fi

QC="$(resolve_qodercli)"

# ── mode: ACP proxy → delegate to Node.js ────────────────────
if $HAS_ACP; then
  CLI_CJS="$(cd "$(dirname "$0")/../dist/bin" && pwd 2>/dev/null || true)/cli.cjs"
  if [[ -f "$CLI_CJS" ]]; then
    exec node "$CLI_CJS" "$@"
  else
    echo "Error: ACP proxy requires Node.js build. Run 'npm run build'." >&2
    exit 1
  fi
fi

# ── mode: info / piped / plain args → direct exec ────────────
if [[ " ${EXTRA_ARGS[*]:-} " =~ " -v " ]] || \
   [[ " ${EXTRA_ARGS[*]:-} " =~ " --version " ]] || \
   [[ " ${EXTRA_ARGS[*]:-} " =~ " -h " ]] || \
   [[ " ${EXTRA_ARGS[*]:-} " =~ " --help " ]] || \
   [[ ! -t 0 ]]; then
  exec "$QC" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
fi

# ── mode: --no-yolo → direct exec ────────────────────────────
if $HAS_NO_YOLO; then
  exec "$QC" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
fi

# ── mode: TUI PTY proxy via expect ───────────────────────────
CWD="${WORKDIR:-$(pwd)}"
COLS="${COLUMNS:-80}"
ROWS="${LINES:-24}"

SESSION_ID=""
MEM_PATH=""
if SID="$(find_latest_session "$CWD" 2>/dev/null)" && [[ -n "$SID" ]]; then
  SESSION_ID="$SID"
  MEM_PATH="$(ensure_mem_file "$SID")"
fi

exec expect -f - -- "$QC" "$CWD" "$COLS" "$ROWS" "$SESSION_ID" "$MEM_PATH" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}" <<'EXPECT_SCRIPT'
#!/usr/bin/env expect -f

set qc          [lindex $argv 0]
set cwd         [lindex $argv 1]
set cols        [lindex $argv 2]
set rows        [lindex $argv 3]
set session_id  [lindex $argv 4]
set mem_path    [lindex $argv 5]
set qc_args     [lrange $argv 6 end]

set env(FORCE_COLOR) [expr {![info exists env(FORCE_COLOR)] || $env(FORCE_COLOR) eq "" ? "1" : $env(FORCE_COLOR)}]

eval spawn -noecho $qc $qc_args
match_max 131072
log_user 0

set buf ""
set injected 0
set last_ok 0
set inject_at 0

proc strip_ansi {s} {
  regsub -all {\x1b\[[0-9;]*[a-zA-Z]} $s {} s
  regsub -all {\x1b\[?[0-9;]*[a-zA-Z/]} $s {} s
  regsub -all {\x0d} $s {} s
  return $s
}

proc tail4096 {s} {
  set len [string length $s]
  if {$len > 4096} { return [string range $s [expr {$len - 4096}] end] }
  return $s
}

proc read_file {path} {
  set fh [open $path r]
  set c [read $fh]
  close $fh
  return $c
}

proc do_inject {mp} {
  set content [read_file $mp]
  send "规则：持续维护 ${mp}。每次回复末尾用 Bash 更新 Worklog 和各章节。Compaction 后先 cat ${mp} 恢复记忆。Worklog 按时间追加记录用户需求变化、任务切换、关键决策。\n\n记忆文件内容：\n\n${content}\n\n请消化并继续。\n"
}

set timeout -1

expect {
  -re "(.+?)([\r\n]+|$)" {
    set chunk $expect_out(0,string)
    append buf $chunk
    puts -nonewline stdout $chunk
    flush stdout

    set clean [strip_ansi $buf]
    set tail [tail4096 $clean]
    set now [clock milliseconds]

    if {[regexp -nocase {Permission required} $tail]} {
      if {$now - $last_ok >= 500} {
        set last_ok $now
        send "2\r"
      }
      set buf ""
    }

    if {$inject_at > 0 && $now >= $inject_at} {
      do_inject $mem_path
      set inject_at 0
    }

    if {$session_id ne "" && $mem_path ne "" && $injected == 0} {
      if {[regexp -nocase {Type your message} $tail]} {
        set injected 1
        set content [read_file $mem_path]
        if {[string length [string trim $content]] > 20} {
          set inject_at [expr {$now + 1500}]
        }
      }
    }

    set blen [string length $buf]
    if {$blen > 65536} { set buf [string range $buf [expr {$blen - 8192}] end] }

    exp_continue
  }
  eof {
    if {[info exists expect_out(buffer)] && $expect_out(buffer) ne ""} {
      puts -nonewline stdout $expect_out(buffer)
      flush stdout
    }
  }
}

catch {close}
catch {wait}
EXPECT_SCRIPT
