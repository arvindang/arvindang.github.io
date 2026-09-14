const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const source = readFileSync(resolve(__dirname, '../analytics.js'), 'utf8');
const token = source.match(/var siteToken = '([^']*)';/)[1];
const fixtureToken = '0123456789abcdef0123456789abcdef';
const configuredSource = source.replace(/var siteToken = '[^']*';/, `var siteToken = '${fixtureToken}';`);

function environment(hostname = 'arv.in', signals = {}) {
    const scripts = [];
    const document = {
        querySelector: () => scripts.find(script => script.attributes['data-cf-beacon']),
        createElement: tag => {
            assert.equal(tag, 'script');
            return {
                attributes: {},
                setAttribute(name, value) { this.attributes[name] = value; }
            };
        },
        head: { appendChild: script => scripts.push(script) }
    };
    const window = {
        location: { hostname },
        navigator: signals,
        doNotTrack: signals.windowDoNotTrack
    };
    for (const [object, property] of [
        [document, 'cookie'], [window, 'localStorage'], [window, 'sessionStorage'],
        [window, 'indexedDB'], [window.navigator, 'userAgent']
    ]) {
        Object.defineProperty(object, property, {
            get() { throw new Error(`Analytics loader accessed ${property}`); },
            set() { throw new Error(`Analytics loader wrote ${property}`); }
        });
    }
    return { document, window, scripts };
}

test('a real public token must be configured before release', t => {
    if (!token && process.env.ANALYTICS_REQUIRE_TOKEN !== '1') {
        return t.skip('Cloudflare site token is pending; do not deploy yet.');
    }
    assert.ok(token, 'Configure the real Cloudflare Web Analytics token before deploying.');
    assert.match(token, /^[a-f0-9]{32}$/);
    assert.notEqual(token, fixtureToken);
});

for (const host of ['arv.in', 'www.arv.in']) {
    test(`loads one asynchronous classic beacon on ${host}, without storage or fingerprinting`, () => {
        const context = environment(host);
        runInNewContext(configuredSource, context);
        runInNewContext(configuredSource, context);
        assert.equal(context.scripts.length, 1);
        const script = context.scripts[0];
        assert.equal(script.src, 'https://static.cloudflareinsights.com/beacon.min.js');
        assert.equal(script.async, true);
        assert.notEqual(script.type, 'module');
        assert.deepEqual(JSON.parse(script.attributes['data-cf-beacon']), { token: fixtureToken, spa: false });
    });
}

for (const host of ['', 'localhost', '127.0.0.1', 'arvindang.github.io', 'preview.arv.in', 'arv.in.example.com', 'notarv.in']) {
    test(`does not initialize analytics on ${host || 'file://'} previews or unapproved hosts`, () => {
        const context = environment(host);
        context.document.querySelector = () => assert.fail('Privacy gate must run before inspecting scripts');
        runInNewContext(configuredSource, context);
        assert.equal(context.scripts.length, 0);
    });
}

for (const signals of [
    { doNotTrack: '1' }, { doNotTrack: 'yes' }, { windowDoNotTrack: '1' },
    { msDoNotTrack: '1' }, { globalPrivacyControl: true },
    { doNotTrack: '0', globalPrivacyControl: true }
]) {
    test(`honors privacy signals before any analytics request: ${JSON.stringify(signals)}`, () => {
        const context = environment('arv.in', signals);
        context.document.querySelector = () => assert.fail('Privacy gate must run before inspecting scripts');
        runInNewContext(configuredSource, context);
        assert.equal(context.scripts.length, 0);
    });
}

test('does not initialize a second beacon when a snippet already exists', () => {
    const context = environment();
    context.scripts.push({ attributes: { 'data-cf-beacon': '{}' } });
    runInNewContext(configuredSource, context);
    assert.equal(context.scripts.length, 1);
});

test('an empty token makes no analytics request', () => {
    const context = environment();
    runInNewContext(source.replace(/var siteToken = '[^']*';/, "var siteToken = '';"), context);
    assert.equal(context.scripts.length, 0);
});

test('the loader does not register custom events or PostHog / GoatCounter SDKs', () => {
    assert.doesNotMatch(source, /posthog|goatcounter|addEventListener|sendBeacon/);
});
