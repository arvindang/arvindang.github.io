# Arvin — a few things I couldn’t leave alone

A local, static portfolio draft, September 10, 2026. This supersedes the Paper directions for the current review.

## Review

From the repository root, run `node redesign/server.mjs`, then open http://127.0.0.1:4173. From this directory, `node server.mjs` works as well. Stop any earlier preview using that port before starting another.

The server supports byte-range requests for video seeking. HTML, CSS, JavaScript, fonts, posters, and MP4s are all local. No build step, external service, or API key is needed. Product/source links intentionally lead to the live web. The email address comes from Dasha’s public support link.

This draft lives in `redesign/` on branch `codex/portfolio-redesign`. The existing Middleman site remains in `source/`; this folder is outside its build input and has not been deployed.

## The direction

- Bricolage Grotesque, expressive scale, pastel project colors, and a pile of askew screens.
- Large drop shadows and a changing screen angle along each scroll path.
- Three copy slides per project, driven by the same progress as the film.
- Sticky project headings, a persistent project menu, and direct jumps between sections.
- A quieter mode with all copy visible, ordinary video controls, and shorter sections.
- A full-size film dialog, keyboard focus, Escape to close, and native playback.
- Current public recordings throughout; no simulated native-app interfaces.

The copy and order are proposed for review. Specific contribution credits are strongest for Enduvo (website redesign) and Embed3D (designed and built), which Arvin explicitly confirmed. Confirm the final contribution/collaborator wording across the rest of the collection before publication.

## Capture inventory

The Embed3D edit removes the intermediate loading screen before the ready lesson preview.

The MP4s were created from timestamped browser frame captures (approximately 10–11 captured frames per second), then encoded at 30 fps with a keyframe every eight frames. The encoding repeats frames as needed; it does not turn the captures into native 30 fps recordings. These are usable for motion/layout review. A production pass should use smoother original recordings where interaction fidelity matters.

| File | Source | What was recorded | Limits |
|---|---|---|---|
| `media/enduvo.mp4` | https://enduvo.com/ | Hero motion and the opening scroll sequence | Website redesign; not a recording of the Enduvo application. |
| `media/embed3d.mp4` | https://app.embed3d.io/demo | Manufacturing demo: slice axes and learner-facing preview | Public demo; not the full authenticated authoring product. The course is explicitly a simulated preview in the source. |
| `media/cerca.mp4` | https://cerca.me/u/arvin | Public saved-place collection, search for Galit, and place detail/map | No signed-in saving or editing flow. |
| `media/illustrative.mp4` | https://arv.in/illustrative/ | Public sample reader, moving between illustrated pages | The older public pipeline/sample, not the newer native beta app. |
| `media/murmur.mp4` | https://arv.in/murmur/ | Public product page and current product screenshots | No native app interaction or speech captured. |
| `media/tufte.mp4` | https://tufte.ai/ | Live playground changing between column, line, and bar charts | The public renderer, not a separate recorded evidence-verification session. |
| `media/dasha.mp4` | https://dasha.fm/ | Current retirement notice and Out Loud introduction | The astrology app is retired on the public site. This clip is a static page, not the former application. |
| `media/scrubber.mp4` | https://arv.in/scroll-video-scrubber/ | Live demo while scrolling through video and progress | Demo uses MDN’s CC0 Flower footage; it is not Arvin’s original cinematography. |
| `media/evaluate.mp4` | https://github.com/arvindang/evaluate-product-designers | Public repository/guide scroll | Documentation capture, not an evaluation of a real person. |
| `media/math.mp4` | https://github.com/arvindang/math-collective-skills | Public repository/guide scroll | Documentation capture, not a live advisory session. |

Every film also has an opening JPEG and a final/detail JPEG. Public source assets include Illustrative’s sample pages, Murmur’s widget/settings images, and the scrubber’s Flower source video. The committed MP4s and stills are self-contained. Raw browser frames and timestamps remain in the original Codex task workspace under `work/recordings`; they are not required to run this draft.

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
