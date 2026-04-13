#!/usr/bin/env bash
set -euo pipefail

INSTALL_DIR="${1:-/usr/local/bin}"
QWRAP_SH="$(cd "$(dirname "$0")/scripts" && pwd)/qwrap.sh"
CLI_CJS="$(cd "$(dirname "$0")/dist/bin" && pwd)/cli.cjs"

if [ ! -f "$QWRAP_SH" ]; then
  echo "Error: scripts/qwrap.sh not found."
  exit 1
fi

if ! command -v expect &>/dev/null; then
  echo "Error: 'expect' is required for TUI mode."
  echo "Install it: apt install expect / brew install expect / yum install expect"
  exit 1
fi

NODE="$(which node 2>/dev/null || true)"
HAS_NODE=false
HAS_CJS=false
if [[ -n "$NODE" && -f "$CLI_CJS" ]]; then
  HAS_NODE=true
  HAS_CJS=true
fi

cat > "$INSTALL_DIR/myqodercli" <<SCRIPT
#!/usr/bin/env bash
# myqodercli — qoder-wrapper entry point
# TUI mode: pure bash/expect (no Node.js)
# ACP mode: delegates to Node.js cli.cjs
exec bash "$QWRAP_SH" "\$@"
SCRIPT

chmod +x "$INSTALL_DIR/myqodercli"

echo "Installed qoder-wrapper to $INSTALL_DIR/myqodercli"
echo ""
if $HAS_NODE; then
  echo "  TUI mode:   pure bash/expect (no Node.js needed)"
  echo "  ACP mode:   Node.js proxy (--acp flag)"
else
  echo "  TUI mode:   pure bash/expect (no Node.js needed)"
  if [[ -n "$NODE" ]]; then
    echo "  ACP mode:   requires 'npm run build' (cli.cjs not found)"
  else
    echo "  ACP mode:   requires Node.js + 'npm run build'"
  fi
fi
echo ""
echo "All commands pass through with --yolo auto-injected:"
echo "  myqodercli -p 'explain this repo'     # auto yolo"
echo "  myqodercli -w /path/to/project        # auto yolo"
echo "  myqodercli                            # auto yolo (TUI PTY mode)"
echo "  myqodercli --acp                      # auto yolo + ACP proxy"
echo ""
echo "To disable auto-yolo for a single run:"
echo "  myqodercli --no-yolo -w /path         # requires permissions"
