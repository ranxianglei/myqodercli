#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${1:-$HOME/.local/bin}"
APP_DIR="$HOME/.myqodercli"

if ! command -v node &>/dev/null; then
  echo "error: Node.js >= 18 required" >&2
  exit 1
fi
if [ "$(node -e 'console.log(parseInt(process.versions.node))')" -lt 18 ]; then
  echo "error: Node.js >= 18 required (found: $(node -v))" >&2
  exit 1
fi

mkdir -p "$APP_DIR"

cat > "$APP_DIR/package.json" <<'PKGEOF'
{"dependencies":{"node-pty":"^1.1.0"}}
PKGEOF

cd "$APP_DIR"
npm install --production --silent 2>/dev/null || npm install --production 2>&1 | tail -1

RAW="https://raw.githubusercontent.com/ranxianglei/myqodercli/master/dist/bin/cli.cjs"
if command -v curl &>/dev/null; then
  curl -fsSL "$RAW" -o cli.cjs
elif command -v wget &>/dev/null; then
  wget -qO cli.cjs "$RAW"
else
  echo "error: need curl or wget" >&2
  exit 1
fi

mkdir -p "$INSTALL_DIR"
REAL_APP_DIR="$(cd "$APP_DIR" && pwd)"
cat > "$INSTALL_DIR/myqodercli" <<WRAP_EOF
#!/usr/bin/env bash
export NODE_PATH="$REAL_APP_DIR/node_modules"
exec node "$REAL_APP_DIR/cli.cjs" "$@"
WRAP_EOF

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
