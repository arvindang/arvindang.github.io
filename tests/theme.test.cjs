const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../theme.js'), 'utf8');
const key = 'arv-in-theme';

class Element extends EventTarget {
  constructor() { super(); this.attributes = new Map(); this.hidden = true; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
}

function setup({ dark = false, saved = null, blockRead = false, blockWrite = false } = {}) {
  const root = new Element();
  const button = new Element();
  const metas = [new Element(), new Element()];
  const system = new EventTarget();
  const window = new EventTarget();
  const writes = [];
  system.matches = dark;
  const storage = {
    getItem(name) {
      assert.equal(name, key);
      if (blockRead) throw new Error('Storage denied');
      return saved;
    },
    setItem(name, value) {
      assert.equal(name, key);
      if (blockWrite) throw new Error('Storage full');
      saved = value;
      writes.push(value);
    }
  };
  Object.defineProperty(window, 'localStorage', { get() {
    if (blockRead) throw new Error('Storage denied');
    return storage;
  } });
  window.matchMedia = query => {
    assert.equal(query, '(prefers-color-scheme: dark)');
    return system;
  };
  const document = {
    documentElement: root,
    querySelectorAll(selector) {
      return selector === '.theme-toggle' ? [button] : metas;
    }
  };
  vm.runInNewContext(source, { window, document }, { filename: 'theme.js' });
  return {
    root, button, metas, writes, storage,
    theme() { return root.getAttribute('data-theme'); },
    click() { button.dispatchEvent(new Event('click')); },
    os(dark) { system.matches = dark; system.dispatchEvent(new Event('change')); },
    restore(value = saved) { saved = value; window.dispatchEvent(new Event('pageshow')); },
    sync(value, eventKey = key, area = storage) {
      saved = value;
      const event = new Event('storage');
      Object.assign(event, { key: eventKey, newValue: value, storageArea: area });
      window.dispatchEvent(event);
    }
  };
}

for (const dark of [false, true]) {
  test(`first visit follows a ${dark ? 'dark' : 'light'} OS without saving a choice`, () => {
    const env = setup({ dark });
    assert.equal(env.theme(), dark ? 'dark' : 'light');
    assert.equal(env.button.hidden, false);
    assert.equal(env.button.getAttribute('aria-label'), `Switch to ${dark ? 'light' : 'dark'} mode`);
    assert.equal(env.button.getAttribute('title'), env.button.getAttribute('aria-label'));
    assert.deepEqual(env.writes, []);
    for (const meta of env.metas) {
      assert.equal(meta.getAttribute('content'), dark ? '#211d29' : '#e9e4f3');
    }
  });
}

test('OS changes stay live until the visitor makes a choice', () => {
  const env = setup();
  env.os(true);
  assert.equal(env.theme(), 'dark');
  assert.equal(env.button.getAttribute('aria-label'), 'Switch to light mode');
  env.click();
  assert.equal(env.theme(), 'light');
  env.os(false);
  env.os(true);
  assert.equal(env.theme(), 'light');
  assert.deepEqual(env.writes, ['light']);
});

test('the button always switches to its named destination and persists both choices', () => {
  const env = setup();
  env.click();
  assert.equal(env.theme(), 'dark');
  assert.equal(env.button.getAttribute('aria-label'), 'Switch to light mode');
  env.click();
  assert.equal(env.theme(), 'light');
  assert.equal(env.button.getAttribute('aria-label'), 'Switch to dark mode');
  assert.deepEqual(env.writes, ['dark', 'light']);
});

for (const saved of ['light', 'dark']) {
  test(`saved ${saved} preference wins over the opposite OS setting`, () => {
    const env = setup({ saved, dark: saved === 'light' });
    assert.equal(env.theme(), saved);
    env.restore();
    assert.equal(env.theme(), saved);
    assert.deepEqual(env.writes, []);
  });
}

test('invalid stored preferences fall back to the OS', () => {
  const env = setup({ saved: 'invalid', dark: true });
  assert.equal(env.theme(), 'dark');
  env.os(false);
  assert.equal(env.theme(), 'light');
});

test('blocked storage still allows switching and keeps the current page choice', () => {
  const env = setup({ dark: true, blockRead: true });
  env.click();
  env.os(false);
  env.os(true);
  env.restore();
  assert.equal(env.theme(), 'light');
  assert.equal(env.button.hidden, false);
});

test('failed writes do not undo a manual choice on page restoration', () => {
  const env = setup({ blockWrite: true });
  env.click();
  env.restore();
  assert.equal(env.theme(), 'dark');
  assert.deepEqual(env.writes, []);
});

test('another tab updates the appearance; clearing the choice restores OS following', () => {
  const env = setup();
  env.sync('dark');
  assert.equal(env.theme(), 'dark');
  env.sync(null);
  assert.equal(env.theme(), 'light');
  env.os(true);
  assert.equal(env.theme(), 'dark');
  env.sync('light');
  env.sync(null, null);
  assert.equal(env.theme(), 'dark');
});

test('unrelated storage events cannot change the appearance', () => {
  const env = setup();
  env.sync('dark', 'unrelated-key');
  assert.equal(env.theme(), 'light');
  env.sync('dark', key, {});
  assert.equal(env.theme(), 'light');
});

test('a restored page picks up changes made while it was in the back-forward cache', () => {
  const env = setup({ saved: 'dark' });
  env.restore('light');
  assert.equal(env.theme(), 'light');
  env.restore(null);
  env.os(true);
  assert.equal(env.theme(), 'dark');
});
