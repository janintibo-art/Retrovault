/* RetroVault Quest V39 - Bibliothèque locale et sélecteur de documents Android.
 * Uniquement installé dans la version Quest. Aucune ROM n'est fournie.
 * La compatibilité avec le moteur original dépend de ses entrées HTML fichier.
 */
(() => {
  'use strict';
  if (window.__retroVaultQuestLibraryV39) return;
  window.__retroVaultQuestLibraryV39 = true;

  const families = Object.freeze({
    '.nes':'NES', '.fds':'NES', '.unf':'NES', '.unif':'NES',
    '.sfc':'Super Nintendo', '.smc':'Super Nintendo',
    '.gb':'Game Boy', '.gbc':'Game Boy Color', '.gba':'Game Boy Advance',
    '.md':'Mega Drive', '.gen':'Mega Drive', '.smd':'Mega Drive',
    '.sms':'Master System', '.gg':'Game Gear',
    '.z64':'Nintendo 64', '.n64':'Nintendo 64', '.v64':'Nintendo 64',
    '.pce':'PC Engine', '.ws':'WonderSwan', '.wsc':'WonderSwan Color',
    '.cue':'CD / image disque', '.chd':'CD / image disque', '.iso':'CD / image disque',
    '.cso':'CD / image disque', '.pbp':'CD / image disque',
    '.zip':'Archives / arcade', '.7z':'Archives / arcade'
  });
  function extension(name) {
    const match = String(name || '').toLowerCase().match(/\.[a-z0-9]+$/);
    return match ? match[0] : '';
  }
  function classify(name) { return families[extension(name)] || 'Autres formats'; }
  function sizeLabel(n) {
    const v = Number(n) || 0;
    return v < 1024 ? v + ' o' : v < 1024 * 1024 ? (v / 1024).toFixed(1) + ' Ko' : (v / (1024 * 1024)).toFixed(1) + ' Mo';
  }
  function idFor(file) {
    return [file.name, Number(file.size) || 0, Number(file.lastModified) || 0].join('::');
  }
  // Accessible uniquement aux tests hors navigateur.
  if (globalThis.__rvQuestLibraryTests) {
    Object.assign(globalThis.__rvQuestLibraryTests, { extension, classify, sizeLabel, idFor });
    return;
  }

  const DB_NAME = 'retrovault-quest-roms-v39';
  const MAX_FILE_SIZE = 512 * 1024 * 1024;
  let dbPromise;
  function dbOpen() {
    if (!window.indexedDB) return Promise.reject(new Error('IndexedDB indisponible sur ce casque.'));
    if (!dbPromise) dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('roms')) db.createObjectStore('roms', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs', { keyPath: 'id' });
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Ouverture de la bibliothèque impossible.'));
      request.onblocked = () => reject(new Error('Stockage occupé : fermer les autres instances de RetroVault.'));
    }).catch(err => { dbPromise = undefined; throw err; });
    return dbPromise;
  }
  async function query(store, method, value) {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store)[method](value);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error || new Error('Lecture impossible.'));
    });
  }
  async function putROM(file) {
    if (!file || !file.name || !file.size) throw new Error('Fichier vide ou non reconnu.');
    if (file.size > MAX_FILE_SIZE) throw new Error(file.name + ' est trop volumineux (maximum 512 Mo par ROM).');
    const id = idFor(file);
    if (await query('roms', 'get', id)) return false;
    const db = await dbOpen();
    const meta = { id, name: file.name, size: file.size, type: file.type || '', modified: file.lastModified || 0,
      system: classify(file.name), favorite: false, added: Date.now(), played: 0 };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['roms', 'blobs'], 'readwrite');
      tx.objectStore('roms').put(meta);
      tx.objectStore('blobs').put({ id, blob: file });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error || new Error('Écriture impossible : stockage plein ?'));
      tx.onabort = () => reject(tx.error || new Error('Import annulé ou stockage plein.'));
    });
  }
  async function updateMeta(meta) {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('roms', 'readwrite');
      tx.objectStore('roms').put(meta);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Mise à jour impossible.'));
      tx.onabort = () => reject(tx.error || new Error('Mise à jour annulée.'));
    });
  }
  async function removeROM(id) {
    const db = await dbOpen();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(['roms', 'blobs'], 'readwrite');
      tx.objectStore('roms').delete(id);
      tx.objectStore('blobs').delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Suppression impossible.'));
      tx.onabort = () => reject(tx.error || new Error('Suppression annulée.'));
    });
  }
  const host = document.createElement('div');
  host.id = 'retrovault-quest-library-v39';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483100;pointer-events:none;';
  const shadow = host.attachShadow({ mode:'open' });
  shadow.innerHTML = `
    <style>
      :host { all:initial; color-scheme:dark; font-family:system-ui,sans-serif; }
      * { box-sizing:border-box; }
      [hidden] { display:none !important; }
      button,input { font:inherit; }
      button { min-height:48px; padding:10px 13px; color:#f0f8ff; border-radius:12px;
        background:#273754; border:1px solid #7189b4; cursor:pointer; font-weight:650; }
      button:focus-visible,input:focus-visible { outline:3px solid #76e4d8; outline-offset:3px; }
      button:disabled { opacity:.45; cursor:not-allowed; }
      #open { position:fixed; left:14px; top:max(12px,env(safe-area-inset-top));
        pointer-events:auto; background:#172f43; border-color:#54cdb8; font-size:17px;
        box-shadow:0 6px 24px #0008; }
      #panel { position:fixed; left:12px; right:12px; top:72px; margin:auto;
        width:min(720px,calc(100vw - 24px)); max-height:calc(100vh - 86px);
        overflow-y:auto; overscroll-behavior:contain; pointer-events:auto;
        padding:18px; color:#eef8ff; background:#121b32f9;
        border:1px solid #587aa3; border-radius:20px; box-shadow:0 16px 55px #000a; }
      h2 { margin:0 0 4px; font-size:23px; }
      h3 { font-size:17px; margin:18px 0 8px; }
      p { font-size:14px; line-height:1.5; margin:7px 0; color:#cbdcf4; }
      .top,.tools,.actions,.chips { display:flex; flex-wrap:wrap; gap:9px; align-items:center; }
      .top { justify-content:space-between; }
      .chips { margin:12px 0; }
      .chips button { min-height:42px; font-size:13px; }
      .chips button[aria-pressed='true'] { background:#125951; border-color:#5de6cb; }
      .tools { margin:14px 0; }
      .tools button:first-child { background:#135d59; border-color:#65dacc; }
      #search { display:block; width:100%; min-height:48px; margin:9px 0;
        padding:10px 12px; color:white; border:1px solid #819abd;
        border-radius:12px; background:#0b1427; font-size:16px; }
      .item { display:flex; align-items:center; flex-wrap:wrap; gap:10px;
        margin:9px 0; padding:12px; border:1px solid #435d80; border-radius:15px;
        background:#1a2a43; }
      .item .info { flex:1; min-width:155px; overflow-wrap:anywhere; }
      .name { font-size:16px; font-weight:700; color:#fff; }
      .sub { font-size:12px; color:#bacee8; }
      .actions button { font-size:13px; min-height:44px; padding:8px 10px; }
      .actions .play { background:#135d59; border-color:#5bdcc9; }
      .actions .danger { background:#5f2b36; border-color:#b66d75; }
      .notice { margin:10px 0; padding:12px; border-radius:12px; background:#263451;
        border:1px solid #435879; font-size:14px; line-height:1.45;
        white-space:pre-wrap; overflow-wrap:anywhere; }
      .hint { color:#bacee8; font-size:13px; }
      .total { font-variant-numeric:tabular-nums; }
    </style>
    <button type="button" id="open" aria-expanded="false" aria-controls="panel">🎮 Jeux</button>
    <section id="panel" role="dialog" aria-modal="false" aria-label="Bibliothèque ROM RetroVault Quest 3" hidden>
      <div class="top"><div><h2>Bibliothèque Quest</h2><p>Importer des ROM depuis les fichiers du casque</p></div>
        <button id="close" type="button">Fermer ✕</button></div>
      <div class="tools">
        <button id="browse" type="button">📂 Parcourir les fichiers</button>
        <button id="refresh" type="button">↻ Actualiser</button>
      </div>
      <input id="filepick" type="file" multiple hidden aria-label="Choisir des ROM" />
      <p class="hint">L'explorateur Android permet de sélectionner des fichiers, notamment depuis Téléchargements (Download). Plusieurs fichiers peuvent être choisis si le fournisseur le permet.</p>
      <div id="status" class="notice" role="status" aria-live="polite">Bibliothèque en cours de chargement…</div>
      <input id="search" type="search" placeholder="Rechercher un jeu…" aria-label="Rechercher dans la bibliothèque" />
      <div id="chips" class="chips" role="group" aria-label="Filtrer par console"></div>
      <p id="total" class="hint total"></p>
      <div id="list" aria-label="Liste des ROM importées"></div>
      <p class="hint">Les fichiers importés sont copiés dans le stockage privé de cette application. Effacer une entrée ne supprime pas l'original dans Download. Désinstaller l'application peut supprimer cette bibliothèque : gardez vos ROM originales ailleurs.</p>
      <p class="hint">Les catégories proviennent des extensions ; elles ne garantissent pas que chaque console ou format soit pris en charge par RetroVault. Aucun jeu n'est fourni.</p>
    </section>`;
  document.body.appendChild(host);
  const $ = id => shadow.getElementById(id);
  let all = [], filter = 'Toutes', opened = false, deletePending = '', busy = false;
  let raf = 0, prevA = false, prevB = false, prevDir = '', lastMove = 0;
  function status(msg) { $('status').textContent = msg; }
  function btn(title, action, className) {
    const node = document.createElement('button');
    node.type = 'button'; node.textContent = title;
    if (className) node.className = className;
    node.addEventListener('click', action);
    return node;
  }
  async function load() {
    try {
      all = await query('roms', 'getAll');
      all.sort((a,b) => (b.favorite - a.favorite) || (b.added - a.added) || a.name.localeCompare(b.name));
      render();
    } catch(e) { status('Bibliothèque indisponible : ' + e.message); }
  }
  function render() {
    const search = $('search').value.trim().toLocaleLowerCase();
    const categories = ['Toutes', ...new Set(all.map(x => x.system))].sort((a,b) => a === 'Toutes' ? -1 : b === 'Toutes' ? 1 : a.localeCompare(b));
    if (!categories.includes(filter)) filter = 'Toutes';
    $('chips').replaceChildren();
    for (const category of categories) {
      const chip = btn(category, () => {filter = category; render();});
      chip.setAttribute('aria-pressed', String(filter === category));
      $('chips').appendChild(chip);
    }
    const used = all.reduce((sum,x) => sum + x.size,0);
    $('total').textContent = `${all.length} jeu(x) · ${sizeLabel(used)} en copies locales`;
    const selected = all.filter(x => (filter === 'Toutes' || filter === x.system) && x.name.toLocaleLowerCase().includes(search));
    const list = $('list');
    list.replaceChildren();
    if (!selected.length) {
      const empty = document.createElement('p');
      empty.textContent = all.length ? 'Aucun résultat pour ce filtre.' : 'Aucun jeu importé. Choisissez « Parcourir les fichiers ».';
      list.appendChild(empty);
      return;
    }
    for (const entry of selected) {
      const line = document.createElement('div'); line.className = 'item';
      const info = document.createElement('div'); info.className = 'info';
      const name = document.createElement('div'); name.className = 'name'; name.textContent = entry.name;
      const sub = document.createElement('div'); sub.className = 'sub';
      sub.textContent = entry.system + ' · ' + sizeLabel(entry.size) + (entry.favorite ? ' · ★ Favori' : '');
      info.append(name,sub);
      const actions = document.createElement('div'); actions.className = 'actions';
      actions.append(
        btn('▶ Jouer', () => launchROM(entry.id), 'play'),
        btn(entry.favorite ? '★' : '☆', async () => {
          try { entry.favorite = !entry.favorite; await updateMeta(entry); await load(); }
          catch (e) { status('Favori non sauvegardé : ' + e.message); }
        }),
        btn(deletePending === entry.id ? 'Confirmer' : 'Retirer', async () => {
          if (deletePending !== entry.id) { deletePending = entry.id; render(); return; }
          try { await removeROM(entry.id); deletePending = ''; status('Copie locale retirée. Fichier source conservé.'); await load(); }
          catch (e) { status('Suppression impossible : ' + e.message); }
        }, 'danger')
      );
      line.append(info,actions); list.appendChild(line);
    }
  }
  async function addFiles(list) {
    if (busy) return;
    busy = true; $('browse').disabled = true;
    const files = Array.from(list || []);
    let added = 0, skipped = 0, errors = [];
    for (let i=0; i<files.length; i++) {
      const file=files[i];
      status(`Import ${i + 1}/${files.length} : ${file.name} (${sizeLabel(file.size)})…`);
      try { if (await putROM(file)) added++; else skipped++; }
      catch(e) { errors.push(file.name + ' : ' + e.message); }
    }
    busy = false; $('browse').disabled = false;
    status(`${added} jeu(x) importé(s) ; ${skipped} déjà présent(s).` + (errors.length ? '\n' + errors.slice(0,4).join('\n') : '') + '\nLe lancement dépend de l’importateur original RetroVault.');
    await load();
  }
  $('browse').addEventListener('click', () => {
    if (busy) return;
    try { $('filepick').click(); }
    catch(e) { status('Sélecteur Android indisponible : ' + e.message); }
  });
  $('filepick').addEventListener('change', async () => {
    const files = Array.from($('filepick').files || []);
    $('filepick').value = '';
    if (files.length) await addFiles(files);
    else status('Aucun fichier sélectionné.');
  });
  $('search').addEventListener('input', render);
  $('refresh').addEventListener('click', load);

  function eligibleInputs(file) {
    const ext = extension(file.name);
    return Array.from(document.querySelectorAll('input[type="file"]')).filter(input => {
      if (!input.isConnected || input.disabled) return false;
      const accept = String(input.accept || '').trim().toLowerCase();
      return !accept || accept === '*/*' || accept.split(',').some(a => a.trim() === ext || a.trim() === 'application/octet-stream');
    });
  }
  async function launchROM(id) {
    try {
      const meta = await query('roms', 'get', id);
      if (!meta) throw new Error('Le jeu a été supprimé.');
      const stored = await query('blobs', 'get', id);
      if (!stored || !stored.blob) throw new Error('Copie locale introuvable.');
      const file = new File([stored.blob], meta.name, { type: meta.type || 'application/octet-stream', lastModified: meta.modified || Date.now() });
      const candidates = eligibleInputs(file);
      if (!candidates.length) {
        status('ROM conservée dans la bibliothèque, mais aucun champ d’import RetroVault compatible n’est présent.\nOuvre d’abord la console voulue et son menu « Importer / Ouvrir une ROM », puis réessaie « Jouer ». Si le moteur n’utilise pas d’entrée HTML fichier, il faudra adapter son importeur directement.');
        return;
      }
      if (typeof DataTransfer === 'undefined') {
        status('Cette WebView ne permet pas la réinjection des fichiers (DataTransfer absent). Utilise « Importer » dans le menu original RetroVault.');
        return;
      }
      const destination = candidates[0];
      const transfer = new DataTransfer(); transfer.items.add(file);
      destination.files = transfer.files;
      destination.dispatchEvent(new Event('input', {bubbles:true}));
      destination.dispatchEvent(new Event('change', {bubbles:true}));
      meta.played = Date.now(); await updateMeta(meta);
      close();
      status('Fichier transmis à l’entrée de RetroVault. Vérifie que le jeu démarre : le moteur original n’envoie pas de confirmation à cette bibliothèque.');
    } catch(e) { status('Impossible de transmettre la ROM : ' + e.message); }
  }
  function pad() {
    try { return Array.from(navigator.getGamepads?.() || []).find(p => p?.connected) || null; }
    catch (_) { return null; }
  }
  function dirFor(p) {
    const button = i => !!p.buttons[i]?.pressed;
    return button(12) || (p.axes[1] ?? 0) < -.7 ? 'up' : button(13) || (p.axes[1] ?? 0) > .7 ? 'down' :
      button(14) || (p.axes[0] ?? 0) < -.7 ? 'left' : button(15) || (p.axes[0] ?? 0) > .7 ? 'right' : '';
  }
  function navigate(dir) {
    const buttons = Array.from(shadow.querySelectorAll('#panel button:not([disabled]), #panel input:not([type="file"])'))
      .filter(node => { const rect=node.getBoundingClientRect(); return rect.width>0 && rect.height>0; });
    if (!buttons.length) return;
    const active = shadow.activeElement;
    let index = buttons.indexOf(active);
    index = (index + ((dir === 'up' || dir === 'left') ? -1 : 1) + buttons.length) % buttons.length;
    buttons[index].focus({preventScroll:false});
  }
  function tick(now) {
    raf=0;
    if (!opened) return;
    const p=pad();
    if (p) {
      const a=!!p.buttons[0]?.pressed, b=!!p.buttons[1]?.pressed, dir=dirFor(p);
      if (dir && (dir !== prevDir || now-lastMove>260)) {navigate(dir);lastMove=now;}
      if (a && !prevA) {
        const target=shadow.activeElement;
        if (target?.tagName === 'BUTTON' && !target.disabled) target.click();
      }
      if (b && !prevB) close();
      prevA=a;prevB=b;prevDir=dir;
    }
    raf=requestAnimationFrame(tick);
  }
  function open() {
    opened=true;window.__retroVaultLibraryOpen=true;
    $('panel').hidden=false;$('open').setAttribute('aria-expanded','true');
    $('browse').focus({preventScroll:true});
    load(); if (!raf) raf=requestAnimationFrame(tick);
  }
  function close() {
    opened=false;window.__retroVaultLibraryOpen=false;
    $('panel').hidden=true;$('open').setAttribute('aria-expanded','false');
    $('open').focus({preventScroll:true});
    if (raf) {cancelAnimationFrame(raf);raf=0;}
    prevA=false;prevB=false;prevDir='';
  }
  $('open').addEventListener('click', () => opened ? close() : open());
  $('close').addEventListener('click', close);
  shadow.addEventListener('keydown', e => {
    if (opened && e.key === 'Escape') { e.stopPropagation();close(); }
  });
  window.__retroVaultLibraryOpen = false;
  // Le contenu chargé reste strictement local (IndexedDB). Aucune connexion réseau.
})();
