# myqodercli

[中文版](README_CN.md)

qodercli 的包装器，解决两个痛点：

1. **自动跳过权限确认** — `qodercli --yolo` 虽然显示"跳过权限"，但实际上每次工具调用仍会弹窗确认。myqodercli 通过 PTY 代理自动替你点击"允许且不再问"。
2. **抗压缩记忆** — qodercli 上下文满时会 compact，导致对话记忆丢失。myqodercli 用外部持久化记忆文件在压缩后恢复关键上下文。

纯 bash + expect，不再需要 Node.js。

## 一键安装

```bash
curl -fsSL https://raw.githubusercontent.com/ranxianglei/myqodercli/master/install-myqodercli.sh | bash
```

默认安装到 `~/.local/bin/myqodercli`。需要 `expect`：

```bash
sudo apt install -y expect       # Debian/Ubuntu
sudo yum install -y expect       # RHEL/CentOS
brew install expect              # macOS
```

## 使用

```bash
myqodercli                           # TUI 模式，自动批准权限
myqodercli -w /path/to/project       # 设置工作目录
myqodercli -p "explain this code"    # 非交互式，直接执行
myqodercli --continue                # 恢复之前对话
myqodercli --no-yolo -w /path        # 关闭自动跳过，手动确认
```

## 原理

```
终端 ──→ [myqodercli PTY 代理] ──→ qodercli
              ↕ 拦截
        检测到权限弹窗 → 自动发送 "2\r"
```

一个正则 `Permission required`（不区分大小写）覆盖所有工具类型：Bash、Write、Edit、Delete、Move、MCP tools。

## 持久化记忆

myqodercli 在 `~/.qwrap/sessions/{sessionId}.md` 维护记忆文件。compact 后 AI 读取该文件恢复上下文。结构包含任务目标、用户约束、关键上下文、开发环境、遇到的坑、任务变更历史。

## 环境变量

| 变量 | 说明 |
|------|------|
| `QODERCLI_PATH` | qodercli 的绝对路径（优先于 PATH 查找） |
| `QODER_BINARY` | qodercli 的备用路径 |

## License

MIT
