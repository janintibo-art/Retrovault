#!/usr/bin/env bash
set -euo pipefail
SRC="$HOME/retrovault"
DST="$HOME/retrovault_quest3_git"
REPO="janintibo-art/Retrovault"
for filename in quest3/quest-controls.js quest3/verify-v38.mjs quest3/selftest-v38.mjs quest3/README.md quest3/envoi_v38.sh .github/workflows/build-quest3.yml; do
  test -f "$SRC/$filename" || { echo "Fichier manquant : $SRC/$filename"; exit 1; }
done
command -v gh >/dev/null || { echo "GitHub CLI (gh) manquant"; exit 1; }
gh auth setup-git
if [ ! -d "$DST/.git" ]; then
  gh repo clone "$REPO" "$DST"
fi
REMOTE="$(git -C "$DST" remote get-url origin)"
case "$REMOTE" in
  *github.com/janintibo-art/Retrovault*|*github.com:janintibo-art/Retrovault*) ;;
  *) echo "Destination non reconnue : $REMOTE"; exit 1 ;;
esac
git -C "$DST" checkout main
git -C "$DST" pull --ff-only origin main
mkdir -p "$DST/quest3" "$DST/.github/workflows"
for filename in quest3/quest-controls.js quest3/verify-v38.mjs quest3/selftest-v38.mjs quest3/README.md quest3/envoi_v38.sh .github/workflows/build-quest3.yml; do
  cp "$SRC/$filename" "$DST/$filename"
done
git -C "$DST" add quest3/quest-controls.js quest3/verify-v38.mjs quest3/selftest-v38.mjs quest3/README.md quest3/envoi_v38.sh .github/workflows/build-quest3.yml
if git -C "$DST" diff --cached --quiet; then
  echo "V38 déjà envoyée."
else
  git -C "$DST" commit -m "v38 Quest : diagnostic et verification automatique"
  git -C "$DST" push origin main
fi
