# RetroVault Quest 3 — V38

Application **Android 2D dans un panneau Horizon OS** pour Quest 3 / Quest 3S, distincte de l'application téléphone. Le moteur d'émulation est réutilisé depuis `retrovault.zip` (aucune ROM fournie). **Il ne s'agit pas d'une application VR OpenXR** et il n'y a pas encore de salle d'arcade 3D.

## Nouveautés V38

- **Réglages ⚙ Quest** : boutons et affichage Zoom 100 / 115 / 130 % conservés depuis V37.
- **Navigation dans le panneau** (si l'option navigation manette est activée) : stick gauche ou croix directionnelle pour choisir, bouton A pour activer, bouton B pour fermer le panneau. Les menus de l'émulateur restent prioritaires en jeu ; la navigation s'arrête quand un grand canvas est visible.
- **Diagnostic partageable** : `⚙ Quest` > `Lancer le diagnostic` > `Copier le rapport`. Vérifie les caractéristiques d'écran, WebGL, Web Audio, la disponibilité du stockage local, l'API Gamepad et les contrôleurs visibles. Rapport local, sans inspection des ROM, des sauvegardes ou de leurs noms.
- Fallback si le presse-papiers n'est pas exposé : le texte du rapport reste sélectionnable et copiable dans le panneau.
- **Auto-vérification GitHub** de l'assemblage : présence du script, du CSS, du mode paysage, du manifeste Android et de la MainActivity. Le workflow échoue avant la compilation si l'injection est cassée.

## Limites importantes

- Certains contrôleurs Touch peuvent être invisibles depuis la WebView Android. L'API Gamepad permet uniquement un diagnostic et une navigation expérimentale, **pas une compatibilité garantie avec tous les jeux**.
- Les tests automatiques vérifient le **package et ses fichiers**, pas le rendu dans le casque ni l'exécution réelle d'une ROM.
- Le diagnostic ne teste pas la lecture de fichiers ROM : le stockage local HTML n'est pas le stockage Android des ROM.
- Aucun moteur VR OpenXR n'est utilisé dans ce build.

## Compilation

GitHub Actions > **Build APK Quest 3** (workflow indépendant) ou onglet Releases > `quest3-latest` > `RetroVault-Quest3.apk` après compilation verte. APK debug pour installation manuelle.

## Tests ce soir

1. Lancer RetroVault Quest 3, vérifier que ⚙ Quest apparaît en haut à droite.
2. Vérifier les trois tailles et revenir à **100 %** avant d'essayer une ROM.
3. Lancer le diagnostic, essayer **Copier le rapport** puis, si besoin, partager le texte ou une capture.
4. Si une manette est détectée, activer **Navigation dans les menus**, tester croix/stick, A puis B dans le panneau.
5. Vérifier la lecture d'une ROM personnelle, le son, la fluidité et les sauvegardes (pas vérifiés dans GitHub Actions).

## Étape future

Pour une vraie salle d'arcade immersive avec bornes 3D, il faudra réaliser un frontal natif OpenXR. Le jeu RetroVault HTML et les émulateurs devront alors être reliés à une surface VR, ce qui n'est pas accompli dans la V38.
