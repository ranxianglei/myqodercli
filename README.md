# myqodercli

[中文版](README_CN.md)
Drop-in replacement for qodercli with **automatic permission bypass** and **persistent memory across compaction**.

Zero Node.js dependencies — pure bash + expect.

## Install

### One-liner (Recommended)

```bash
bash install-myqodercli.sh ~/.local/bin
```

Requires `expect` installed:
```bash
sudo apt install -y expect       # Debian/Ubuntu
sudo yum install -y expect       # RHEL/CentOS
brew install expect              # macOS
```

### Legacy (Node.js build)

```bash
npm install && npm run build
./install.sh ~/.local/bin
```

## Usage

```bash
myqodercli                           # TUI mode — auto-approve all permissions
myqodercli -w /path/to/project       # set working directory
myqodercli -p "explain this code"    # non-interactive prompt
myqodercli --continue                # resume previous conversation
myqodercli --no-yolo -w /path        # opt out, require permissions
```

## Feature 1: Automatic Permission Bypass

qodercli's `--yolo` flag displays "bypass permissions on" but **still asks for confirmation** on every tool execution. myqodercli solves this with an expect PTY proxy that intercepts permission dialogs and auto-sends option 2: "Allow, and don't ask again this session."

```
Your terminal ──→ [myqodercli expect proxy] ──→ qodercli
                      ↕ intercepts
                auto-sends "2+Enter" when
                permission dialog appears
```

### Coverage

One regex (`Permission required`, case-insensitive) covers **all** tool types:

| Tool | Trigger | Covered |
|------|---------|---------|
| Bash (rm, chmod, npm install, pkill...) | Any shell command | ✅ |
| Write | Create / overwrite files | ✅ |
| Edit | Modify existing files | ✅ |
| Delete | Remove files / directories | ✅ |
| Move | Rename files | ✅ |
| MCP tools | External MCP server tools | ✅ |

### Execution Modes

| Mode | Trigger | Mechanism |
|------|---------|-----------|
| **expect PTY proxy** (default TUI) | stdin is TTY | expect spawn → strip ANSI → regex match → auto `2\r` |
| **Plain passthrough** | `-v`, `-h`, `--help`, piped stdin | Direct exec with `--yolo` injected |
| **ACP proxy** | `--acp` flag | Requires Node.js build (`npm run build`) |

## Feature 2: Persistent Memory (Compaction-Proof)

qodercli compacts context when it gets full, losing conversation details. myqodercli uses `~/.qwrap/sessions/{sessionId}.md` to persist critical context across compaction.

### How It Works

```
myqodercli start
    ↓
auto-create (if missing):
├── ~/.qwrap/sessions/{sessionId}.md
│       ├── 任务目标
│       ├── 用户约束 / 偏好
│       ├── 关键上下文
│       ├── 开发工具 / 环境
│       ├── 遇到的坑 / 注意事项
│       └── 任务变更历史
```

### Compaction Flow

```
1. Compaction triggers → context is compressed
2. AI's memory is partially lost
3. AI reads the memory file → restores all key info
4. AI continues with full context
```

## Requirements

- **expect** (`apt install expect` / `brew install expect`)
- qodercli installed and accessible in PATH

Node.js is only needed for `--acp` mode.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `QODERCLI_PATH` | Absolute path to qodercli binary (overrides PATH lookup) |
| `QODER_BINARY` | Fallback path if qodercli not found in PATH |

## License

MIT
