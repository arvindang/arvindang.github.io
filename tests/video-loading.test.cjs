const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const vm = require('node:vm');

// Exercise the complete application with controllable media events and a clock.
// Browser decoding is covered separately; this checks our lifecycle around the
// unchanged upstream scrubber without installing any test dependencies.
const source = readFileSync(require.resolve('../app.js'), 'utf8');

class Element extends EventTarget {
  constructor() {
    super();
    this.style = {};
    this.dataset = { angle: '7' };
    this.attributes = new Map();
    this.children = new Map();
    this.classList = { toggle() {}, add() {}, remove() {} };
    this.rect = { top: 200, bottom: 700, left: 0, right: 800, height: 500 };
  }
  querySelector(selector) { return this.children.get(selector); }
  querySelectorAll() { return []; }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name); }
  removeAttribute(name) { this.attributes.delete(name); }
  getBoundingClientRect() { return this.rect; }
}

function setup({ readyState = 0 } = {}) {
  const window = new EventTarget();
  const document = new Element();
  const project = new Element();
  const video = new Element();
  const button = new Element();
  const motion = new EventTarget();
  const viewport = new EventTarget();
  let nearViewport;
  let now = 0;
  let timerID = 0;
  const timers = new Map();
  const scrubbers = [];
  Object.assign(video, {
    readyState, preload: 'none', duration: 19, seeking: false, currentTime: 0,
    controls: true, error: null, loads: 0, pauses: 0,
    buffered: { length: 1, start: () => 0, end: () => 19 },
    load() { this.loads++; this.readyState = 0; this.seeking = false; },
    pause() { this.pauses++; }
  });
  for (const selector of ['.runway', '.stage', '[data-svs-progress]', '.film-card', '[role="progressbar"]']) {
    project.children.set(selector, new Element());
  }
  project.children.set('video', video);
  document.documentElement = new Element();
  document.hidden = false;
  document.querySelectorAll = selector => selector === '.project:not([hidden])' ? [project] : [];
  for (const selector of ['#film-dialog', '#dialog-video', '.work-menu', '#close-film', '.hero-collage']) {
    document.children.set(selector, new Element());
  }
  document.children.set('#motion-toggle', button);
  motion.matches = false;
  viewport.matches = false;
  window.ScrollVideoScrubber = {
    createVideoScrubber(options) {
      const controller = {
        options, updates: 0, destroyed: false,
        update() { this.updates++; },
        destroy() { this.destroyed = true; }
      };
      scrubbers.push(controller);
      return controller;
    }
  };
  const context = {
    window, document, innerWidth: 1440, innerHeight: 900, scrollY: 0,
    addEventListener: window.addEventListener.bind(window),
    requestAnimationFrame: () => 1,
    matchMedia: query => query.includes('prefers-reduced-motion') ? motion : viewport,
    IntersectionObserver: class {
      constructor(callback) { nearViewport = callback; }
      observe() {}
      unobserve() {}
    },
    setTimeout(callback, delay) {
      const id = ++timerID;
      timers.set(id, { callback, due: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); }
  };
  vm.runInNewContext(source, context, { filename: 'app.js' });
  return {
    video, project, document, window, button, motion, scrubbers,
    near() { nearViewport([{ isIntersecting: true, target: project }]); },
    ready() { video.readyState = 4; video.dispatchEvent(new Event('loadeddata')); },
    seek() { video.seeking = true; video.dispatchEvent(new Event('seeking')); },
    advance(ms) {
      const end = now + ms;
      while (true) {
        const next = [...timers].filter(([, timer]) => timer.due <= end)
          .sort((a, b) => a[1].due - b[1].due)[0];
        if (!next) break;
        const [id, timer] = next;
        now = timer.due;
        timers.delete(id);
        timer.callback();
      }
      now = end;
    }
  };
}

function started() {
  const env = setup();
  env.near();
  env.ready();
  assert.equal(env.scrubbers.length, 1);
  return env;
}

test('cold load waits for frame data, then starts once and updates on canplay', () => {
  const env = setup();
  env.near();
  env.video.readyState = 1;
  env.video.dispatchEvent(new Event('loadedmetadata'));
  env.near();
  assert.equal(env.scrubbers.length, 0);
  env.ready();
  env.video.dispatchEvent(new Event('canplay'));
  assert.equal(env.scrubbers.length, 1);
  assert.equal(env.scrubbers[0].updates, 2);
  assert.equal(env.video.loads, 1);
});

test('already decoded video starts without waiting for another loadeddata event', () => {
  const env = setup({ readyState: 4 });
  env.video.preload = 'auto';
  env.near();
  assert.equal(env.scrubbers.length, 1);
  assert.equal(env.video.loads, 0);
});

test('a buffered seek that never completes reloads once and starts again', () => {
  const env = started();
  env.seek();
  env.advance(2499);
  assert.equal(env.video.loads, 1);
  env.advance(1);
  assert.equal(env.video.loads, 2);
  assert.equal(env.scrubbers[0].destroyed, true);
  assert.equal(env.video.readyState, 0);
  env.ready();
  assert.equal(env.scrubbers.length, 2);
  env.seek();
  env.advance(10000);
  assert.equal(env.video.loads, 2, 'never enter an automatic reload loop');
});

test('a completed seek cancels recovery', () => {
  const env = started();
  env.seek();
  env.advance(1000);
  env.video.seeking = false;
  env.video.dispatchEvent(new Event('seeked'));
  env.advance(5000);
  assert.equal(env.video.loads, 1);
});

test('unbuffered seeks wait for the network before considering recovery', () => {
  const env = started();
  env.video.buffered.length = 0;
  env.seek();
  env.advance(5000);
  assert.equal(env.video.loads, 1);
  env.video.buffered.length = 1;
  env.advance(2500);
  assert.equal(env.video.loads, 2);
});

test('background tabs and offscreen films recover only once visible again', () => {
  const env = started();
  env.seek();
  env.document.hidden = true;
  env.document.dispatchEvent(new Event('visibilitychange'));
  env.advance(5000);
  assert.equal(env.video.loads, 1);
  env.video.rect.top = 1000;
  env.document.hidden = false;
  env.document.dispatchEvent(new Event('visibilitychange'));
  env.advance(5000);
  assert.equal(env.video.loads, 1);
  env.video.rect.top = 200;
  env.window.dispatchEvent(new Event('scroll'));
  env.advance(2500);
  assert.equal(env.video.loads, 2);
});

test('restoring a page or returning to a tab resynchronizes the scrubber', () => {
  const env = started();
  const before = env.scrubbers[0].updates;
  env.window.dispatchEvent(new Event('pageshow'));
  env.document.dispatchEvent(new Event('visibilitychange'));
  assert.equal(env.scrubbers[0].updates, before + 2);
});

test('Less motion cancels pending initialization and keeps native controls', () => {
  const env = setup();
  env.near();
  env.button.dispatchEvent(new Event('click'));
  env.ready();
  assert.equal(env.scrubbers.length, 0);
  assert.equal(env.video.controls, true);
  env.button.dispatchEvent(new Event('click'));
  env.near();
  assert.equal(env.scrubbers.length, 1);
});

test('Less motion cancels recovery and detaches media and page listeners', () => {
  const env = started();
  env.seek();
  env.button.dispatchEvent(new Event('click'));
  assert.equal(env.scrubbers[0].destroyed, true);
  const before = env.scrubbers[0].updates;
  env.ready();
  env.seek();
  env.window.dispatchEvent(new Event('pageshow'));
  env.advance(5000);
  assert.equal(env.scrubbers[0].updates, before);
  assert.equal(env.video.loads, 1);
  assert.equal(env.video.controls, true);
});

test('a media error keeps the fallback and does not trigger automatic reloads', () => {
  const env = started();
  env.seek();
  env.video.error = { code: 3 };
  env.video.dispatchEvent(new Event('error'));
  env.window.dispatchEvent(new Event('scroll'));
  env.advance(5000);
  assert.equal(env.video.loads, 1);
});
