#!/usr/bin/env bash
# Smart release: update main, merge your feature branch into main (when not already on main),
# then version bump, PR, merge. Requires gh (gh auth login) and a clean working tree.
#
# Pending .changeset/*.md can live on the feature branch; they are merged into main before
# build / changeset version.
#
# Env:
#   RELEASE_BASE_BRANCH       default: main
#   RELEASE_MERGE             auto (try --auto; if base has no branch protection, merge now) |
#                             merge | admin | open
#   RELEASE_SKIP_FEATURE_MERGE  set to 1 to skip merging the starting branch into main

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

BASE="${RELEASE_BASE_BRANCH:-main}"
MERGE="${RELEASE_MERGE:-auto}"
SKIP_FEATURE_MERGE="${RELEASE_SKIP_FEATURE_MERGE:-0}"

if ! command -v gh >/dev/null 2>&1; then
  echo "release: install GitHub CLI: https://cli.github.com/  (brew install gh)"
  exit 1
fi

gh auth status >/dev/null 2>&1 || {
  echo "release: run: gh auth login"
  exit 1
}

if [ -n "$(git status --porcelain)" ]; then
  echo "release: working tree is not clean — commit or stash before running."
  exit 1
fi

ORIG_BRANCH="$(git rev-parse --abbrev-ref HEAD)"

cleanup() {
  if [ "$ORIG_BRANCH" != "HEAD" ] && [ "$ORIG_BRANCH" != "$BASE" ]; then
    git checkout "$ORIG_BRANCH" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "→ fetch origin/$BASE"
git fetch origin "$BASE"
if [ "$ORIG_BRANCH" != "$BASE" ]; then
  echo "→ fetch origin/$ORIG_BRANCH (feature branch)"
  git fetch origin "$ORIG_BRANCH" || true
fi

echo "→ checkout $BASE"
git checkout "$BASE"
git pull --ff-only origin "$BASE"

if [ "$ORIG_BRANCH" != "$BASE" ] && [ "$SKIP_FEATURE_MERGE" != "1" ]; then
  echo "→ merge $ORIG_BRANCH into $BASE (before build)"
  if git rev-parse --verify "refs/remotes/origin/$ORIG_BRANCH" >/dev/null 2>&1; then
    git merge "origin/$ORIG_BRANCH" --no-edit
  else
    echo "release: warning: no origin/$ORIG_BRANCH — merging local branch (push the feature if others need it)."
    git merge "$ORIG_BRANCH" --no-edit
  fi
fi

CHANGESETS="$(find .changeset -maxdepth 1 -name '*.md' -type f ! -name 'README.md' 2>/dev/null | wc -l | tr -d ' ')"
if [ "${CHANGESETS:-0}" -eq 0 ]; then
  echo "release: no pending changesets under .changeset/ (excluding README)."
  echo "  Add one with: bunx changeset — or merge the branch that contains .changeset/*.md."
  exit 1
fi

echo "→ build"
bun run build

echo "→ changeset version"
bun run version-packages

git add package.json CHANGELOG.md .changeset
if git diff --cached --quiet; then
  echo "release: nothing staged after version-packages — unexpected."
  exit 1
fi

STAMP="$(date +%Y%m%d-%H%M%S)"
BRANCH="chore/version-packages-${STAMP}"

echo "→ branch $BRANCH"
git checkout -b "$BRANCH"
git commit -m "chore: version packages"

echo "→ push"
git push -u origin "$BRANCH"

echo "→ pull request"
URL="$(gh pr create \
  --base "$BASE" \
  --head "$BRANCH" \
  --title "chore: version packages" \
  --body "Automated version bump via \`make release\` / scripts/make-release-main.sh")"

echo "$URL"

case "$MERGE" in
  open)
    echo "→ RELEASE_MERGE=open: merge the PR manually when ready."
    ;;
  merge)
    echo "→ merge now (fails if branch protection requires passing checks)"
    gh pr merge --merge --delete-branch "$URL"
    ;;
  admin)
    echo "→ merge with --admin (repo admin only)"
    gh pr merge --merge --delete-branch --admin "$URL"
    ;;
  auto)
    echo "→ auto-merge when possible (else immediate merge if base branch has no protection rules)"
    set +e
    AUTO_OUT="$(gh pr merge --merge --delete-branch --auto "$URL" 2>&1)"
    AUTO_RC=$?
    set -e
    if [ "$AUTO_RC" -eq 0 ]; then
      :
    elif echo "$AUTO_OUT" | grep -q 'Protected branch rules not configured'; then
      # gh --auto needs branch protection + required checks; greenfield repos often have neither.
      echo "$AUTO_OUT" >&2
      echo "→ merging immediately (enable branch protection + required checks to use true auto-merge)"
      gh pr merge --merge --delete-branch "$URL"
    else
      echo "$AUTO_OUT" >&2
      echo "release: gh pr merge --auto failed — open the PR above or try RELEASE_MERGE=merge|admin"
      exit 1
    fi
    ;;
  *)
    echo "release: invalid RELEASE_MERGE=$MERGE (use auto|merge|admin|open)"
    exit 1
    ;;
esac

trap - EXIT
git checkout "$BASE"
git pull --ff-only origin "$BASE"

echo "→ done. Local $BASE is up to date. CI / release.yml will publish to npm if configured."
