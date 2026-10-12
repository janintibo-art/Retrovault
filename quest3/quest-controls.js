/* RetroVault Quest V37. Ne s'execute que dans l'APK Quest, pas dans l'APK Android. */
(() => {
  'use strict';
  if (window.__retroVaultQuestV37) return;
  window.__retroVaultQuestV37 = true;

  const storageKey = 'retrovault.quest.scale.v37';
  const host = document.createElement('div');
  host.id = 'retrovault-quest-v37';
  host.style.cssText = 'position:fixed;inset:0;z-index:2147483000;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'open' });
  shadow.innerHTML = `
    <style>
      :host { all: initial; color-scheme: dark; font-family: system-ui, sans-serif; }
      * { box-sizing: border-box; }
      .open {
        position: fixed; top: max(12px,env(safe-area-inset-top)); right: 14px;
        min-width: 54px; min-height: 48px; border: 1px solid #75c7dc;
        color: #f7fbff; background: rgba(20,25,49,.97);
        border-radius: 16px; padding: 8px 14px; font-size: 16px;
        font-weight: 750; box-shadow: 0 8px 28px rgba(0,0,0,.42);
        pointer-events: auto; cursor: pointer;
      }
      .panel {
        position: fixed; top: 72px; right: 14px; width: min(400px,calc(100vw - 28px));
        max-height: min(78vh,630px); overflow: auto; overscroll-behavior: contain;
        padding: 17px; border-radius: 18px; border: 1px solid #6381c1;
        color: #f7fbff; background: #111629f5;
        box-shadow: 0 16px 50px rgba(0,0,0,.65); pointer-events: auto;
      }
      [hidden] { display: none !important; }
      h2 { font-size: 22px; margin: 0 0 6px; }
      h3 { font-size: 16px; margin: 20px 0 6px; }
      p { line-height: 1.5; font-size: 14px; margin: 8px 0; color: #dbe6f7; }
      .secondary { color: #bad1ef; font-size: 13px; }
      .status { background: #202c49; padding: 9px 11px; border-radius: 10px;
        white-space: pre-wrap; word-break: break-word; }
      .btns { display: flex; flex-wrap: wrap; gap: 8px; margin: 9px 0; }
      .btns button { font-size: 16px; font-weight: 650; min-height: 48px;
        padding: 9px 15px; border-radius: 11px; border: 1px solid #7994c6;
        background: #293754; color: white; cursor: pointer; }
      button:focus-visible { outline: 3px solid #78e9db; outline-offset: 3px; }
      button[aria-pressed="true"] { background: #125a56; border-color: #54dcd1; }
      .line { border-top: 1px solid #495575; margin-top: 15px; padding-top: 12px; }
      .live { color: #81f2d1; font-variant-numeric: tabular-nums; }
    </style>
    <button id="launch" class="open" type="button" aria-controls="panel" aria-expanded="false" aria-label="Ouvrir les réglages Quest 3">⚙ Quest</button>
    <section id="panel" class="panel" aria-label="Réglages RetroVault Quest 3" hidden>
      <h2>RetroVault Quest 3</h2>
      <p class="secondary">Réglages locaux au casque · affichage en panneau 2D</p>
      <h3>Lisibilité de l'écran</h3>
      <div class="btns" role="group" aria-label="Zoom de l'application">
        <button type="button" id="z100" aria-pressed="true">100 %</button>
        <button type="button" id="z115" aria-pressed="false">115 %</button>
        <button type="button" id="z130" aria-pressed="false">130 %</button>
      </div>
      <p class="secondary">Si un jeu dépasse de l'écran, revenir à 100 %.</p>
      <div class="line">
        <h3>Diagnostic des manettes</h3>
        <p id="gamepads" class="status" aria-live="polite">Recherche des contrôleurs…</p>
        <p id="pressed" class="secondary live">Appuyez sur une touche de la manette.</p>
      </div>
      <div class="line">
        <h3>Navigation dans les menus</h3>
        <p>Option expérimentale : croix ou stick gauche pour sélectionner, bouton A pour valider. Désactivée pendant l'affichage d'un jeu sur canvas.</p>
        <div class="btns"><button id="navigate" type="button" aria-pressed="false">Activer navigation</button></div>
        <p id="nav-status" class="secondary">Désactivée par défaut pour ne pas gêner les jeux.</p>
      </div>
      <div class="line btns"><button id="close" type="button">Fermer les réglages</button></div>
    </section>`;

  document.body.appendChild(host);
  const $ = id => shadow.getElementById(id);
  const panel = $('panel');
  const launch = $('launch');
  let panelOpen = false;
  let navigate = false;
  let frameId = 0;
  let prevA = false;
  let prevDirection = '';
  let lastMoveAt = 0;
  let lastDisplayAt = 0;

  const zoomButtons = { '1': $('z100'), '1.15': $('z115'), '1.3': $('z130') };
  function zoomTo(scale) {
    const value = Object.hasOwn(zoomButtons, String(scale)) ? Number(scale) : 1;
    document.body.style.zoom = String(value);
    Object.entries(zoomButtons).forEach(([z, btn]) => btn.setAttribute('aria-pressed', String(Number(z) === value)));
    try { localStorage.setItem(storageKey, String(value)); } catch (_) { /* storage indisponible */ }
  }
  let originalZoom;
  try { originalZoom = localStorage.getItem(storageKey); } catch (_) { originalZoom = null; }
  zoomTo(originalZoom || 1);
  $('z100').addEventListener('click', () => zoomTo(1));
  $('z115').addEventListener('click', () => zoomTo(1.15));
  $('z130').addEventListener('click', () => zoomTo(1.3));

  function pads() {
    try {
      if (typeof navigator.getGamepads !== 'function') return null;
      return Array.from(navigator.getGamepads() || []).filter(pad => pad && pad.connected);
    } catch (_) { return null; }
  }
  function keys(pad) {
    return pad.buttons.map((btn, i) => btn.pressed ? i : -1).filter(i => i >= 0);
  }
  function hasCanvas() {
    // Empêche le clic virtuel d'un bouton de menu pendant une partie sur canvas.
    for (const canvas of document.querySelectorAll('canvas')) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width >= 200 && rect.height >= 120 &&
          getComputedStyle(canvas).visibility !== 'hidden' &&
          getComputedStyle(canvas).display !== 'none') return true;
    }
    return false;
  }
  function candidates() {
    const nodes = document.querySelectorAll('a[href],button:not([disabled]),[role="button"],input:not([type="hidden"]):not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])');
    return Array.from(nodes).filter(el => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 3 && rect.height > 3 && style.visibility !== 'hidden' && style.display !== 'none';
    });
  }
  function nextTarget(dir) {
    const nodes = candidates();
    if (!nodes.length) return;
    const focused = nodes.includes(document.activeElement) ? document.activeElement : null;
    if (!focused) { nodes[0].focus({ preventScroll: true }); return; }
    const current = focused.getBoundingClientRect();
    const cx = current.left + current.width / 2;
    const cy = current.top + current.height / 2;
    let best = null;
    let bestScore = Infinity;
    for (const node of nodes) {
      if (node === focused) continue;
      const rect = node.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - cx;
      const dy = rect.top + rect.height / 2 - cy;
      const primary = dir === 'left' ? -dx : dir === 'right' ? dx : dir === 'up' ? -dy : dy;
      const perpendicular = (dir === 'left' || dir === 'right') ? Math.abs(dy) : Math.abs(dx);
      if (primary <= 3) continue;
      const score = primary + perpendicular * 2.8;
      if (score < bestScore) { bestScore = score; best = node; }
    }
    if (best) best.focus({ preventScroll: true });
  }
  function direction(pad) {
    const b = pad.buttons;
    const isDown = index => !!(b[index] && b[index].pressed);
    if (isDown(12) || (pad.axes[1] ?? 0) < -0.65) return 'up';
    if (isDown(13) || (pad.axes[1] ?? 0) > 0.65) return 'down';
    if (isDown(14) || (pad.axes[0] ?? 0) < -0.65) return 'left';
    if (isDown(15) || (pad.axes[0] ?? 0) > 0.65) return 'right';
    return '';
  }
  function refresh(p) {
    const status = $('gamepads');
    const pressed = $('pressed');
    if (p === null) {
      status.textContent = 'API Gamepad indisponible dans cette WebView. Une manette peut fonctionner en jeu via Android sans être détectée ici.';
      pressed.textContent = 'Aucun diagnostic JS disponible.';
      return;
    }
    if (!p.length) {
      status.textContent = 'Aucune manette détectée par la page. Associer une manette Bluetooth, puis appuyer sur une touche.';
      pressed.textContent = '0 périphérique détecté';
      return;
    }
    status.textContent = p.map((pad, i) => `${i + 1}. ${pad.id || 'Manette'} (${pad.mapping || 'mapping inconnu'})`).join('\n');
    const pad = p[0];
    const active = keys(pad);
    const axes = pad.axes.slice(0, 4).map(v => Number(v || 0).toFixed(2)).join(' / ');
    pressed.textContent = `Touches enfoncées : ${active.join(', ') || 'aucune'} · Axes : ${axes}`;
  }
  function updateNavLabel() {
    $('navigate').setAttribute('aria-pressed', String(navigate));
    $('navigate').textContent = navigate ? 'Désactiver navigation' : 'Activer navigation';
    $('nav-status').textContent = navigate
      ? 'Active sur les menus (suspendue si un canvas de jeu est visible).'
      : 'Désactivée par défaut pour ne pas gêner les jeux.';
  }
  function animate(time) {
    frameId = 0;
    if (!panelOpen && !navigate) return;
    const found = pads();
    if (panelOpen && time - lastDisplayAt > 120) {
      refresh(found);
      lastDisplayAt = time;
    }
    if (navigate && !panelOpen && found && found.length) {
      const pad = found[0];
      const dir = direction(pad);
      const a = !!pad.buttons[0]?.pressed;
      if (!hasCanvas()) {
        if (dir && (dir !== prevDirection || time - lastMoveAt >= 250)) {
          nextTarget(dir);
          lastMoveAt = time;
        }
        if (a && !prevA) {
          const target = document.activeElement;
          if (candidates().includes(target) && target instanceof HTMLElement) target.click();
        }
      }
      prevDirection = dir;
      prevA = a;
    } else {
      prevDirection = '';
      prevA = false;
    }
    ensurePolling();
  }
  function ensurePolling() {
    if (!frameId && (panelOpen || navigate)) frameId = requestAnimationFrame(animate);
  }
  function setOpen(open) {
    panelOpen = open;
    panel.hidden = !open;
    launch.setAttribute('aria-expanded', String(open));
    if (open) { refresh(pads()); ensurePolling(); $('close').focus({ preventScroll: true }); }
    else launch.focus({ preventScroll: true });
  }
  launch.addEventListener('click', () => setOpen(!panelOpen));
  $('close').addEventListener('click', () => setOpen(false));
  $('navigate').addEventListener('click', () => {
    navigate = !navigate;
    prevA = false;
    prevDirection = '';
    updateNavLabel();
    ensurePolling();
  });
  shadow.addEventListener('keydown', e => {
    if (e.key === 'Escape' && panelOpen) { e.stopPropagation(); setOpen(false); }
  });
  window.addEventListener('gamepadconnected', () => { if (panelOpen) refresh(pads()); });
  window.addEventListener('gamepaddisconnected', () => { if (panelOpen) refresh(pads()); });
  updateNavLabel();
})();
