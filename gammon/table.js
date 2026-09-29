/*
 * Gammon table: one checker and two dice that carry the reader between the
 * page's beats. Scroll drives every pose, so the choreography scrubs in both
 * directions; springs only smooth the progress values. Anything unsupported
 * leaves the page static and complete.
 */
(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var script = doc.currentScript;
  var media = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var reduceQuery = media('(prefers-reduced-motion: reduce)');
  var darkQuery = media('(prefers-color-scheme: dark)');
  var table = null;
  var booting = false;

  var INK = '#242729';
  var BLUE = '#2456e8';
  var COACH_ROLL = [1, 1];
  var CLOSE_ROLL = [5, 3];

  function listen(query, fn) {
    if (!query.addEventListener) {
      if (query.addListener) query.addListener(fn);
      return;
    }
    query.addEventListener('change', fn);
  }

  function allowed() {
    if (reduceQuery.matches) return false;
    var connection = navigator.connection;
    if (connection && connection.saveData) return false;
    if (navigator.deviceMemory && navigator.deviceMemory < 4) return false;
    if (!doc.querySelector('[data-beat]')) return false;
    try {
      var probe = doc.createElement('canvas');
      var gl = probe.getContext('webgl2') || probe.getContext('webgl');
      if (!gl) return false;
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
    } catch (_) {
      return false;
    }
    return true;
  }

  // The page may include the vendor bundle itself; otherwise fetch it only
  // once every gate has passed, as a classic script so file:// still works.
  function loadThree(done) {
    if (window.GammonThree) return done(window.GammonThree);
    var src = 'vendor/three-gammon.js';
    try {
      if (script && script.src) src = new URL('vendor/three-gammon.js', script.src).href;
    } catch (_) {}
    var tag = doc.createElement('script');
    tag.src = src;
    tag.async = true;
    tag.onload = function () { if (window.GammonThree) done(window.GammonThree); };
    doc.head.appendChild(tag);
  }

  function boot() {
    if (table || booting || !allowed()) return;
    booting = true;
    loadThree(function (T) {
      booting = false;
      if (table || !allowed()) return;
      try {
        table = createTable(T);
      } catch (_) {
        if (table) table.destroy();
        table = null;
      }
    });
  }

  listen(reduceQuery, function () {
    if (reduceQuery.matches) {
      if (table) table.destroy();
      table = null;
    } else {
      boot();
    }
  });

  function whenIdle(fn) {
    if (window.requestIdleCallback) window.requestIdleCallback(fn, { timeout: 1500 });
    else setTimeout(fn, 200);
  }

  if (doc.readyState === 'complete') whenIdle(boot);
  else window.addEventListener('load', function () { whenIdle(boot); }, { once: true });

  /* ---------- math ---------- */

  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ramp(v, from, to) { return clamp01((v - from) / (to - from)); }
  function smooth(t) { t = clamp01(t); return t * t * (3 - 2 * t); }
  function easeInOut(t) { t = clamp01(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function easeOut(t) { t = clamp01(t); return 1 - Math.pow(1 - t, 3); }
  function bezier(a, c, b, t) { var s = 1 - t; return s * s * a + 2 * s * t * c + t * t * b; }
  function num(value, fallback) { var n = parseFloat(value); return isFinite(n) ? n : fallback; }

  // Critically damped spring: physical, never overshoots, reverses cleanly.
  function Spring(omega) { this.x = 0; this.v = 0; this.target = 0; this.omega = omega; }
  Spring.prototype.step = function (dt) {
    var w = this.omega;
    var x = this.x - this.target;
    var e = Math.exp(-w * dt);
    var k = (this.v + w * x) * dt;
    this.x = (x + k) * e + this.target;
    this.v = (this.v - w * k) * e;
    if (Math.abs(this.x - this.target) < 4e-4 && Math.abs(this.v) < 4e-3) {
      this.x = this.target;
      this.v = 0;
    }
  };
  Spring.prototype.settled = function () { return this.x === this.target && this.v === 0; };

  /* ---------- the table ---------- */

  function createTable(T) {
    var fov = 20;
    var mobileQuery = media('(max-width: 760px)');
    var vw = 0;
    var vh = 0;
    var depth = 1;
    var raf = 0;
    var last = 0;
    var alive = true;
    var first = true;
    var textEls = [];
    var anchorEls = {};
    var coachStack = null;
    var coachProgress = -1;

    var canvas = doc.createElement('canvas');
    canvas.className = 'gammon-table';
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;left:0;top:0;z-index:4;pointer-events:none;display:block;';

    var renderer = new T.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = T.SRGBColorSpace;
    renderer.toneMapping = T.NeutralToneMapping;

    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(fov, 1, 1, 10);
    var pmrem = new T.PMREMGenerator(renderer);
    var environment = pmrem.fromScene(new T.RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    scene.environment = environment;

    var key = new T.DirectionalLight(0xffffff, 1.5);
    key.position.set(-0.8, 1, 0.75);
    scene.add(key);
    var hemi = new T.HemisphereLight(0xffffff, 0xc9d0cf, 0.35);
    hemi.position.set(0, 0, 1);
    scene.add(hemi);

    var disposables = [environment];
    function keep(thing) { disposables.push(thing); return thing; }

    /* checker: lathe profile with a raised rim and a recessed centre, like
       the app's white checker. Unit radius, bottom at z = 0. The profile runs
       bottom-centre outward and up so the faces wind toward the viewer. */
    var profile = [
      [0, 0], [0.92, 0], [0.96, 0.015], [0.99, 0.045], [1, 0.1], [1, 0.2],
      [0.98, 0.255], [0.94, 0.292], [0.88, 0.312], [0.78, 0.318], [0.69, 0.305],
      [0.64, 0.275], [0.6, 0.23], [0.55, 0.205], [0.5, 0.2], [0, 0.2]
    ];
    var ringTone = [0.7, 0.7, 0.7, 0.7, 0.72, 0.78, 0.86, 0.95, 1, 1, 0.98, 0.9, 0.84, 0.93, 0.99, 0.99];
    var points = profile.map(function (p) { return new T.Vector2(p[0], p[1]); });
    var checkerGeometry = keep(new T.LatheGeometry(points, 72));
    (function tone() {
      var count = checkerGeometry.attributes.position.count;
      var colors = new Float32Array(count * 3);
      for (var i = 0; i < count; i++) {
        var t = ringTone[i % points.length];
        colors[i * 3] = t; colors[i * 3 + 1] = t; colors[i * 3 + 2] = t;
      }
      checkerGeometry.setAttribute('color', new (checkerGeometry.attributes.position.constructor)(colors, 3));
    })();
    checkerGeometry.rotateX(Math.PI / 2);

    var checkerMaterial = keep(new T.MeshPhysicalMaterial({
      color: 0xf6f6f2, vertexColors: true, roughness: 0.38, clearcoat: 0.55,
      clearcoatRoughness: 0.3, transparent: true
    }));
    var ghostMaterial = keep(new T.MeshStandardMaterial({
      color: BLUE, roughness: 0.3, metalness: 0, transparent: true, depthWrite: false
    }));

    function faceTexture(value) {
      var size = 256;
      var c = doc.createElement('canvas');
      c.width = c.height = size;
      var g = c.getContext('2d');
      g.fillStyle = '#fbfbf8';
      g.fillRect(0, 0, size, size);
      var spots = {
        1: [[0.5, 0.5]],
        2: [[0.28, 0.28], [0.72, 0.72]],
        3: [[0.27, 0.27], [0.5, 0.5], [0.73, 0.73]],
        4: [[0.29, 0.29], [0.71, 0.29], [0.29, 0.71], [0.71, 0.71]],
        5: [[0.28, 0.28], [0.72, 0.28], [0.5, 0.5], [0.28, 0.72], [0.72, 0.72]],
        6: [[0.29, 0.25], [0.71, 0.25], [0.29, 0.5], [0.71, 0.5], [0.29, 0.75], [0.71, 0.75]]
      }[value];
      var r = size * 0.075;
      spots.forEach(function (s) {
        var x = s[0] * size;
        var y = s[1] * size;
        // Recessed pip: a darker lip at the top-left, lit floor at the bottom-right.
        var grad = g.createRadialGradient(x + r * 0.25, y + r * 0.3, r * 0.1, x, y, r);
        grad.addColorStop(0, '#3a3f42');
        grad.addColorStop(0.75, INK);
        grad.addColorStop(1, '#16191a');
        g.fillStyle = grad;
        g.beginPath();
        g.arc(x, y, r, 0, Math.PI * 2);
        g.fill();
        g.strokeStyle = 'rgba(0,0,0,0.12)';
        g.lineWidth = size * 0.012;
        g.stroke();
      });
      var texture = keep(new T.CanvasTexture(c));
      texture.colorSpace = T.SRGBColorSpace;
      texture.anisotropy = 4;
      return texture;
    }

    // Box face order: +x, -x, +y, -y, +z, -z. Opposite faces sum to seven.
    var faceValues = [2, 5, 3, 4, 1, 6];
    var dieMaterials = faceValues.map(function (v) {
      return keep(new T.MeshPhysicalMaterial({
        map: faceTexture(v), roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.2, transparent: true
      }));
    });
    var dieGeometry = keep(new T.RoundedBoxGeometry(1, 1, 1, 5, 0.17));

    // Quaternion that turns the face showing `value` toward the camera.
    function faceUp(value, spin) {
      var e = new T.Euler(0, 0, 0);
      if (value === 6) e.set(Math.PI, 0, 0);
      else if (value === 2) e.set(0, -Math.PI / 2, 0);
      else if (value === 5) e.set(0, Math.PI / 2, 0);
      else if (value === 3) e.set(Math.PI / 2, 0, 0);
      else if (value === 4) e.set(-Math.PI / 2, 0, 0);
      var face = new T.Quaternion().setFromEuler(e);
      var turn = new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 0, 1), spin);
      return turn.multiply(face);
    }

    var shadowTexture = (function () {
      var c = doc.createElement('canvas');
      c.width = c.height = 128;
      var g = c.getContext('2d');
      var grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
      grad.addColorStop(0, 'rgba(0,0,0,1)');
      grad.addColorStop(0.45, 'rgba(0,0,0,0.55)');
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = grad;
      g.fillRect(0, 0, 128, 128);
      return keep(new T.CanvasTexture(c));
    })();
    var shadowGeometry = keep(new T.PlaneGeometry(1, 1));

    function makeShadow() {
      var m = keep(new T.MeshBasicMaterial({ map: shadowTexture, color: 0x0b1a1f, transparent: true, depthWrite: false }));
      var mesh = new T.Mesh(shadowGeometry, m);
      mesh.renderOrder = -1;
      scene.add(mesh);
      return mesh;
    }

    function makePiece(mesh) {
      scene.add(mesh);
      return { mesh: mesh, shadow: makeShadow(), screen: { x: 0, y: 0, r: 0, o: 0 } };
    }

    var checker = makePiece(new T.Mesh(checkerGeometry, checkerMaterial));
    var ghost = makePiece(new T.Mesh(checkerGeometry, ghostMaterial));
    var dice = [makePiece(new T.Mesh(dieGeometry, dieMaterials)), makePiece(new T.Mesh(dieGeometry, dieMaterials))];
    var gluable = [checker, dice[0], dice[1]];
    gluable.forEach(function (piece) { piece.decal = makeDecal(); piece.glue = null; });
    // Each die owns its materials so opacity can differ per die.
    dice[1].mesh.material = dieMaterials.map(function (m) { return keep(m.clone()); });

    var restQ = {
      coach: [faceUp(COACH_ROLL[0], 0.18), faceUp(COACH_ROLL[1], -0.32)]
    };

    var springs = {
      intro: new Spring(4.5),
      lift: new Spring(6),
      fly: new Spring(6.5),
      fade: new Spring(9),
      dice: new Spring(4.8),
      ghost: new Spring(6.5),
      close: new Spring(4.8)
    };

    var theme = { dark: false };
    function applyTheme() {
      var attr = root.getAttribute('data-theme');
      theme.dark = attr ? attr === 'dark' : darkQuery.matches;
      renderer.toneMappingExposure = theme.dark ? 0.92 : 1;
      scene.environmentIntensity = theme.dark ? 0.5 : 0.7;
      key.intensity = theme.dark ? 1.4 : 1.8;
      ghostMaterial.color.set(theme.dark ? '#5b83ff' : BLUE);
      schedule();
    }

    function collectText() {
      var list = doc.querySelectorAll('[data-beat] h1, [data-beat] h2, [data-beat] h3, [data-beat] p, [data-beat] li, [data-beat] a, [data-beat] button, #features h2, #features h3, #features p');
      textEls = [];
      for (var i = 0; i < list.length; i++) {
        if (!list[i].closest('[data-anchor], .shot, .shot-stack')) textEls.push(list[i]);
      }
    }

    function resize() {
      vw = root.clientWidth || window.innerWidth;
      vh = window.innerHeight;
      var mobile = mobileQuery.matches;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2));
      renderer.setSize(vw, vh);
      depth = (vh / 2) / Math.tan((fov / 2) * Math.PI / 180);
      camera.aspect = vw / vh;
      camera.position.set(0, 0, depth);
      camera.near = depth * 0.2;
      camera.far = depth * 2;
      camera.updateProjectionMatrix();
      decalBase = null;
      collectText();
      schedule();
    }

    function anchor(name) {
      var el = anchorEls[name];
      if (!el || !el.isConnected) el = anchorEls[name] = doc.querySelector('[data-anchor="' + name + '"]');
      if (!el) return null;
      var r = el.getBoundingClientRect();
      if (!r.width || !r.height) return null;
      var fs = num(el.getAttribute('data-anchor-size'), 0);
      return {
        x: r.left + num(el.getAttribute('data-anchor-x'), 0.5) * r.width,
        y: r.top + num(el.getAttribute('data-anchor-y'), 0.5) * r.height,
        size: fs > 0 ? fs * r.width : 0,
        rect: r,
        el: el
      };
    }

    function stackRect() {
      if (!coachStack || !coachStack.isConnected) {
        coachStack = doc.querySelector('[data-beat="coach"] .shot-stack') || doc.querySelector('.shot-stack');
      }
      if (!coachStack) return null;
      var r = coachStack.getBoundingClientRect();
      return r.width ? r : null;
    }

    // Place a piece at a viewport point (CSS px) raised `lift` px toward the viewer.
    function place(piece, x, y, lift, size, opacity, base) {
      var mesh = piece.mesh;
      var visible = opacity > 0.004 && size > 0;
      mesh.visible = piece.shadow.visible = visible;
      piece.screen.o = visible ? opacity : 0;
      if (!visible) return;
      // Pull the piece toward the axis by its height, so it appears exactly
      // at (x, y) and perspective only changes its size. A die rests `base`
      // high, so its top face lands exactly on the anchor.
      base = base || 0;
      var k = (depth - lift - base) / depth;
      var wx = (x - vw / 2) * k;
      var wy = (vh / 2 - y) * k;
      mesh.position.set(wx, wy, lift);
      var scale = depth / (depth - lift - base);
      piece.screen.x = vw / 2 + wx * scale;
      piece.screen.y = vh / 2 - wy * scale;
      piece.screen.r = size / 2 * scale;

      // Soft contact shadow: it spreads, drifts from the light and fades
      // with height, but stays visible so a lifted piece reads as airborne.
      var height = Math.max(0, lift - base);
      var spread = 1 + Math.min(height / (size * 5), 0.6);
      var sx = x - vw / 2 + size * 0.06 + height * 0.06;
      var sy = vh / 2 - y - size * 0.1 - height * 0.1;
      piece.shadow.position.set(sx, sy, 0.2);
      piece.shadow.scale.setScalar(size * 1.3 * spread);
      piece.shadow.material.opacity = opacity * (theme.dark ? 0.5 : 0.26) / (spread * spread);
    }

    // Objects fade instead of sitting on copy.
    function textClearance(piece) {
      var s = piece.screen;
      if (!s.o) return 1;
      var worst = 0;
      var pad = 6;
      for (var i = 0; i < textEls.length; i++) {
        var r = textEls[i].getBoundingClientRect();
        if (r.bottom < s.y - s.r - pad || r.top > s.y + s.r + pad || r.right < s.x - s.r - pad || r.left > s.x + s.r + pad) continue;
        var dx = Math.max(r.left - pad - s.x, 0, s.x - r.right - pad);
        var dy = Math.max(r.top - pad - s.y, 0, s.y - r.bottom - pad);
        var dist = Math.sqrt(dx * dx + dy * dy);
        var cover = clamp01((s.r - dist) / (s.r * 1.2));
        if (cover > worst) worst = cover;
      }
      return 1 - smooth(worst / 0.45);
    }

    function setOpacity(piece, factor) {
      var mats = piece.mesh.material;
      var o = piece.screen.o * factor;
      if (Array.isArray(mats)) mats.forEach(function (m) { m.opacity = o; });
      else mats.opacity = o * (piece === ghost ? 0.82 : 1);
      piece.shadow.material.opacity *= factor;
      piece.mesh.visible = piece.shadow.visible = o > 0.004;
    }

    var rollAxis = new T.Vector3();
    var qa = new T.Quaternion();

    // A keyframed throw: a falling arc, two bounces and a rocking settle.
    // Progress p is scroll-driven, so the whole roll scrubs both ways.
    var BOUNCE_1 = 0.5;
    var BOUNCE_2 = 0.76;
    var SETTLE = 0.9;
    var rock = new T.Quaternion();
    var yaw = new T.Quaternion();
    var zAxis = new T.Vector3(0, 0, 1);

    function poseDie(piece, p, from, to, rest, size, travelSize, turns, spin, side) {
      if (p <= 0.001) { place(piece, 0, 0, 0, 0, 0); return; }
      var t;
      var u;
      var h;
      var q;
      var wobble = 0;
      if (p < BOUNCE_1) {
        t = p / BOUNCE_1;
        u = 0.8 * t;
        h = 2.6 * (1 - t * t);
        q = 0.72 * t;
      } else if (p < BOUNCE_2) {
        t = (p - BOUNCE_1) / (BOUNCE_2 - BOUNCE_1);
        u = 0.8 + 0.15 * t;
        h = 0.9 * 4 * t * (1 - t);
        q = 0.72 + 0.22 * t;
      } else if (p < SETTLE) {
        t = (p - BOUNCE_2) / (SETTLE - BOUNCE_2);
        u = 0.95 + 0.045 * t;
        h = 0.3 * 4 * t * (1 - t);
        q = 0.94 + 0.05 * t;
      } else {
        t = (p - SETTLE) / (1 - SETTLE);
        u = 0.995 + 0.005 * easeOut(t);
        h = 0;
        q = 0.99 + 0.01 * easeOut(t);
        wobble = 0.2 * Math.sin(Math.PI * 2 * t) * (1 - t);
      }
      var dx = to.x - from.x;
      var dy = to.y - from.y;
      var len = Math.sqrt(dx * dx + dy * dy) || 1;
      var s = lerp(travelSize, size, smooth(ramp(p, BOUNCE_1 * 0.8, SETTLE)));
      // The two dice fly in on either side of their line of travel and close
      // up as they shrink onto their slots, so they never overlap.
      var apart = side * (s * 0.55 * (1 - u) + (s - size) * 0.5);
      var x = lerp(from.x, to.x, u) - dy / len * apart;
      var y = lerp(from.y, to.y, u) + dx / len * apart;
      // Screen y points down; world y points up.
      rollAxis.set(dy / len, dx / len, 0);
      qa.setFromAxisAngle(rollAxis, -(1 - q) * turns * Math.PI * 2);
      yaw.setFromAxisAngle(zAxis, (1 - q) * spin * Math.PI * 2);
      rock.setFromAxisAngle(rollAxis, wobble);
      piece.mesh.quaternion.copy(rock).multiply(qa).multiply(yaw).multiply(rest);
      piece.mesh.scale.setScalar(s);
      place(piece, x, y, s / 2 + h * s, s, smooth(p / 0.08), s / 2);
    }

    function diceSlots(a, roll, fallback, spins) {
      var found = a.el.querySelectorAll('.die');
      if (found.length >= 2) {
        return [0, 1].map(function (i) {
          var el = found[i];
          var r = el.getBoundingClientRect();
          var m = (getComputedStyle(el).transform || '').match(/matrix\(([^,]+),\s*([^,]+)/);
          var angle = m ? Math.atan2(parseFloat(m[2]), parseFloat(m[1])) : 0;
          var pips = el.querySelectorAll('i').length;
          return {
            x: r.left + r.width / 2, y: r.top + r.height / 2, size: el.offsetWidth || r.width,
            q: faceUp(pips >= 1 && pips <= 6 ? pips : roll[i], -angle)
          };
        });
      }
      var exact = a.size > 0;
      var size = exact ? a.size : fallback;
      var gap = size * (exact ? 1.17 : 1.3);
      return [0, 1].map(function (i) {
        return {
          x: a.x + (i ? gap / 2 : -gap / 2),
          y: a.y + (exact ? 0 : (i ? -0.12 : 0.08) * size),
          size: size,
          q: faceUp(roll[i], exact ? 0 : spins[i])
        };
      });
    }

    /* Glued pieces (landed and at rest) hand over to a DOM snapshot of
       themselves that scrolls with the page on the compositor. The WebGL
       canvas repaints on the main thread, so during iOS momentum scrolling
       a glued mesh could trail its screenshot by a frame; the snapshot
       cannot. The swap happens on identical pixels, so it is invisible. */
    var decalBase = null;

    function makeDecal() {
      var el = doc.createElement('canvas');
      el.className = 'gammon-table-decal';
      el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'position:absolute;left:0;top:0;z-index:4;pointer-events:none;display:none;max-width:none;';
      doc.body.appendChild(el);
      return { el: el, key: '', shown: false, pending: false, offX: 0, offY: 0, tx: NaN, ty: NaN, opacity: '' };
    }

    function showDecal(d, on) {
      if (d.shown === on) return;
      d.shown = on;
      d.el.style.display = on ? 'block' : 'none';
    }

    function placeDecal(d, g, opacity) {
      if (opacity < 0.004) { showDecal(d, false); return; }
      showDecal(d, true);
      var sx = window.pageXOffset || 0;
      var sy = window.pageYOffset || 0;
      if (!decalBase) {
        d.el.style.transform = 'none';
        var r = d.el.getBoundingClientRect();
        decalBase = { x: r.left + sx, y: r.top + sy };
        d.tx = d.ty = NaN;
      }
      var tx = Math.round((g.x + d.offX + sx - decalBase.x) * 100) / 100;
      var ty = Math.round((g.y + d.offY + sy - decalBase.y) * 100) / 100;
      if (tx !== d.tx || ty !== d.ty) {
        d.tx = tx;
        d.ty = ty;
        d.el.style.transform = 'translate(' + tx + 'px,' + ty + 'px)';
      }
      var o = opacity >= 0.999 ? '' : opacity.toFixed(3);
      if (o !== d.opacity) {
        d.opacity = o;
        d.el.style.opacity = o;
      }
    }

    // Decide per piece whether the mesh or its snapshot carries it this frame.
    function prepareGlue(piece) {
      var d = piece.decal;
      var g = piece.glue;
      d.pending = false;
      if (!g) { showDecal(d, false); return false; }
      var dpr = renderer.getPixelRatio();
      g.half = Math.ceil(g.size * 0.9 + 3);
      g.key += '|' + g.size.toFixed(2) + '|' + dpr + '|' + (theme.dark ? 'd' : 'l');
      g.opacity = piece.screen.o;
      if (d.key === g.key) {
        piece.mesh.visible = piece.shadow.visible = false;
        placeDecal(d, g, g.opacity);
        return true;
      }
      showDecal(d, false);
      if (g.x - g.half < 0 || g.y - g.half < 0 || g.x + g.half > vw || g.y + g.half > vh) return false;
      // Draw this frame at full strength so the snapshot is complete.
      d.pending = true;
      piece.mesh.visible = piece.shadow.visible = true;
      var mats = piece.mesh.material;
      if (Array.isArray(mats)) mats.forEach(function (m) { m.opacity = 1; });
      else mats.opacity = 1;
      piece.shadow.material.opacity = theme.dark ? 0.5 : 0.26;
      return true;
    }

    function capture(piece) {
      var d = piece.decal;
      var g = piece.glue;
      var dpr = renderer.getPixelRatio();
      var sx = Math.floor((g.x - g.half) * dpr);
      var sy = Math.floor((g.y - g.half) * dpr);
      var px = Math.ceil(g.half * 2 * dpr) + 1;
      d.el.width = d.el.height = px;
      d.el.style.width = d.el.style.height = (px / dpr) + 'px';
      var ctx = d.el.getContext('2d');
      ctx.clearRect(0, 0, px, px);
      ctx.drawImage(canvas, sx, sy, px, px, 0, 0, px, px);
      d.offX = sx / dpr - g.x;
      d.offY = sy / dpr - g.y;
      d.key = g.key;
      d.tx = d.ty = NaN;
      piece.mesh.visible = piece.shadow.visible = false;
      placeDecal(d, g, g.opacity);
    }

    function frame(now) {
      raf = 0;
      if (!alive) return;
      try {
        var dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
        last = now;
        update(dt);
        renderer.render(scene, camera);
        var captured = false;
        for (var i = 0; i < gluable.length; i++) {
          if (gluable[i].decal.pending) { capture(gluable[i]); captured = true; }
        }
        if (captured) renderer.render(scene, camera);
        if (first) {
          first = false;
          root.classList.add('has-table');
        }
        var moving = false;
        for (var k in springs) if (!springs[k].settled()) moving = true;
        if (moving) schedule();
        else last = 0;
      } catch (_) {
        destroy();
        table = null;
      }
    }

    function schedule() {
      if (!raf && alive && !doc.hidden) raf = requestAnimationFrame(frame);
    }

    function update(dt) {
      var mobile = mobileQuery.matches;
      var hero = anchor('hero-rest');
      var play = anchor('play-land');
      var from = anchor('coach-from');
      var to = anchor('coach-to');
      var coachDice = anchor('coach-dice');
      var closeDice = anchor('close-dice');
      var stack = stackRect();
      var scrollY = window.pageYOffset || root.scrollTop || 0;

      /* targets: pure functions of layout and scroll */
      springs.intro.target = 1;
      if (hero) {
        var heroStart = Math.min(hero.y + scrollY, vh * 0.85);
        springs.lift.target = ramp(hero.y, heroStart, heroStart - vh * 0.3);
      } else {
        springs.lift.target = 1;
      }
      if (play) {
        var startY = Math.min(vh * 1.02, play.y + scrollY - 1);
        var endY = Math.min(vh * 0.58, startY - vh * 0.3);
        springs.fly.target = ramp(play.y, startY, endY);
        springs.fade.target = ramp(play.y, endY - vh * 0.28, endY - vh * 0.46);
      } else {
        springs.fly.target = 0;
        springs.fade.target = 0;
      }

      var coachMid = from && to ? (from.y + to.y) / 2 : stack ? stack.top + stack.height / 2 : null;
      if (coachMid !== null) {
        springs.dice.target = ramp(coachMid, vh * 1.12, vh * 0.72);
        springs.ghost.target = from && to ? ramp(coachMid, vh * 0.7, vh * 0.34) : 0;
      } else {
        springs.dice.target = springs.ghost.target = 0;
      }
      springs.close.target = closeDice ? ramp(closeDice.y, vh * 1.02, vh * 0.66) : 0;

      for (var k in springs) {
        if (first) { springs[k].x = springs[k].target; springs[k].v = 0; }
        springs[k].step(dt);
      }
      if (first) springs.intro.x = 0;

      var coachP = from && to ? smooth(ramp(springs.ghost.x, 0.12, 0.82)) : null;
      if (stack && coachP !== null) {
        if (Math.abs(coachP - coachProgress) > 0.0005) {
          coachProgress = coachP;
          coachStack.style.setProperty('--coach-progress', coachP.toFixed(4));
        }
      }

      /* checker: lifts off hero-rest, hovers while the page passes under it,
         then drops onto play-land and hands over to the screenshot. */
      if (hero || play) {
        var up = easeInOut(springs.lift.x);
        var down = easeInOut(springs.fly.x);
        var sizeA = hero ? hero.size || Math.max(34, Math.min(64, hero.rect.width * 0.1)) : 0;
        var sizeB = play ? play.size || play.rect.width * 0.05 : sizeA;
        if (!hero) sizeA = sizeB;
        // In open space the checker travels at a confident size, then shrinks
        // to exactly the screenshot's checker as it lands.
        var travelSize = mobile ? Math.max(sizeB * 1.5, sizeA * 0.6) : Math.max(sizeB * 2.6, sizeA * 0.8);
        // Hover over open page: the play shot's outer gutter when it is wide
        // enough, otherwise above the landing point.
        var hover = { x: play ? play.x : hero.x, y: vh * 0.4 };
        if (play) {
          var shot = play.rect;
          var rightRoom = vw - shot.right;
          var outer = shot.left + shot.width / 2 > vw / 2 ? rightRoom : shot.left;
          if (outer > travelSize * 1.5) hover.x = outer === rightRoom ? shot.right + rightRoom / 2 : shot.left / 2;
        }
        var start = hero || hover;
        var hx = bezier(start.x, lerp(start.x, hover.x, 0.2), hover.x, up);
        var hy = bezier(start.y, lerp(start.y, hover.y, 0.8), hover.y, up);
        var hoverLift = depth * (mobile ? 0.05 : 0.1);
        var x = hx;
        var y = hy;
        var lift = hoverLift * up;
        var size = lerp(sizeA, travelSize, up);
        if (play) {
          var side = hx > vw / 2 ? 1 : -1;
          x = bezier(hx, lerp(hx, play.x, 0.5) + side * Math.min(vw * 0.04, 40), play.x, down);
          y = bezier(hy, lerp(hy, play.y, 0.25), play.y, down);
          lift = lerp(lift, 0, down) + depth * (mobile ? 0.04 : 0.08) * Math.sin(Math.PI * down);
          size = lerp(size, sizeB, smooth(ramp(down, 0.3, 1)));
        }
        // While it hovers, the checker rocks gently with the scroll.
        var hovering = up * (1 - down);
        var rock = Math.sin(scrollY / 230) * 0.14 * hovering;
        var sway = Math.sin(Math.PI * up) * 0.5 + Math.sin(Math.PI * down);
        var tilt = hovering * 0.3 + 0.3 * sway;
        checker.mesh.scale.setScalar(size / 2);
        checker.mesh.rotation.set(-tilt + rock * 0.6, (0.6 * tilt + rock) * (x > vw / 2 ? 1 : -1), 0);
        var introLift = (1 - easeOut(springs.intro.x)) * depth * 0.06;
        place(checker, x, y, lift + introLift, size, smooth(springs.intro.x) * (1 - smooth(springs.fade.x)));
        checker.glue = play && springs.fly.x === 1 && springs.fly.v === 0 && (!hero || springs.lift.x === 1) && springs.intro.x === 1
          ? { x: play.x, y: play.y, size: sizeB, key: 'c' }
          : null;
      } else {
        place(checker, 0, 0, 0, 0, 0);
        checker.glue = null;
      }

      /* ghost: the stronger move, coach-from -> coach-to */
      if (from && to && springs.ghost.x > 0.001) {
        var g = springs.ghost.x;
        var travel = smooth(ramp(g, 0.12, 0.82));
        var gSize = from.size || (stack ? stack.width * 0.044 : 16);
        var span = Math.sqrt((to.x - from.x) * (to.x - from.x) + (to.y - from.y) * (to.y - from.y));
        var gArc = Math.sin(Math.PI * travel);
        ghost.mesh.scale.setScalar(gSize / 2);
        ghost.mesh.rotation.set(-0.4 * gArc, 0.3 * gArc, 0);
        place(ghost,
          bezier(from.x, (from.x + to.x) / 2, to.x, travel),
          bezier(from.y, Math.min(from.y, to.y) - span * 0.35, to.y, travel),
          span * 0.9 * gArc, gSize,
          smooth(ramp(g, 0, 0.12)) * (1 - smooth(ramp(g, 0.86, 1))));
      } else {
        place(ghost, 0, 0, 0, 0, 0);
      }

      /* dice: tumble in beside the coach screens, again at the close. An
         anchor holding .die elements (the page's static dice) or carrying
         data-anchor-size (dice in a screenshot) is landed on exactly. */
      var dieSize = mobile ? 24 : Math.max(30, Math.min(44, vw * 0.028));
      var useClose = springs.close.x > 0.001 && closeDice;
      var slots = null;
      if (useClose) {
        slots = diceSlots(closeDice, CLOSE_ROLL, dieSize, [-0.12, 0.26]);
      } else if (coachDice) {
        slots = diceSlots(coachDice, COACH_ROLL, dieSize, [0.18, -0.32]);
      } else if (stack) {
        var outerRight = stack.left + stack.width / 2 >= vw / 2;
        var room = outerRight ? vw - stack.right : stack.left;
        var roomy = room > dieSize * 2.6;
        var inset = roomy ? -dieSize * 1.3 : dieSize * 0.9;
        var sx = outerRight ? stack.right - inset : stack.left + inset;
        var sy = stack.top + stack.height * (roomy ? 0.36 : 0.06);
        var gap = dieSize * 1.3;
        slots = [
          { x: sx - gap * 0.3, y: sy - gap * 0.45, size: dieSize, q: restQ.coach[0] },
          { x: sx + gap * 0.3, y: sy + gap * 0.45, size: dieSize, q: restQ.coach[1] }
        ];
      }
      if (slots) {
        var p = useClose ? springs.close.x : springs.dice.x;
        var settled = p === 1 && (useClose ? springs.close.v : springs.dice.v) === 0;
        var dir = (slots[0].x + slots[1].x) / 2 > vw / 2 ? 1 : -1;
        for (var i = 0; i < 2; i++) {
          var slot = slots[i];
          var big = mobile ? Math.max(slot.size, Math.min(slot.size * 1.5, 44)) : Math.max(slot.size, Math.min(slot.size * 2.4, 72));
          var lag = i ? 0.1 : 0;
          var start = {
            x: dir > 0 ? vw + big * (1.5 + i) : -big * (1.5 + i),
            y: slot.y - vh * 0.24 - i * big * 0.6
          };
          poseDie(dice[i], clamp01((p - lag) / (1 - lag)), start, slot, slot.q, slot.size, big, 1.3 + i * 0.35, (i ? -0.45 : 0.55) * dir, i ? 1 : -1);
          dice[i].glue = settled ? { x: slot.x, y: slot.y, size: slot.size, key: (useClose ? 'close' : 'coach') + i } : null;
        }
      } else {
        place(dice[0], 0, 0, 0, 0, 0);
        place(dice[1], 0, 0, 0, 0, 0);
        dice[0].glue = dice[1].glue = null;
      }

      var pieces = [checker, ghost, dice[0], dice[1]];
      for (var j = 0; j < pieces.length; j++) {
        // Landed pieces and the ghost sit on their anchors by design.
        var guarded = !(pieces[j] === ghost || pieces[j].glue || (pieces[j] === checker && springs.fly.x > 0.98));
        setOpacity(pieces[j], guarded ? textClearance(pieces[j]) : 1);
      }
      for (var n = 0; n < gluable.length; n++) prepareGlue(gluable[n]);
    }

    function onVisibility() {
      if (doc.hidden) {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        last = 0;
      } else {
        schedule();
      }
    }

    function onLost(event) {
      event.preventDefault();
      destroy();
      table = null;
    }

    // Late fonts or images can move anchors without a scroll event.
    var reflow = window.ResizeObserver ? new ResizeObserver(function () { decalBase = null; collectText(); schedule(); }) : null;
    if (reflow) reflow.observe(doc.body);
    var observer = window.MutationObserver ? new MutationObserver(applyTheme) : null;
    if (observer) observer.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    listen(darkQuery, applyTheme);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', resize);
    doc.addEventListener('visibilitychange', onVisibility);
    canvas.addEventListener('webglcontextlost', onLost);

    function destroy() {
      if (!alive) return;
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      if (observer) observer.disconnect();
      if (reflow) reflow.disconnect();
      if (darkQuery.removeEventListener) darkQuery.removeEventListener('change', applyTheme);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', resize);
      doc.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('webglcontextlost', onLost);
      disposables.forEach(function (d) { d.dispose(); });
      renderer.dispose();
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      gluable.forEach(function (piece) { if (piece.decal.el.parentNode) piece.decal.el.parentNode.removeChild(piece.decal.el); });
      root.classList.remove('has-table');
      if (coachStack) coachStack.style.removeProperty('--coach-progress');
    }

    doc.body.appendChild(canvas);
    applyTheme();
    resize();

    // Test hook: screen positions of each piece, in CSS px.
    window.GammonTable = {
      probe: function () {
        return {
          checker: checker.screen, ghost: ghost.screen, dice: [dice[0].screen, dice[1].screen],
          decals: gluable.map(function (piece) {
            var d = piece.decal;
            if (!d.shown) return null;
            var r = d.el.getBoundingClientRect();
            return { x: r.left - d.offX, y: r.top - d.offY, opacity: d.el.style.opacity || '1' };
          }),
          anchors: { hero: anchor('hero-rest'), play: anchor('play-land'), from: anchor('coach-from'), to: anchor('coach-to'), close: anchor('close-dice') },
          springs: Object.keys(springs).reduce(function (o, k) { o[k] = springs[k].x; return o; }, {})
        };
      }
    };

    return { destroy: destroy };
  }
})();
