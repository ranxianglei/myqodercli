#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${1:-$HOME/.local/bin}"

if ! command -v expect &>/dev/null; then
  auto_install_expect() {
    local pm="" cmd=""
    if command -v apt-get &>/dev/null; then
      pm="apt-get" && cmd="DEBIAN_FRONTEND=noninteractive apt-get install -y expect"
    elif command -v yum &>/dev/null; then
      pm="yum" && cmd="yum install -y expect"
    elif command -v dnf &>/dev/null; then
      pm="dnf" && cmd="dnf install -y expect"
    elif command -v brew &>/dev/null; then
      brew install expect && return 0
    fi
    if [[ -n "$pm" ]]; then
      echo "auto installing expect via $pm..."
      if command -v sudo &>/dev/null; then
        sudo sh -c "$cmd" && return 0
      else
        eval "$cmd" && return 0
      fi
    fi
    return 1
  }
  if ! auto_install_expect; then
    echo "error: failed to install expect" >&2
    echo "manual: sudo apt install -y expect  or  sudo yum install -y expect" >&2
    exit 1
  fi
  if ! command -v expect &>/dev/null; then
    echo "error: expect not found after install, restart your terminal or check PATH" >&2
    exit 1
  fi
fi

if ! command -v qodercli &>/dev/null && [ -z "${QODERCLI_PATH:-}" ] && [ -z "${QODER_BINARY:-}" ]; then
  echo "warning: 'qodercli' not in PATH, set QODERCLI_PATH or install it first" >&2
fi

mkdir -p "$INSTALL_DIR"

cat > "$INSTALL_DIR/myqodercli" <<'QWRAP_EOF'
#!/usr/bin/env bash
set -euo pipefail

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

resolve_qodercli() {
  if [[ -n "${QODERCLI_PATH:-}" && -f "$QODERCLI_PATH" ]]; then
    printf '%s' "$QODERCLI_PATH"
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

HAS_NO_YOLO=false
EXTRA_ARGS=()
raw_args=("$@")
i=0
while [[ $i -lt ${#raw_args[@]} ]]; do
  arg="${raw_args[$i]}"
  case "$arg" in
    --no-yolo|--require-permissions)
      HAS_NO_YOLO=true
      ;;
    -w|-p)
      i=$((i + 1))
      EXTRA_ARGS+=("$arg" "${raw_args[$i]:-}")
      ;;
    *)
      EXTRA_ARGS+=("$arg")
      ;;
  esac
  i=$((i + 1))
done

if ! $HAS_NO_YOLO; then
  if [[ ! " ${EXTRA_ARGS[*]:-} " =~ " --yolo " ]] && [[ ! " ${EXTRA_ARGS[*]:-} " =~ " --dangerously-skip-permissions " ]]; then
    EXTRA_ARGS=("--yolo" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}")
  fi
fi

QC="$(resolve_qodercli)"

if [[ " ${EXTRA_ARGS[*]:-} " =~ " -v " ]] || \
   [[ " ${EXTRA_ARGS[*]:-} " =~ " --version " ]] || \
   [[ " ${EXTRA_ARGS[*]:-} " =~ " -h " ]] || \
   [[ " ${EXTRA_ARGS[*]:-} " =~ " --help " ]] || \
   [[ ! -t 0 ]]; then
  exec "$QC" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
fi

if $HAS_NO_YOLO; then
  exec "$QC" "${EXTRA_ARGS[@]+"${EXTRA_ARGS[@]}"}"
fi

WORKDIR=""
for ((a=0; a<${#raw_args[@]}; a++)); do
  if [[ "${raw_args[$a]}" == "-w" && $((a+1)) -lt ${#raw_args[@]} ]]; then
    WORKDIR="${raw_args[$((a+1))]}"; break
  fi
done

CWD="${WORKDIR:-$(pwd)}"

SESSION_ID=""
MEM_PATH=""
if SID="$(find_latest_session "$CWD" 2>/dev/null)" && [[ -n "$SID" ]]; then
  SESSION_ID="$SID"
  MEM_PATH="$(ensure_mem_file "$SID")"
fi

# write expect script to temp file to avoid heredoc stdin issues
_ESCRIPT=$(mktemp /tmp/myqodercli-expect.XXXXXX.tcl)
trap 'rm -f "$_ESCRIPT"' EXIT

cat > "$_ESCRIPT" <<'EXPECT_EOF'
set qc          $::env(EXP_QC)
set session_id  $::env(EXP_SESSION_ID)
set mem_path    $::env(EXP_MEM_PATH)

set env(FORCE_COLOR) [expr {![info exists env(FORCE_COLOR)] || $env(FORCE_COLOR) eq "" ? "1" : $env(FORCE_COLOR)}]

# build arg list: split on unit separator
set args [split $::env(EXP_CMD_ARGS) \001]
eval spawn -noecho $qc $args
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
  send "rules: keep updating ${mp} at end of each reply. after compaction, cat ${mp} to restore context. worklog: append user requests, task switches, key decisions.\n\nmemory:\n\n${content}\n\nack and continue.\n"
}

set timeout -1

expect {
  -re {(.+?)(\u000a|\u000d|$)} {
    set chunk $expect_out(0,string)
    append buf $chunk
    send_user -- $chunk
    flush stdout
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
      send_user $expect_out(buffer)
    }
  }
}

catch {close}
catch {wait}
EXPECT_EOF

export EXP_QC="$QC"
export EXP_SESSION_ID="$SESSION_ID"
export EXP_MEM_PATH="$MEM_PATH"
# use unit separator (0x1f) to join array, split in TCL with \u001f
export EXP_CMD_ARGS="$(printf '%s' "${EXTRA_ARGS[0]}"; for ((i=1;i<${#EXTRA_ARGS[@]};i++)); do printf '\037%s' "${EXTRA_ARGS[$i]}"; done)"

exec expect -f "$_ESCRIPT"
QWRAP_EOF

chmod +x "$INSTALL_DIR/myqodercli"

echo "✅ myqodercli installed → $INSTALL_DIR/myqodercli"
echo ""
echo "usage:"
echo "  myqodercli -p 'explain this repo'     # auto-yolo"
echo "  myqodercli -w /path/to/project        # auto-yolo"
echo "  myqodercli                            # auto-yolo (TUI PTY mode)"
echo ""
echo "  myqodercli --no-yolo -w /path         # require permissions"
echo "  myqodercli --continue                 # resume conversation"
