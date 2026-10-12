#!/usr/bin/env bash
set -euo pipefail
SRC="$HOME/retrovault/quest3"
DST="$HOME/retrovault_quest3_git"
REPO="janintibo-art/Retrovault"
for name in prepare-quest.mjs quest-controls.js README.md envoi_v37.sh; do
  test -f "$SRC/$name" || { echo "Fichier manquant : $SRC/$name"; exit 1; }
done
command -v gh >/dev/null || { echo "GitHub CLI (gh) indisponible"; exit 1; }
gh auth setup-git
if [ ! -d "$DST/.git" ]; then
  gh repo clone "$REPO" "$DST"
fi
REMOTE="$(git -C "$DST" remote get-url origin)"
case "$REMOTE" in
  *github.com/janintibo-art/Retrovault*|*github.com:janintibo-art/Retrovault*) ;;
  *) echo "Dossier $DST non lié au dépôt RetroVault : $REMOTE"; exit 1;;
esac
git -C "$DST" checkout main
git -C "$DST" pull --ff-only origin main
mkdir -p "$DST/quest3"
cp "$SRC/prepare-quest.mjs" "$SRC/quest-controls.js" "$SRC/README.md" "$SRC/envoi_v37.sh" "$DST/quest3/"
git -C "$DST" add quest3/prepare-quest.mjs quest3/quest-controls.js quest3/README.md quest3/envoi_v37.sh
if git -C "$DST" diff --cached --quiet; then
  echo "V37 déjà présente : aucun changement à envoyer."
else
  git -C "$DST" commit -m "v37 Quest : lisibilité et manettes"
  git -C "$DST" push origin main
fi
