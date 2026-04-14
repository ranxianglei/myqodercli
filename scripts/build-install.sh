#!/usr/bin/env bash
set -euo pipefail

# Build dist/bin/cli.cjs + generate install-myqodercli.sh with embedded base64
# Usage: bash scripts/build-install.sh

cd "$(dirname "$0")/.."

echo "==> Building dist/bin/cli.cjs ..."
npm run build

CLI="dist/bin/cli.cjs"
if [ ! -f "$CLI" ]; then
  echo "error: $CLI not found after build" >&2
  exit 1
fi

CLI_B64=$(base64 -w0 "$CLI")
SIZE=$(wc -c < "$CLI")

echo "==> Encoded $CLI ($SIZE bytes) -> base64 (${#CLI_B64} chars)"

cat > install-myqodercli.sh <<TEMPLATE
#!/usr/bin/env bash
set -euo pipefail
_CLI_B64='${CLI_B64}'

require_node() {
  local need=18 cur
  if command -v node &>/dev/null; then
    cur=\$(node -e 'console.log(parseInt(process.versions.node))' 2>/dev/null) || cur=0
    if [[ "\$cur" -ge "\$need" ]]; then return 0; fi
    echo "Node.js \$cur too old (need \$need). Upgrading..."
  else
    echo "Node.js not found. Installing Node.js 20 LTS..."
  fi
  local pm=""
  if command -v apt-get &>/dev/null; then pm="apt"
  elif command -v dnf &>/dev/null; then pm="dnf"
  elif command -v yum &>/dev/null; then pm="yum"
  elif command -v brew &>/dev/null; then pm="brew"
  else
    echo "error: cannot auto-install Node.js — install manually from https://nodejs.org" >&2
    exit 1
  fi
  local SUDO=""; command -v sudo &>/dev/null && SUDO="sudo"
  case "\$pm" in
    apt|dnf|yum)
      \$SUDO bash <<'NODESRC'
if command -v curl &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x 2>/dev/null | bash - 2>/dev/null || \
  curl -fsSL https://rpm.nodesource.com/setup_20.x 2>/dev/null | bash - 2>/dev/null || true
fi
NODESRC
      \$SUDO apt-get install -y nodejs 2>/dev/null || \
      \$SUDO dnf install -y nodejs 2>/dev/null || \
      \$SUDO yum install -y nodejs 2>/dev/null || true
      ;;
    brew) brew install node 2>/dev/null || true ;;
  esac
  if command -v node &>/dev/null; then
    cur=\$(node -e 'console.log(parseInt(process.versions.node))' 2>/dev/null) || cur=0
    if [[ "\$cur" -ge "\$need" ]]; then echo "Node.js \$cur installed."; return 0; fi
  fi
  echo "error: Node.js >= \$need required. Install manually: https://nodejs.org" >&2
  exit 1
}

require_node

INSTALL_DIR="\${1:-\$HOME/.local/bin}"
APP_DIR="\$HOME/.myqodercli"

rm -rf "\$APP_DIR"
mkdir -p "\$APP_DIR"

cat > "\$APP_DIR/package.json" <<'PKG'
{"dependencies":{"@homebridge/node-pty-prebuilt-multiarch":"^0.14.0"}}
PKG

cd "\$APP_DIR"
npm install --production --silent 2>/dev/null || npm install --production 2>&1 | tail -1

echo "\$_CLI_B64" | base64 -d > "\$APP_DIR/cli.cjs"

mkdir -p "\$INSTALL_DIR"
REAL_APP_DIR="\$(cd "\$APP_DIR" && pwd)"
cat > "\$INSTALL_DIR/myqodercli" <<WEOF
#!/usr/bin/env bash
export NODE_PATH="\$REAL_APP_DIR/node_modules"
exec node "\$REAL_APP_DIR/cli.cjs" "\\\$@"
WEOF

chmod +x "\$INSTALL_DIR/myqodercli"

echo "myqodercli installed -> \$INSTALL_DIR/myqodercli"
echo ""
echo "usage:"
echo "  myqodercli                           # auto-yolo (TUI)"
echo "  myqodercli -w /path/to/project       # auto-yolo"
echo "  myqodercli -p 'explain this code'    # non-interactive"
echo "  myqodercli --no-yolo -w /path        # require permissions"
echo "  myqodercli --continue                # resume conversation"
TEMPLATE

chmod +x install-myqodercli.sh

OUT_SIZE=$(wc -c < install-myqodercli.sh)
echo "==> Generated install-myqodercli.sh ($OUT_SIZE bytes)"
echo "    CLI source: $SIZE bytes"
echo "    Base64:     ${#CLI_B64} chars"
echo "    Done."
