#!/usr/bin/env bash
# One-line (macOS / Linux / Git Bash on Windows):
#   curl -fsSL https://raw.githubusercontent.com/jambuai/openwork/main/scripts/install-openwork.sh | bash
#
# Installs the published npm package globally (Node + npm only).
#
# Env:
#   OPENWORK_NPM_PACKAGE     — default @jambulab/openwork
#   OPENWORK_NPM_TAG         — dist-tag, default latest
#   OPENWORK_SKIP_PATH_HOOK — set to 1 to not edit shell rc
#   OPENWORK_PAUSE=1        — wait for Enter before exit
#   OPENWORK_ALLOW_ROOT=1   — only for automation; normally never run this script as root/sudo

set -eo pipefail

NPM_PKG="${OPENWORK_NPM_PACKAGE:-@jambulab/openwork}"
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

# npm global + cache live under the installing user's home. Running as root/sudo
# creates root-owned files under ~user/.npm and installs the CLI where root's npm
# prefix points — so normal shells never see \`openwork\` and later installs fail with EACCES.
if [[ "${OPENWORK_ALLOW_ROOT:-}" != "1" && "$(id -u)" -eq 0 ]]; then
  echo "" >&2
  echo "openwork install: do not run this installer with sudo or as root." >&2
  echo "" >&2
  echo "  It breaks npm (root-owned files under ~/.npm) and installs the CLI where your" >&2
  echo "  normal user PATH does not look — so \`openwork\` is 'not found'." >&2
  echo "" >&2
  echo "  Run as your normal user (no sudo):" >&2
  echo "    curl -fsSL https://raw.githubusercontent.com/jambuai/openwork/main/scripts/install-openwork.sh | bash" >&2
  echo "" >&2
  echo "  If npm says permission denied, fix ownership (one-time) then retry without sudo:" >&2
  echo "    sudo chown -R \"\$(whoami)\" ~/.npm ~/.npm-global" >&2
  echo "" >&2
  echo "  https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally" >&2
  exit 1
fi

echo "OpenWork installer (npm)"
echo "  Package: $NPM_PKG@$NPM_TAG"
echo ""

if ! npm install -g "${NPM_PKG}@${NPM_TAG}"; then
  echo "" >&2
  echo "openwork install: npm install -g failed." >&2
  echo "" >&2
  echo "  Common causes:" >&2
  echo "    • ~/.npm or ~/.npm-global has root-owned files (often from past \`sudo npm\`). Fix:" >&2
  echo "        sudo chown -R \"\$(whoami)\" ~/.npm ~/.npm-global" >&2
  echo "    • Then run this installer again — still without sudo." >&2
  echo "" >&2
  echo "  Guide: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally" >&2
  exit 1
fi

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
