// Tests de logique de classement sans WebView Android ni casque.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code = fs.readFileSync('quest3/quest-library.js', 'utf8');
const exposed = {};
vm.runInNewContext(code, {
  window: {}, globalThis: { __rvQuestLibraryTests: exposed }
}, {filename:'quest-library.js'});
assert.equal(exposed.classify('SUPER MARIO.NES'),'NES');
assert.equal(exposed.classify('zelda.sfc'),'Super Nintendo');
assert.equal(exposed.classify('tetris.gb'),'Game Boy');
assert.equal(exposed.classify('kirby.gbc'),'Game Boy Color');
assert.equal(exposed.classify('zelda.gba'),'Game Boy Advance');
assert.equal(exposed.classify('Sonic.gen'),'Mega Drive');
assert.equal(exposed.classify('crazy.n64'),'Nintendo 64');
assert.equal(exposed.classify('archive.zip'),'Archives / arcade');
assert.equal(exposed.classify('random.bin'),'Autres formats');
assert.equal(exposed.classify('game without extension'),'Autres formats');
assert.equal(exposed.sizeLabel(1048576),'1.0 Mo');
assert.notEqual(exposed.idFor({name:'game.nes',size:12,lastModified:1}),exposed.idFor({name:'game.nes',size:13,lastModified:1}));
assert.match(code,/new File\(/);
assert.match(code,/new DataTransfer\(/);
assert.match(code,/dispatchEvent\(new Event\('change'/);
assert.match(code,/indexedDB\.open\(DB_NAME/);
assert.match(code,/input\[type="file"\]/);
assert.match(code,/document\.createElement\('button'\)/);
assert.doesNotMatch(code,/fetch\(|XMLHttpRequest|WebSocket/);
console.log('QUEST V39 OK : familles ROM, unicité des clés, stockage privé et interface de transfert.');
console.log('Vérification réelle des permissions Android, du sélecteur et des émulateurs : NON effectuée.');
