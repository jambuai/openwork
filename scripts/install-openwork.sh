#!/usr/bin/env bash
# One-line (macOS / Linux / Git Bash on Windows):
#   curl -fsSL https://raw.githubusercontent.com/jgabriellima/openwork/main/scripts/install-openwork.sh | bash
#
# Installs the published npm package globally (Node + npm only).
#
# Env:
#   OPENWORK_NPM_PACKAGE     — default @jgabriellima/openwork
#   OPENWORK_NPM_TAG         — dist-tag, default latest
#   OPENWORK_SKIP_PATH_HOOK — set to 1 to not edit shell rc
#   OPENWORK_PAUSE=1        — wait for Enter before exit

set -eo pipefail

NPM_PKG="${OPENWORK_NPM_PACKAGE:-@jgabriellima/openwork}"
NPM_TAG="${OPENWORK_NPM_TAG:-latest}"
MARKER_NPM="# openwork-install: add npm global bin to PATH"

die() {
  echo "" >&2
  echo "openwork install: $*" >&2
  exit 1
}

if [[ -n "${OPENWORK_INSTALL_CHANNEL:-}" && "${OPENWORK_INSTALL_CHANNEL}" != "npm" ]]; then
  die "OPENWORK_INSTALL_CHANNEL=${OPENWORK_INSTALL_CHANNEL} is not supported (removed). Unset it. This installer only runs: npm install -g ${NPM_PKG}@${NPM_TAG}. For a local build from a git clone, use: bun install && bun run build && node dist/cli.mjs"
fi

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

command -v node >/dev/null 2>&1 || die "Node.js not found. Install Node 20+ from https://nodejs.org/"
command -v npm >/dev/null 2>&1 || die "npm not found. Install Node.js (includes npm)."

echo "OpenWork installer (npm)"
echo "  Package: $NPM_PKG@$NPM_TAG"
echo ""

npm install -g "${NPM_PKG}@${NPM_TAG}" || die "npm install -g failed"

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

if [[ "${OPENWORK_PAUSE:-}" == "1" ]] && [[ -t 0 ]]; then
  read -r -p "Press Enter to close... " _
fi
