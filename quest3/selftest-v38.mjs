// Test sans navigateur/casque des interactions principales du panneau Quest.
// L'émulation des APIs DOM est volontairement minimale et ne valide pas le rendu.
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

class FakeElement {
  constructor(tag = 'button') {
    this.tagName = tag.toUpperCase();
    this.style = {};
    this.attrs = {};
    this.handlers = new Map();
    this.hidden = false;
    this.textContent = '';
    this.value = '';
  }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  addEventListener(name, callback) { this.handlers.set(name, callback); }
  click() { this.handlers.get('click')?.(); }
  focus() { this.focused = true; }
  select() { this.selected = true; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 300, height: 60 }; }
  querySelectorAll() { return []; }
}
const widgets = new Map();
const shadow = {
  innerHTML: '',
  getElementById(id) {
    if (!widgets.has(id)) widgets.set(id, new FakeElement(id === 'report' ? 'textarea' : 'button'));
    return widgets.get(id);
  },
  addEventListener() {},
  querySelectorAll() { return []; },
  activeElement: null
};
const host = new FakeElement('div');
host.attachShadow = () => shadow;
const body = new FakeElement('body');
body.appendChild = () => {};
const localData = new Map();
let copied = '';
const windowMock = {
  innerWidth: 1440, innerHeight: 900, devicePixelRatio: 1.4,
  AudioContext: function AudioContext() {},
  addEventListener() {}
};
const documentMock = {
  body,
  activeElement: null,
  createElement: tag => {
    if (tag === 'div') return host;
    if (tag === 'canvas') {
      const el = new FakeElement('canvas');
      el.getContext = () => null;
      return el;
    }
    return new FakeElement(tag);
  },
  querySelectorAll: () => [],
  execCommand: () => false
};
const navigatorMock = {
  maxTouchPoints: 2,
  getGamepads: () => [{ connected: true, id: 'Test Bluetooth Controller', mapping: 'standard',
    buttons: [{pressed: false}, {pressed: false}], axes: [0, 0] }],
  clipboard: { writeText: async text => { copied = text; } }
};
const storage = {
  setItem: (key, value) => localData.set(key, value),
  getItem: key => localData.get(key) ?? null,
  removeItem: key => localData.delete(key)
};
runInNewContext(readFileSync('quest3/quest-controls.js', 'utf8'), {
  window: windowMock,
  document: documentMock,
  navigator: navigatorMock,
  localStorage: storage,
  screen: {width: 1440, height: 900},
  HTMLElement: FakeElement,
  requestAnimationFrame: () => 1,
  getComputedStyle: () => ({visibility: 'visible', display: 'block'}),
  console
}, {filename: 'quest-controls.js'});

widgets.get('launch').click();
assert.equal(widgets.get('launch').attrs['aria-expanded'], 'true');
widgets.get('z115').click();
assert.equal(body.style.zoom, '1.15');
widgets.get('check').click();
const report = widgets.get('report').value;
assert.match(report, /RetroVault Quest : V38/);
assert.match(report, /Manettes visibles : 1/);
assert.match(report, /Stockage local : lecture \/ écriture OK/);
assert.match(report, /Émulation \/ ROM \/ sauvegardes : non vérifiées/);
widgets.get('copy').click();
await Promise.resolve();
assert.equal(copied, report);
widgets.get('navigate').click();
assert.equal(widgets.get('navigate').attrs['aria-pressed'], 'true');
widgets.get('close').click();
assert.equal(widgets.get('launch').attrs['aria-expanded'], 'false');
console.log('TEST INTERFACE V38 OK : ouverture, zoom, diagnostic, copie, navigation, fermeture.');
