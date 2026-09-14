# Cloudflare Web Analytics

GitHub Pages continues to host arv.in and its project sites. Cloudflare Web
Analytics uses a manually installed beacon; DNS, CNAME, domain registration,
and the existing publishing workflows stay as they are.

## Configuration

In Cloudflare → Web Analytics, add the hostname `arv.in` and copy the public
token from its JavaScript snippet. Use that same token in `analytics.js` and
the inline loader in each project entry page below. It is a public site token,
not an API credential. Do not place account credentials in HTML or JavaScript.

The `arv.in` site was registered on September 14, 2026, with automatic injection
disabled. Its real public token is configured in all eight copies. The
portfolio's Pages workflow rejects an empty token with `ANALYTICS_REQUIRE_TOKEN=1`.

The root `analytics.js` is the reference loader. Project pages embed identical
copies between the `arv.in analytics` comment and the closing script tag. This
keeps their deployments independent and avoids requests to the live portfolio
when previewing projects locally. Keep those copies synchronized when changing
the token or privacy controls.

| URL | Repository | HTML source |
| --- | --- | --- |
| `/`, `/privacy/`, `/qr/` | `arvindang.github.io` | Root site, external `analytics.js` |
| `/forked/` | `forked` | `index.html` |
| `/illustrative/` | `illustrative` | `site/index.html` |
| `/murmur/` | `murmur` | `docs/index.html` |
| `/naiman/` | `naiman` | `index.html` |
| `/scroll-video-scrubber/` | `scroll-video-scrubber` | `docs/index.html`, built with Vite |
| `/tikt/` | `tikt` | `index.html` |
| `/whiplash/` | `whiplash` | `docs/index.html` |

One Cloudflare site covers these paths. `tufte.ai` and other domains are outside
this rollout. Project repositories remain independently maintained.

## Privacy and measurement

- The loader permits only `arv.in` and `www.arv.in`. It exits before requesting
  the beacon on local files, localhost, GitHub preview URLs, and other hosts.
- DNT and GPC prevent the beacon from loading. The loader itself never reads or
  writes cookies or browser storage and does not build visitor identifiers.
- Cloudflare documents that its beacon does not use cookies, local storage,
  session storage, or IndexedDB. No analytics consent banner is added.
- `spa: false` limits measurement to document navigation; scroll, hash, and
  history updates must not become additional page views.
- PostHog and GoatCounter snippets are removed. Custom outbound-link and
  download event reporting ends. Historical provider accounts are retained.
- The privacy notice describes page/referrer information and performance data.
  Do not claim that our code strips referrer paths or sanitizes Cloudflare's
  payload: the old PostHog `before_send` hook no longer exists.
- This notice concerns analytics. Forms and apps have separate behavior; for
  example, submitting a signup form sends information to its form provider.

Cloudflare's service is cookieless; that alone is not a universal legal
determination about consent. Keep measurement limited to audience statistics
and performance, provide the privacy notice and browser opt-outs, and reassess
before introducing advertising, profiling, or additional tracking.

Sources: [manual setup](https://developers.cloudflare.com/web-analytics/get-started/),
[beacon data and storage](https://developers.cloudflare.com/speed/observatory/rum-beacon/),
[disable SPA measurement](https://developers.cloudflare.com/web-analytics/get-started/web-analytics-spa/),
[reporting limitations](https://developers.cloudflare.com/web-analytics/faq/),
[ICO guidance on analytics exceptions](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/what-are-the-exceptions/).

## Verification and release

1. Configure the real site token in every loader. Run
   `node --test tests/analytics.test.cjs`; the configuration check must pass,
   not skip. These dependency-free tests exercise the loader's privacy gates,
   exact host matching, and duplicate prevention with a simulated DOM.
2. Compare each inline loader with the root loader and inspect published
   artifacts for the correct token, privacy link, and absence of old SDKs.
   Build Scroll Video Scrubber with its existing `npm run build:site` command.
3. Release this portfolio change with the static redesign. Publish the project
   changes afterward so the shared privacy notice describes their analytics.
4. On each live path, check the browser network panel for the Cloudflare beacon
   and successful POSTs to `https://cloudflareinsights.com/cdn-cgi/rum`. Check
   DNT/GPC and blocked-script cases, payload contents, storage behavior, and
   normal page interactions. Page load and page exit can send separate payloads;
   only one beacon initializer should run per document.
5. Confirm data appears in Cloudflare Web Analytics, filtered by path. Revert an
   individual analytics commit if a regression requires rollback.

The portfolio requires no build or dependency installation. Its existing Pages
artifact collection already includes `analytics.js` and the privacy page while
excluding these notes and tests.

## Implementation checks — September 14, 2026

- All 29 analytics and video lifecycle tests passed in deployment mode, including
  the real-token configuration check. The deployment mode also correctly rejects
  an empty public token.
- All seven inline copies match the reference loader. The ten assembled HTML
  paths returned HTTP 200, contained one loader each, and resolved their local
  assets; the privacy stylesheet, QR SVG, and PDF download also returned 200.
- Scroll Video Scrubber's site build, lint, type checking, and 26 tests passed.
- Cloudflare beacon version `2026.9.1` was exercised in a simulated DOM using a
  test token and intercepted requests. The load and page-exit payloads targeted
  Cloudflare's external collector, contained no query strings or fragments, and
  retained referrer paths. No cookie or storage access occurred. These simulated
  checks do not establish real-browser rendering, complete Web Vitals behavior,
  collector acceptance, or dashboard delivery.
- Cloudflare registration and public-token configuration are complete. API access
  uses an account-scoped credential stored outside the repositories. Cloudflare
  GraphQL reporting returned homepage page-view records after deployment.

## Production release — September 14, 2026

The portfolio redesign and analytics were merged in
[portfolio PR #11](https://github.com/arvindang/arvindang.github.io/pull/11)
and deployed from the repository's production branch, `master`. All seven
project releases below were merged into `main` and deployed successfully.

| Project | Merged analytics PR |
| --- | --- |
| forked | [#5](https://github.com/arvindang/forked/pull/5) |
| illustrative | [#4](https://github.com/arvindang/illustrative/pull/4) |
| murmur | [#5](https://github.com/arvindang/murmur/pull/5) |
| naiman | [#1](https://github.com/arvindang/naiman/pull/1) |
| scroll-video-scrubber | [#3](https://github.com/arvindang/scroll-video-scrubber/pull/3) |
| tikt | [#1](https://github.com/arvindang/tikt/pull/1) |
| whiplash | [#1](https://github.com/arvindang/whiplash/pull/1) |

Live HTTP checks confirmed the following:

- The homepage, `/privacy/`, `/qr/`, and `analytics.js` match the release files.
- All seven project URLs return 200 and contain exactly one copy of the shared
  loader, the configured public token, and a website privacy link. Their HTML
  contains no PostHog or GoatCounter snippets.
- The portfolio film supports HTTP 206 byte-range requests.
- Every project deployment and the scrubber CI run passed. The scrubber runtime
  fixes were already released in
  [PR #2](https://github.com/arvindang/scroll-video-scrubber/pull/2); the analytics
  release preserves them. No npm package version was published.
- Cloudflare's reporting API returned page-view records for `/`, confirming
  ingestion and reporting from the live portfolio. Separate real-browser
  network/storage inspection on every project path remains unverified.
