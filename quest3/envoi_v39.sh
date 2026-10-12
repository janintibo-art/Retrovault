#!/usr/bin/env bash
set -euo pipefail
SRC="$HOME/retrovault"
DST="$HOME/retrovault_quest3_git"
REPO="janintibo-art/Retrovault"
FILES=(quest3/quest-library.js quest3/quest-controls.js quest3/prepare-quest.mjs quest3/selftest-v39.mjs quest3/verify-v39.mjs quest3/README.md quest3/envoi_v39.sh .github/workflows/build-quest3.yml)
for f in "${FILES[@]}"; do
  test -f "$SRC/$f" || { echo "Fichier manquant : $SRC/$f"; exit 1; }
done
command -v gh >/dev/null || { echo "Commande GitHub gh absente"; exit 1; }
gh auth setup-git
if [ ! -d "$DST/.git" ]; then
  gh repo clone "$REPO" "$DST"
fi
REMOTE="$(git -C "$DST" remote get-url origin)"
case "$REMOTE" in
 *github.com/janintibo-art/Retrovault*|*github.com:janintibo-art/Retrovault*) ;;
 *) echo "Dépôt distant incorrect : $REMOTE"; exit 1 ;;
esac
# Ne pas toucher aux autres projets locaux ni au zip d'origine du projet.
git -C "$DST" checkout main
git -C "$DST" pull --ff-only origin main
mkdir -p "$DST/quest3" "$DST/.github/workflows"
for f in "${FILES[@]}"; do cp "$SRC/$f" "$DST/$f"; done
if command -v node >/dev/null 2>&1; then
  node --check "$DST/quest3/quest-library.js"
  node --check "$DST/quest3/prepare-quest.mjs"
  (cd "$DST" && node quest3/selftest-v39.mjs)
else
  echo "Node non installé sur Termux : tests effectués par GitHub Actions."
fi
git -C "$DST" add -- "${FILES[@]}"
if git -C "$DST" diff --cached --quiet; then
  echo "V39 déjà envoyée : aucun changement."
else
  git -C "$DST" commit -m "v39 Quest : explorateur ROM et bibliothèque par console"
  git -C "$DST" push origin main
fi
