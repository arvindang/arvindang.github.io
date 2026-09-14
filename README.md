# arv.in

Arvin Dang's portfolio: static HTML, CSS, JavaScript, local fonts, and videos.
The redesign is now the root site. There is no build step, package installation,
Ruby, or Middleman dependency.

## Preview

Open `index.html` directly in your browser. Scroll scrubbing, project navigation,
and the film dialog work over `file://`. Keep the adjacent asset folders in place.

An optional HTTP preview more closely matches hosting and supports video byte
ranges:

```sh
node server.mjs
# http://127.0.0.1:4173

node server.mjs --no-js
# http://127.0.0.1:4174 — scripts blocked to exercise the native fallback
```

The server is only a preview convenience. It is not deployed or required to open
the site. System reduced-motion preferences and short viewports intentionally
select the reading layout; larger screens also have a Less motion button.

## Files

- `index.html` — portfolio content and native video/link fallbacks.
- `app.js` — scroll-driven presentation, motion controls, and film dialog.
- `vendor/scroll-video-scrubber.js` — the original scrubber implementation in a
  classic-script wrapper. See [vendor notes](vendor/README.md).
- `styles.css`, `navigation.css`, `fallbacks.css`, `fonts.css` — presentation.
- `media/`, `fonts/` — local recordings, posters, and licensed fonts.
- `privacy/index.html`, `analytics.js` — existing privacy copy and analytics.
  Analytics only loads on the production domains and respects DNT/GPC.
- `qr/index.html`, `qr/code.svg` — a phone-friendly page for showing your QR code
  at conferences and meetups. It opens `https://arv.in` when scanned. The header
  shortcut opens it directly, including from a local file preview. The SVG is
  static, with the original code and a white margin; no QR service is required.
  The code comes from the old page in commit `4e81b85`, with the
  [four-module margin specified by DENSO WAVE](https://www.qrcode.com/en/howto/code.html).
- `assets/` — retained public downloads and assets, including `NW_Syllabus.pdf`.
- `projects.json` — reference content inventory; not fetched by the page.
- `docs/design-notes.md`, `media/README.md` — design history and recording notes.

## Deployment

Pushes to `main` or `master` run `.github/workflows/deploy.yml`. The workflow
copies the site's files unchanged into a Pages artifact and deploys it. It does
not compile, bundle, or install dependencies. Repository tooling and design
notes are excluded from the artifact. `CNAME` preserves `arv.in`; `.nojekyll`
also makes the plain-file intent explicit.

Project sites such as `/murmur/`, `/illustrative/`, and `/scroll-video-scrubber/`
are linked as live URLs; their source is not part of this repository.

## Why direct opening previously showed the fallback

The draft loaded `app.js` with `type="module"` and an ESM import. Browsers enforce
[module security restrictions](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules#other_differences_between_modules_and_classic_scripts)
on `file://`, so the application never ran. Both scripts now load as ordered,
deferred classic scripts. The scrubber code is unchanged; only its wrapper and
the app's loading mechanism differ. If scripts are disabled or fail to load,
native video controls, readable copy, and ordinary links remain available.

## Migration checks — September 14, 2026

Verified in Chrome: direct-file and HTTP loading, all seven films seeking
forward/to the end/backward, copy transitions, project navigation, chapter
buttons, film dialog playback, and the motion toggle. Desktop and phone-sized
viewports passed. Short-screen, system reduced-motion, disabled-JavaScript,
CSP-blocked, and missing-vendor cases retain readable copy and native playback.

Local links, video byte ranges, privacy URLs, the PDF download, and the workflow's
static-file collection commands passed. Media, fonts, existing analytics/privacy
copy, and the scrubber implementation were checked against the prior revision.
Safari/WebKit could not be verified because the available test browser did not
start successfully. These checks did not deploy the site.

The restored QR page was checked at eight viewport sizes, from 320×568 to
1280×900, including landscape phones. The whole code remains visible, the
header shortcut and return link work, and file/HTTP previews work with scripts
enabled or disabled. Apple's Vision barcode reader decoded every rendered
screenshot as `https://arv.in`. The Pages artifact includes the QR page and both
of its assets. These are screenshot checks, not physical camera tests.
