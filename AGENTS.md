# Portfolio identity and design preferences

- The site owner is **Arvin Dang**, not Arvind. Use Arvin in personal copy and conversation. The existing `arvindang` GitHub handle and filesystem paths are correct identifiers.
- The personal domain and wordmark are **arv.in**. The red dot belongs between `arv` and `in`.
- Appearance defaults to the OS setting until a visitor chooses light or dark mode. The header toggle shows its destination: a sun to switch to light, a moon to switch to dark. Keep the distinct project hues in both appearances.
- Keep the mobile header in one row: wordmark, appearance, QR shortcut, and Menu. Put project links, contact links, and Less motion inside the menu, with motion controls reachable while the project list scrolls.
- Preserve the distinct project colors, sticky project headings, section footer with scroll progress, large translucent project lettering, and the About section unless Arvin requests a change.
- Prefer a broad film above left-aligned copy on tall screens. Keep videos readable and controls reachable on smaller screens, including the Less motion option.
- Dasha-FM is hidden from the portfolio while Arvin removes it from production. Keep it out of the project index, count, and next-section links.

# Static-site maintenance

- The root `index.html` is the production site. No generator, package install, or build is required.
- Keep scripts compatible with direct `file://` opening: use ordered deferred classic scripts, not browser ESM imports or local `fetch()` calls.
- Preserve the scrubber's upstream implementation and license; its wrapper exposes `window.ScrollVideoScrubber`.
- Keep `privacy/`, the existing analytics privacy controls, `CNAME`, and public assets working during changes.
- The optional `server.mjs` is only for local HTTP and script-blocked previews.
- `/qr/` is for Arvin to show people in person so they can scan and open `https://arv.in`. Keep the code large, still, high contrast, and easy to reach on a phone. It is not a link directory or a QR generator.
