# RetroVault Quest 3

## V1 : application Android 2D dans Meta Horizon OS

Ce build utilise le meme retrovault.zip que la version Android. Il cree une application distincte (`com.retrovault.quest`) pour Meta Quest 3 et Quest 3S, en paysage et avec une interface web rendue un peu plus lisible dans un panneau 2D.

Ce n'est pas encore une application VR immersive OpenXR : l'environnement 3D avec bornes d'arcade sera une etape distincte. Les ROM, l'acces au stockage, les controles Touch/manette, la sauvegarde et les performances doivent etre testes sur le casque. Aucun jeu/ROM n'est livre.

## Compiler / telecharger

Actions > Build APK Quest 3 > Run workflow. Apres le build vert, telecharger l'artifact `RetroVault-Quest3-APK` ou la release `quest3-latest` contenant `RetroVault-Quest3.apk`.

Il s'agit d'un APK debug installe en mode developpeur, pas d'un paquet Meta Store. La compilation classique Android `.github/workflows/build-apk.yml` reste inchangee.
