# myqodercli

qodercli 的无缝替代方案，提供**自动跳过权限确认**和**压缩后持久化记忆**。

零 Node.js 依赖，纯 bash + expect 实现。

## 安装

### 一键安装（推荐）

```bash
bash install-myqodercli.sh ~/.local/bin
```

需要先安装 `expect`：
```bash
sudo apt install -y expect       # Debian/Ubuntu
sudo yum install -y expect       # RHEL/CentOS
brew install expect              # macOS
```

### 旧版（Node.js 构建）

```bash
npm install && npm run build
./install.sh ~/.local/bin
```

## 使用方法

```bash
myqodercli                           # TUI 模式，自动批准所有权限
myqodercli -w /path/to/project       # 设置工作目录
myqodercli -p "explain this code"    # 非交互式，直接执行提示
myqodercli --continue                # 恢复之前的对话
myqodercli --no-yolo -w /path        # 关闭自动跳过，需要手动确认权限
```

## 特性 1：自动跳过权限确认

qodercli 的 `--yolo` 标志虽然显示 "bypass permissions on"，但**每次执行工具时仍然会弹窗确认**。myqodercli 通过 expect PTY 代理拦截权限弹窗，自动发送选项 2："Allow, and don't ask again this session."

```
Your terminal ──→ [myqodercli expect proxy] ──→ qodercli
                      ↕ 拦截
                当权限弹窗出现时
                自动发送 "2+Enter"
```

### 覆盖范围

一个正则表达式（`Permission required`，不区分大小写）覆盖**所有**工具类型：

| 工具 | 触发条件 | 已覆盖 |
|------|---------|--------|
| Bash（rm, chmod, npm install, pkill...） | 任何 shell 命令 | ✅ |
| Write | 创建 / 覆盖文件 | ✅ |
| Edit | 修改已有文件 | ✅ |
| Delete | 删除文件 / 目录 | ✅ |
| Move | 重命名文件 | ✅ |
| MCP 工具 | 外部 MCP 服务器工具 | ✅ |

### 执行模式

| 模式 | 触发条件 | 机制 |
|------|---------|------|
| **expect PTY 代理**（默认 TUI） | stdin 是 TTY | expect spawn → 清除 ANSI → 正则匹配 → 自动 `2\r` |
| **纯透传** | `-v`、`-h`、`--help`、管道输入 | 直接执行，注入 `--yolo` |
| **ACP 代理** | `--acp` 标志 | 需要 Node.js 构建（`npm run build`） |

## 特性 2：持久化记忆（抗压缩）

qodercli 在上下文满时会进行压缩，导致对话详情丢失。myqodercli 使用 `~/.qwrap/sessions/{sessionId}.md` 在压缩前后持久化关键上下文。

### 工作原理

```
myqodercli start
    ↓
自动创建（如不存在）：
├── ~/.qwrap/sessions/{sessionId}.md
│       ├── 任务目标
│       ├── 用户约束 / 偏好
│       ├── 关键上下文
│       ├── 开发工具 / 环境
│       ├── 遇到的坑 / 注意事项
│       └── 任务变更历史
```

### 压缩流程

```
1. 触发压缩 → 上下文被压缩
2. AI 的记忆部分丢失
3. AI 读取记忆文件 → 恢复所有关键信息
4. AI 在完整上下文中继续工作
```

## 环境要求

- **expect**（`apt install expect` / `brew install expect`）
- qodercli 已安装且在 PATH 中可用

Node.js 仅在 `--acp` 模式下需要。

## 环境变量

| 变量 | 说明 |
|------|------|
| `QODERCLI_PATH` | qodercli 二进制的绝对路径（覆盖 PATH 查找） |
| `QODER_BINARY` | 在 PATH 中找不到 qodercli 时的备用路径 |

## License

MIT
