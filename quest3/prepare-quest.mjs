import fs from 'node:fs';

function read(file) {
  if (!fs.existsSync(file)) throw new Error('Fichier introuvable : ' + file);
  return fs.readFileSync(file, 'utf8');
}
function write(file, contents) {
  fs.writeFileSync(file, contents, 'utf8');
}

// L'interface du zip n'est pas modifiee : uniquement une couche CSS Quest.
const indexPath = 'www/index.html';
let html = read(indexPath);
if (!/<\/head>/i.test(html)) throw new Error('index.html ne contient pas de balise head');
const viewport = '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">';
if (/<meta\b[^>]*\bname=["']viewport["'][^>]*>/i.test(html)) {
  html = html.replace(/<meta\b[^>]*\bname=["']viewport["'][^>]*>/i, viewport);
} else {
  html = html.replace(/<\/head>/i, '  ' + viewport + '\n</head>');
}
if (!html.includes('href="quest3.css"')) {
  html = html.replace(/<\/head>/i, '  <link rel="stylesheet" href="quest3.css">\n</head>');
}
if (!html.includes('src="quest-controls.js"')) {
  html = html.replace(/<\/head>/i, '  <script src="quest-controls.js" defer></script>\n</head>');
}
write(indexPath, html);
fs.copyFileSync('quest3/quest-controls.js', 'www/quest-controls.js');
write('www/quest3.css', [
  '/* Quest 3 : mode panneau 2D, sans OpenXR */',
  'html { -webkit-text-size-adjust: 110%; text-size-adjust: 110%; }',
  'body { -webkit-tap-highlight-color: transparent; overscroll-behavior: contain; }',
  ':where(button, a, input, select, textarea, [role="button"]) { touch-action: manipulation; }',
  ':where(button, a, input, select, textarea, [role="button"]):focus-visible { outline: 3px solid #4bded4; outline-offset: 3px; }',
  ''
].join('\n'));

const manifestPath = 'android/app/src/main/AndroidManifest.xml';
let manifest = read(manifestPath);
const permissions = [
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.MANAGE_EXTERNAL_STORAGE',
  'android.permission.READ_MEDIA_IMAGES',
  'android.permission.READ_MEDIA_VIDEO',
  'android.permission.READ_MEDIA_AUDIO'
];
let additions = '';
for (const name of permissions) {
  if (!manifest.includes('android:name="' + name + '"')) {
    additions += '    <uses-permission android:name="' + name + '" />\n';
  }
}
if (!manifest.includes('android:name="android.permission.WRITE_EXTERNAL_STORAGE"')) {
  additions += '    <uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />\n';
}
for (const feature of ['android.hardware.touchscreen', 'android.hardware.gamepad']) {
  if (!manifest.includes('android:name="' + feature + '"')) {
    additions += '    <uses-feature android:name="' + feature + '" android:required="false" />\n';
  }
}
if (additions) manifest = manifest.replace(/(<manifest\b[^>]*>)/i, '$1\n' + additions);
if (!manifest.includes('requestLegacyExternalStorage')) {
  manifest = manifest.replace(/<application\b/, '<application android:requestLegacyExternalStorage="true"');
}
const activity = /<activity\b[^>]*android:name=["']\.MainActivity["'][^>]*>/s;
if (!activity.test(manifest)) throw new Error('MainActivity absente du manifeste');
manifest = manifest.replace(activity, value => {
  let updated = value;
  if (!updated.includes('android:screenOrientation')) {
    updated = updated.replace(/<activity\b/, '<activity android:screenOrientation="landscape"');
  }
  if (!updated.includes('android:resizeableActivity')) {
    updated = updated.replace(/<activity\b/, '<activity android:resizeableActivity="true"');
  }
  return updated;
});
write(manifestPath, manifest);

// Meme strategie de stockage que la compilation Android actuelle : APK debug sideloade.
const variablesPath = 'android/variables.gradle';
let vars = read(variablesPath);
if (!/targetSdkVersion\s*=\s*\d+/.test(vars)) throw new Error('targetSdkVersion absent de variables.gradle');
write(variablesPath, vars.replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 29'));

const gradlePath = 'android/app/build.gradle';
let gradle = read(gradlePath);
if (!/targetSdkVersion[^\n]*/.test(gradle)) throw new Error('targetSdkVersion absent de app/build.gradle');
write(gradlePath, gradle.replace(/targetSdkVersion[^\n]*/, 'targetSdkVersion 29'));

const mainActivity = 'android/app/src/main/java/com/retrovault/quest/MainActivity.java';
if (!fs.existsSync(mainActivity)) throw new Error('MainActivity introuvable : ' + mainActivity);
write(mainActivity, [
  'package com.retrovault.quest;',
  '',
  'import android.view.View;',
  'import com.getcapacitor.BridgeActivity;',
  '',
  'public class MainActivity extends BridgeActivity {',
  '    @Override',
  '    public void onWindowFocusChanged(boolean hasFocus) {',
  '        super.onWindowFocusChanged(hasFocus);',
  '        if (hasFocus) {',
  '            getWindow().getDecorView().setSystemUiVisibility(',
  '                View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY',
  '                | View.SYSTEM_UI_FLAG_FULLSCREEN',
  '                | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION',
  '                | View.SYSTEM_UI_FLAG_LAYOUT_STABLE',
  '                | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION',
  '                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN',
  '            );',
  '        }',
  '    }',
  '}',
  ''
].join('\n'));
console.log('RetroVault Quest 3 : adaptation ecran 2D et panneau manette termines.');
