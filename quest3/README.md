# RetroVault Quest 3 — V39 : bibliothèque et exploration de fichiers

RetroVault Quest est toujours une application Android **2D sur Horizon OS** et **pas** une application VR OpenXR. L'APK téléphone est conservé : le code V39 est ajouté uniquement à la compilation Quest. Le moteur original et ses émulateurs ne sont pas modifiés.

## Comment importer les jeux

1. Installer `RetroVault-Quest3.apk` issu du workflow **Build APK Quest 3**.
2. Dans le casque, copier ses ROM personnelles dans **Téléchargements / Download** par le moyen de son choix.
3. Démarrer RetroVault Quest et toucher **🎮 Jeux** (coin supérieur gauche).
4. Choisir **📂 Parcourir les fichiers**. Le composant de fichiers Android de Capacitor (`input type=file`, système Android) demande de choisir une ROM. La sélection multiple est possible si le fournisseur de documents le prend en charge.
5. Les fichiers choisis sont **copiés dans une bibliothèque IndexedDB propre à l'application**, rangés par familles selon leurs extensions. Rechercher, filtrer par console, mettre en favori ou retirer une copie locale.
6. Pour **▶ Jouer**, ouvrir d'abord le menu de la console voulue dans l'interface RetroVault, puis dans **🎮 Jeux**, toucher le titre puis **▶ Jouer**. La bibliothèque tente de transmettre le fichier au champ HTML d'import du moteur original par `DataTransfer` et les événements `input`/`change`.

**Important** : ce dernier transfert est une intégration expérimentale. L'importeur du moteur original est distribué dans `retrovault.zip`, dont les sources ne sont pas modifiées ici. Si le champ d'import n'est pas présent, ou si le moteur ne répond pas aux événements HTML, le bouton indique le problème au lieu d'annoncer que le jeu est lancé. Dans ce cas, utiliser l'importateur d'origine et fournir un retour pour l'intégration directe.

## Comportement et limites

- Explorateur = **sélecteur de fichiers système Android**. Il ne parcourt pas librement tout l'espace de stockage et ne permet pas encore l'ajout automatique d'un dossier entier.
- Le stockage des copies est dans **IndexedDB**, limité par la capacité/quota WebView. Les fichiers de plus de **512 Mo chacun** sont refusés pour protéger le stockage. Les gros jeux à images disque peuvent donc être exclus de cette V39.
- Les catégories (NES, SNES, GB, GBA, Mega Drive, N64, etc.) sont déduites de l'extension. Il ne s'agit **pas d'une garantie de compatibilité des émulateurs**. `.zip` et `.7z` sont classés « Archives / arcade », sans décompression ajoutée.
- Le fichier d'origine dans Download n'est pas supprimé lors du retrait de sa copie locale. En revanche, **désinstaller ou effacer les données de RetroVault Quest peut effacer sa bibliothèque**. Garder ses jeux originaux séparément.
- Aucune ROM, BIOS, jeu commercial ou téléchargement de jeux n'est livré. Utiliser des fichiers que l'on a le droit d'utiliser.
- Le lancement dépend du menu de la console en cours et de la WebView. Les contrôleurs Touch, le pointeur, le sélecteur, les sauvegardes, l'audio et les FPS doivent être testés sur **Meta Quest 3**.

## Vérification

Avant compilation, GitHub Actions exécute les tests V38 et V39 (`selftest-v39.mjs`, `verify-v39.mjs`) et contrôle les ressources HTML/JS après préparation Android. Cela vérifie le package et la logique, **pas l'utilisation sur le casque**.

En cas d'erreur, fournir une capture du message dans **🎮 Jeux** et les journaux du workflow `Build APK Quest 3`.
