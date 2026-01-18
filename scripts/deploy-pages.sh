#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if ! git rev-parse --git-dir > /dev/null 2>&1; then
  echo "Not a git repository: $ROOT_DIR"
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree has uncommitted changes. Commit before deploying."
  exit 1
fi

git push

git subtree split --prefix web/public -b gh-pages

git push origin gh-pages --force

PAGES_URL="https://mikeyf.github.io/park-pals-web/"

echo "Deployed to: $PAGES_URL"
