#!/usr/bin/env bash
# Installs or removes a shell function so `claude` invokes OpenWork.
# Used by: make claude | make claude-revert
#
# Env:
#   OPENWORK_BIN — absolute path to the openwork executable (optional; default: resolve `openwork` on PATH at install time)

set -euo pipefail

MARKER_BEGIN="# openwork-make-claude-shim: begin"
MARKER_END="# openwork-make-claude-shim: end"

die() {
  echo "claude-openwork-shim: $*" >&2
  exit 1
}

pick_rc_file() {
  # Prefer the user’s login shell (make runs non-interactive; ZSH_VERSION is often unset).
  if [[ "${SHELL:-}" == */zsh ]]; then
    [[ -f "$HOME/.zshrc" ]] && {
      echo "$HOME/.zshrc"
      return
    }
  elif [[ "${SHELL:-}" == */bash ]]; then
    [[ -f "$HOME/.bashrc" ]] && {
      echo "$HOME/.bashrc"
      return
    }
    [[ -f "$HOME/.bash_profile" ]] && {
      echo "$HOME/.bash_profile"
      return
    }
  fi
  [[ -f "$HOME/.zshrc" ]] && {
    echo "$HOME/.zshrc"
    return
  }
  [[ -f "$HOME/.bashrc" ]] && {
    echo "$HOME/.bashrc"
    return
  }
  [[ -f "$HOME/.bash_profile" ]] && {
    echo "$HOME/.bash_profile"
    return
  }
  [[ -f "$HOME/.profile" ]] && {
    echo "$HOME/.profile"
    return
  }
  if [[ "${SHELL:-}" == */zsh ]]; then
    echo "$HOME/.zshrc"
    return
  fi
  echo "$HOME/.profile"
}

remove_block_from_file() {
  local f="$1"
  [[ -f "$f" ]] || return 0
  grep -qF "$MARKER_BEGIN" "$f" 2>/dev/null || return 0
  local tmp
  tmp="$(mktemp)"
  awk -v b="$MARKER_BEGIN" -v e="$MARKER_END" '
    index($0, b) == 1 { skip = 1; next }
    index($0, e) == 1 { skip = 0; next }
    !skip { print }
  ' "$f" >"$tmp"
  mv "$tmp" "$f"
  echo "Removed claude → openwork shim from $f"
}

cmd_remove() {
  local f
  for f in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile"; do
    remove_block_from_file "$f"
  done
  echo "claude-revert: open a new shell or run: source ~/.zshrc (or your rc file)."
}

shim_line() {
  if [[ -n "${OPENWORK_BIN:-}" ]]; then
    [[ -e "$OPENWORK_BIN" ]] || die "OPENWORK_BIN does not exist: $OPENWORK_BIN"
    local q
    q=$(printf '%q' "$OPENWORK_BIN")
    echo "claude() { $q \"\$@\"; }"
    return
  fi
  command -v openwork >/dev/null 2>&1 || die "openwork not on PATH. Install OpenWork or set OPENWORK_BIN=/absolute/path/to/openwork"
  echo 'claude() { command openwork "$@"; }'
}

cmd_add() {
  local f shim body
  for f in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile"; do
    if [[ -f "$f" ]] && grep -qF "$MARKER_BEGIN" "$f" 2>/dev/null; then
      echo "Shim already installed ($f). Run: make claude-revert"
      exit 0
    fi
  done

  f="$(pick_rc_file)"
  if [[ ! -f "$f" ]]; then
    touch "$f" || die "cannot create $f"
  fi

  shim="$(shim_line)"
  {
    echo ""
    echo "$MARKER_BEGIN"
    echo "# claude → OpenWork (revert: make claude-revert)"
    echo "unalias claude 2>/dev/null || true"
    echo "$shim"
    echo "$MARKER_END"
  } >>"$f"

  echo "Installed claude → openwork in $f"
  echo "Open a new terminal or: source $f"
}

case "${1:-}" in
  add) cmd_add ;;
  remove) cmd_remove ;;
  *) die "usage: $0 add | remove" ;;
esac
