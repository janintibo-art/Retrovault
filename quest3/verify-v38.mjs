// Vérification statique du projet Quest généré, exécutée sur GitHub Actions.
// Aucun casque requis. Ce test ne prétend pas vérifier les ROM ou OpenXR.
import fs from 'node:fs';
import assert from 'node:assert/strict';

const read = (name) => fs.readFileSync(name, 'utf8');
const html = read('www/index.html');
const js = read('www/quest-controls.js');
const css = read('www/quest3.css');
const manifest = read('android/app/src/main/AndroidManifest.xml');
const gradle = read('android/variables.gradle');
const activity = read('android/app/src/main/java/com/retrovault/quest/MainActivity.java');
const matchCount = (s, pattern) => (s.match(pattern) || []).length;

assert.equal(matchCount(html, /src=["']quest-controls\.js["']/g), 1, 'Script Quest injecté exactement une fois');
assert.equal(matchCount(html, /href=["']quest3\.css["']/g), 1, 'CSS Quest injecté exactement une fois');
assert.match(html, /name=["']viewport["']/i, 'Viewport mobile présent');
assert.ok(js.includes('RetroVault Quest V38'), 'Le bon script V38 est intégré');
assert.ok(js.includes('Lancer le diagnostic'), 'Outil diagnostic accessible');
assert.ok(js.includes('Copier le rapport'), 'Copie du rapport accessible');
assert.ok(js.includes('function nextTarget'), 'Navigation manette conservée');
assert.ok(css.includes('text-size-adjust'), 'Lisibilité Quest conservée');
assert.match(manifest, /android:screenOrientation="landscape"/, 'Mode paysage activé');
assert.match(manifest, /android:resizeableActivity="true"/, 'Panneau redimensionnable');
assert.match(manifest, /android\.hardware\.touchscreen" android:required="false"/, 'Pas de touchscreen imposé');
assert.match(manifest, /android\.hardware\.gamepad" android:required="false"/, 'Pas de manette imposée');
assert.match(gradle, /targetSdkVersion\s*=\s*29/, 'SDK de test inchangé');
assert.match(activity, /class MainActivity extends BridgeActivity/, 'MainActivity conservée');
assert.match(activity, /SYSTEM_UI_FLAG_FULLSCREEN/, 'Interface plein écran');
console.log('TESTS QUEST V38 OK : intégration, affichage, contrôles, manifeste Android.');
console.log('Tests physiques Quest, moteur d’émulation, ROM et OpenXR : NON effectués.');
