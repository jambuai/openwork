#!/usr/bin/env bash
# One-line (macOS / Linux / Git Bash on Windows):
#   curl -fsSL https://raw.githubusercontent.com/jgabriellima/openwork/main/scripts/install-openwork.sh | bash
#
# Default: npm global install of @jgabriellima/openwork (needs Node + npm only).
# Source build: OPENWORK_INSTALL_CHANNEL=source (needs git + Bun + Node).
#
# Env:
#   OPENWORK_INSTALL_CHANNEL — npm (default) | source
#   OPENWORK_NPM_PACKAGE     — default @jgabriellima/openwork
#   OPENWORK_NPM_TAG         — dist-tag, default latest
#   OPENWORK_REPO_URL, OPENWORK_GITHUB_REF, OPENWORK_INSTALL_DIR, OPENWORK_BIN_DIR
#     — used when channel=source (see below)
#   OPENWORK_SKIP_PATH_HOOK — set to 1 to not edit shell rc
#   OPENWORK_PAUSE=1        — wait for Enter before exit

set -eo pipefail

CHANNEL="${OPENWORK_INSTALL_CHANNEL:-npm}"
NPM_PKG="${OPENWORK_NPM_PACKAGE:-@jgabriellima/openwork}"
NPM_TAG="${OPENWORK_NPM_TAG:-latest}"
REPO_URL="${OPENWORK_REPO_URL:-https://github.com/jgabriellima/openwork.git}"
REF="${OPENWORK_GITHUB_REF:-main}"
INSTALL_DIR="${OPENWORK_INSTALL_DIR:-$HOME/.openwork-source}"
BIN_DIR="${OPENWORK_BIN_DIR:-$HOME/.local/bin}"
MARKER_NPM="# openwork-install: add npm global bin to PATH"
MARKER_SRC="# openwork-install: add ~/.local/bin to PATH"

die() {
  echo "" >&2
  echo "openwork install: $*" >&2
  exit 1
}

npm_global_bin_dir() {
  local p
  p="$(npm prefix -g 2>/dev/null | tr -d '\r\n')"
  [[ -n "$p" ]] || return 1
  case "$(uname -s 2>/dev/null)" in
    MINGW* | MSYS* | CYGWIN*) echo "$p" ;;
    *) echo "$p/bin" ;;
  esac
}

append_path_hook_for_dir() {
  local hook_dir="$1"
  local marker="$2"
  [[ "${OPENWORK_SKIP_PATH_HOOK:-}" == "1" ]] && return 0
  case ":${PATH}:" in *:"$hook_dir":*) return 0 ;; esac
  # shellcheck disable=SC2016
  local line="export PATH=\"$hook_dir:\$PATH\""
  local target=""
  if [[ -f "$HOME/.zshrc" ]]; then
    target="$HOME/.zshrc"
  elif [[ -f "$HOME/.bashrc" ]]; then
    target="$HOME/.bashrc"
  elif [[ -f "$HOME/.bash_profile" ]]; then
    target="$HOME/.bash_profile"
  elif [[ -f "$HOME/.profile" ]]; then
    target="$HOME/.profile"
  else
    if [[ "${SHELL:-}" == */zsh ]]; then
      target="$HOME/.zshrc"
    else
      target="$HOME/.profile"
    fi
  fi
  if grep -qF "$marker" "$target" 2>/dev/null; then
    return 0
  fi
  {
    echo ""
    echo "$marker"
    echo "$line"
  } >>"$target"
  echo "Added PATH hook to $target (open a new terminal or: source $target)"
}

install_npm_channel() {
  command -v node >/dev/null 2>&1 || die "Node.js not found. Install Node 20+ from https://nodejs.org/"
  command -v npm >/dev/null 2>&1 || die "npm not found. Install Node.js (includes npm)."

  echo "OpenWork installer (npm)"
  echo "  Package: $NPM_PKG@$NPM_TAG"
  echo ""

  npm install -g "${NPM_PKG}@${NPM_TAG}" || die "npm install -g failed"

  local hook_dir
  hook_dir="$(npm_global_bin_dir)" || die "could not resolve npm global bin directory"
  append_path_hook_for_dir "$hook_dir" "$MARKER_NPM"

  echo "Verifying..."
  PATH="$hook_dir:$PATH"
  command -v openwork >/dev/null 2>&1 || die "openwork not on PATH after install (try: export PATH=\"$hook_dir:\$PATH\")"
  openwork --version || true

  echo ""
  echo "Done. Next (new shell, or: source your rc file):"
  echo "  openwork configure"
  echo "  openwork"
  echo ""
}

install_source_channel() {
  command -v git >/dev/null 2>&1 || die "git not found. Install Git first."
  command -v node >/dev/null 2>&1 || die "Node.js not found. Install Node 20+ from https://nodejs.org/"
  command -v bun >/dev/null 2>&1 || die "Bun not found. Install from https://bun.sh (required to build the CLI bundle)."

  echo "OpenWork installer (source)"
  echo "  Repo:    $REPO_URL ($REF)"
  echo "  Clone:   $INSTALL_DIR"
  echo "  Command: $BIN_DIR/openwork"
  echo ""

  if [[ -d "$INSTALL_DIR/.git" ]]; then
    echo "Updating existing clone..."
    git -C "$INSTALL_DIR" fetch origin "$REF" 2>/dev/null || true
    git -C "$INSTALL_DIR" checkout "$REF" 2>/dev/null || git -C "$INSTALL_DIR" checkout -B "$REF" "origin/$REF" 2>/dev/null || true
    git -C "$INSTALL_DIR" pull --ff-only origin "$REF" || git -C "$INSTALL_DIR" pull --ff-only || true
  else
    echo "Cloning..."
    rm -rf "$INSTALL_DIR"
    git clone --depth 1 --branch "$REF" "$REPO_URL" "$INSTALL_DIR" || die "git clone failed"
  fi

  cd "$INSTALL_DIR" || die "cannot cd to $INSTALL_DIR"
  INSTALL_ABS="$(pwd)"

  echo "Installing dependencies (bun)..."
  bun install || die "bun install failed"

  echo "Building CLI..."
  bun run build || die "bun run build failed"

  [[ -f dist/cli.mjs ]] || die "dist/cli.mjs missing after build"

  echo "Installing launcher (no npm global / no sudo)..."
  mkdir -p "$BIN_DIR"
  ROOT_FILE="$BIN_DIR/.openwork-root"
  printf '%s' "$INSTALL_ABS" >"$ROOT_FILE"
  LAUNCHER="$BIN_DIR/openwork"
  cat >"$LAUNCHER" <<'EOS'
#!/usr/bin/env bash
set -euo pipefail
_bin="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cat "$_bin/.openwork-root")"
exec node "$ROOT/dist/cli.mjs" "$@"
EOS
  chmod +x "$LAUNCHER" || die "could not chmod $LAUNCHER"

  append_path_hook_for_dir "$BIN_DIR" "$MARKER_SRC"

  echo "Verifying..."
  PATH="$BIN_DIR:$PATH"
  if ! command -v openwork >/dev/null 2>&1; then
    die "internal error: openwork not found after PATH prepend"
  fi
  openwork --version || true

  echo ""
  echo "Done. Next (new shell, or: source your rc file):"
  echo "  openwork configure"
  echo "  openwork"
  echo ""
}

case "$CHANNEL" in
  npm) install_npm_channel ;;
  source) install_source_channel ;;
  *) die "unknown OPENWORK_INSTALL_CHANNEL=$CHANNEL (use npm or source)" ;;
esac

if [[ "${OPENWORK_PAUSE:-}" == "1" ]] && [[ -t 0 ]]; then
  read -r -p "Press Enter to close... " _
fi
