# RetroVault Quest 3 — V37

RetroVault Quest est une application Android **2D dans un panneau Horizon OS** pour Meta Quest 3 / Quest 3S. Son moteur de jeu vient toujours de `retrovault.zip`, sans changer la version téléphone.

## Nouveautés V37

Un petit bouton **⚙ Quest**, en haut à droite de l'application, ouvre un panneau utilisable au pointeur :

- Échelle de l'écran 100 %, 115 %, 130 %, mémorisée uniquement dans l'application Quest. En cas de décalage d'une zone de jeu, revenir à 100 %.
- Diagnostic des manettes reconnues par l'API `navigator.getGamepads` (identifiant, mapping, boutons et axes). Certains contrôleurs de Quest ne seront pas visibles depuis une application Android 2D.
- Navigation **facultative** à la manette dans les menus HTML : croix/stick gauche pour choisir, bouton A pour valider. Désactivée par défaut et suspendue lorsqu'un grand canvas de jeu est affiché pour éviter les actions parasites. Fonctionnalité expérimentale dépendant des contrôles réels de RetroVault.
- Gros boutons et meilleur contraste dans le panneau, sans retoucher les émulateurs.

Le bouton ouvre également le diagnostic lors de l'utilisation des contrôleurs Touch, mais **n'apporte pas automatiquement une compatibilité Touch** si Meta Horizon OS ne les expose pas à la WebView. Pour la vraie navigation VR, la prochaine étape sera l'interface native OpenXR.

## Compiler et installer

GitHub Actions > **Build APK Quest 3** > `Run workflow` puis télécharger `RetroVault-Quest3.apk` depuis la release `quest3-latest` ou l'artifact `RetroVault-Quest3-APK`. La version Android classique garde son workflow.

## Tests à réaliser sur le casque

1. Démarrer RetroVault Quest et ouvrir **⚙ Quest**.
2. Vérifier les 3 tailles, notamment la remise à 100 %.
3. Associer une manette Bluetooth et consulter le diagnostic (Touch à vérifier aussi).
4. Tester l'option navigation dans la bibliothèque, puis une ROM personnelle, son audio et ses sauvegardes.
5. Si la page ne détecte pas les touches, le signaler : l'étape suivante nécessitera un pont de contrôles natif Android.

Aucune ROM n'est incluse. La V37 n'est pas une salle VR 3D et n'utilise pas OpenXR.
