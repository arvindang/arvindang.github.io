# Arvin — a few things I couldn’t leave alone

A local, static portfolio draft, September 10, 2026. This supersedes the Paper directions for the current review.

## Review

From the repository root, run `node redesign/server.mjs`, then open http://127.0.0.1:4173. From this directory, `node server.mjs` works as well. Stop any earlier preview using that port before starting another.

The server supports byte-range requests for video seeking. HTML, CSS, JavaScript, fonts, posters, and MP4s are all local. No build step, external service, or API key is needed. Product/source links intentionally lead to the live web. The email address comes from Dasha’s public support link.

This draft lives in `redesign/` on branch `codex/portfolio-redesign`. The existing Middleman site remains in `source/`; this folder is outside its build input and has not been deployed.

## The direction

The name is **Arvin Dang** and the domain/wordmark is **arv.in**, with the red dot between `arv` and `in`. Ongoing identity and design preferences are recorded in `AGENTS.md`.

- Bricolage Grotesque, expressive scale, pastel project colors, and a pile of askew screens.
- Large drop shadows and a changing screen angle along each scroll path.
- Tall desktop/tablet screens put a broad film above left-aligned copy. Landscape desktop windows retain the two-column composition so the film stays readable. The film size reserves room for rotation, copy, and the footer.
- Three copy slides per project, driven by the same progress as the film.
- Sticky project headings, a persistent project menu, and direct jumps between sections.
- A quieter mode with all copy visible, ordinary video controls, and shorter sections. Screens at most 560px high use this reading layout automatically; taller screens retain the manual choice. System reduced-motion preferences also take precedence.
- A full-size film dialog, keyboard focus, Escape to close, and native playback.
- Owner-provided Enduvo, Embed3D, and Cerca recordings, alongside public-page captures for the remaining work.

The copy and order are proposed for review. Specific contribution credits are strongest for Enduvo (website redesign) and Embed3D (designed and built), which Arvin explicitly confirmed. Confirm the final contribution/collaborator wording across the rest of the collection before publication.

## Capture inventory

Enduvo, Embed3D, and Cerca now use the recordings Arvin supplied on September 11. Embed3D and Cerca are edited into three scenes within one seekable file each; Embed3D’s audio is removed. Murmur, Tufte, and the scrubber have fresh captures with visible action throughout all three copy blocks.

All six updated files are silent H.264 at 30 fps with frequent keyframes and faststart. The three fresh browser captures use ten captured frames per output second; encoding at 30 fps does not make them native 30 fps recordings. See [the media edit notes](media/README.md) for durations, source ranges, and scene mapping.

| File | Source | What was recorded | Limits |
|---|---|---|---|
| `media/enduvo.mp4` | Arvin’s `Enduvo.mp4` | Full website traversal, 16.2 seconds | Website redesign; not the Enduvo application. |
| `media/embed3d.mp4` | Arvin’s `Embed3D.mp4` | Actual app: editor, cockpit/explode, sharing and learner player; 36 seconds | Edited for pacing; audio, unrelated chat, loading and browser chrome removed. |
| `media/cerca.mp4` | Arvin’s `Cerca.mp4` | Map/place, personal collection, and shared guide/map; 30 seconds | Edited from the supplied recording. |
| `media/illustrative.mp4` | https://arv.in/illustrative/ | Public sample reader, moving between illustrated pages | The older public pipeline/sample, not the newer native beta app. |
| `media/murmur.mp4` | https://arv.in/murmur/ | Fresh page walkthrough with the existing app screenshot inset at bottom-right; 18 seconds | No native app interaction or speech captured. |
| `media/tufte.mp4` | https://tufte.ai/ | Bar/column/line views using the same rows, then the published evidence example; 18.1 seconds | The final scene shows the site’s example, not a new verification run. |
| `media/dasha.mp4` | https://dasha.fm/ | Current retirement notice and Out Loud introduction | The astrology app is retired on the public site. This clip is a static page, not the former application. |
| `media/scrubber.mp4` | https://arv.in/scroll-video-scrubber/ | Demo progressing to 100%, with a backward scrub midway; 18.1 seconds | Demo uses MDN’s CC0 Flower footage; it is not Arvin’s original cinematography. |
| `media/evaluate.mp4` | https://github.com/arvindang/evaluate-product-designers | Public repository/guide scroll | Documentation capture, not an evaluation of a real person. |
| `media/math.mp4` | https://github.com/arvindang/math-collective-skills | Public repository/guide scroll | Documentation capture, not a live advisory session. |

Dasha-FM is hidden from the portfolio, navigation, and active project count as of September 11. Its source entry and captures are retained for reference. The seven visible project entries each have a short description in the project menu.

Every film also has an opening JPEG and a final/detail JPEG. Public source assets include Illustrative’s sample pages, Murmur’s widget/settings images, and the scrubber’s Flower source video. The committed MP4s and stills are self-contained. Original browser frames remain in the initial task workspace under `work/recordings`; the September 11 recaptures were assembled in temporary working folders. The committed clips and edit notes are sufficient to run and review the draft. Desktop source recordings were left unchanged.

## Your plugin

The draft imports the actual ESM build of `@arvindang/scroll-video-scrubber` from `vendor/scroll-video-scrubber.js`. Its source is the public [arvindang/scroll-video-scrubber repository](https://github.com/arvindang/scroll-video-scrubber). The included build was copied from a clean local checkout at [revision c67adc9](https://github.com/arvindang/scroll-video-scrubber/commit/c67adc9061488b1b1f9da914b20d6d02aab30290), verified to match GitHub HEAD on September 10, 2026. Its MIT license and source map are included. No replacement scrubber was written.

`app.js` uses the plugin’s `onProgress` callback for screen transforms and copy transitions. Nearby project films are loaded as needed. The original plugin controls seeking. Motion preference changes destroy/recreate controllers and collapse the long scroll layout.

## What to refine after this review

The priority is choosing the feel of the motion, the amount of tilt/shadow, and the voice of the copy. Then replace the public marketing/sample captures with better native-app recordings where available, tune each clip’s timing against its copy, and verify the actual final encodes on Safari/iOS and Chrome/Android. Those device checks have not yet been done.

Typography: Bricolage Grotesque and DM Mono, distributed under the SIL Open Font License. Font files are stored locally. Supporting-tool source attributions remain in the page.

## Checks completed

- Reviewed at 1280×720 desktop and 390×844 mobile; neither had horizontal overflow.
- Checked all 24 mobile copy panels for text extending beyond their panels; none did.
- Verified forward and reverse seeking, changing transforms, copy changes, and the pinned project heading.
- Opened and played the normal film dialog, then closed it.
- Switched into and out of the quieter mode: native controls and all copy were available, and the current project remained in view after layout settled.
- Opened the project index and followed a project link; the menu closed.
- Checked local asset paths, anchor targets, duplicate IDs, JavaScript syntax, MP4 duration/decodability, and HTTP 206 byte-range delivery.

### September 11 responsive refinement

- Checked 1039×1304 (the review screenshot shape), 1200×1000, and 1280×720, plus phones at 390×844, 375×667, and 320×568. Copy panels fit, and there was no horizontal page overflow at the verified sizes.
- Checked the 844×390 landscape reading layout: all 24 copy slides remained visible, and films had native controls.
- Verified the mobile motion toggle in both directions, forward/reverse scrubbing, and copy/progress changes. Film and copy remain above the section footer on the tested phone layouts.
- Restarted the preview from the committed repository. Verified all HTML-linked local assets and MP4 range responses. Recoverable seek errors no longer mark a film unavailable; a successful media load clears an earlier failure caption.
- Confirmed project content, colors, headers, footer markup, background lettering, and About content are unchanged. The only HTML change is the wordmark.

These are browser viewport checks, not physical iOS/Android device tests.

### Opening section and project navigation

- The opening footer sits at the viewport bottom and remains sticky within the hero when its content is taller than the screen. The rabbit-hole tagline and font-opinions line have been removed.
- Header controls share a 44px height and the same label alignment. The project dropdown includes a sentence for each of the seven featured projects and scrolls within short viewports.
- Dasha-FM is hidden in HTML and marked hidden in `projects.json`; the scrubber setup ignores hidden projects. Tufte links directly to Scroll Video Scrubber, and visible counts run from 01 / 07 through 07 / 07.
- Checked the hero and menu at 1039×1304, 390×844, and 320×568. Verified mobile footer pinning, dropdown scrolling and selection, hidden media loading, and the film dialog title after renumbering.

### September 11 recording refresh

- Diagnosed the apparent early stops as frozen source footage: the previous Murmur, Tufte, and scrubber clips held their last view from 1.37s, 4.00s, and 1.87s respectively. Their remaining duration was static; the plugin continued seeking correctly.
- Replaced six films and both corresponding posters for each. Illustrative’s files and section remain byte-for-byte unchanged.
- Verified silent media, complete decoding, HTTP byte ranges, and nonzero visual change in every copy block. Tested 01/02/03 plus 97% progress and reverse seeking on desktop; repeated 15%, 50%, 85%, and 97% on a 390×844 viewport. The scrubber also reached its final frame at 99.9% progress.
- Checked Murmur’s inset in the page, the Less motion reading layout, and the playback dialog. Dialog captions now describe the specific recording, including the new app walkthroughs.
