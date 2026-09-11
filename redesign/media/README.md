# Portfolio media edits — September 11, 2026

The site keeps one seekable film per project. The existing plugin maps the entire scroll progress to the entire film, ending one frame before its duration. Copy blocks change at 32% and 68%; a longer file alone cannot fix a frozen source image.

| Film | Length | Scenes across 01 / 02 / 03 |
|---|---:|---|
| Enduvo | 16.2s | Hero and expertise story / readiness and product examples / industries and closing site sections |
| Embed3D | 36s | Aircraft editor and orbit / cockpit and exploded model / sharing and learner player |
| Cerca | 30s | Chicago map and place / personal collection / shared guide and map |
| Murmur | 18s | Product and screenshots / shortcut and features / ways to listen and voice settings |
| Tufte | 18.1s | Chart playground / alternate views of the same rows / published evidence example |
| Scroll Video Scrubber | 18.1s | Forward scrub / forward and backward scrub / continue to 100% |

Illustrative is unchanged. Dasha remains hidden.

## Supplied recordings

Original files on Arvin’s Desktop were left intact. All output timestamps below are seconds.

- **Enduvo.mp4:** source 0–16.2, original speed. The complete useful traversal is retained. Poster at output 2.1; detail at 9.4.
- **Embed3D.mp4:** source 12–20 becomes output 0–6; source 31–37 becomes 6–12; source 58–82 becomes 12–24; source 196–208 becomes 24–30; source 258–270 becomes 30–36. Removes the unrelated chat detour, loading and long pauses. Audio is removed completely. Crop `1734:976:0:94` removes browser chrome before scaling. Poster at output 0.2; detail at 17.
- **Cerca.mp4:** source 4–18 becomes output 0–10; source 30–44 becomes 10–20; source 44–54 becomes 20–30. Omits the intermediate zoom/pan detour. Poster at output 0.5; detail at 26.

These outputs are 1600×900, H.264/yuv420p, 30 fps, CRF 20, faststart, with keyframes every ten frames and no audio.

## Fresh browser captures

- **Murmur:** recorded the public page from its hero through product screenshots, features, ways to listen and voice settings. The existing `murmur-widget.png` is composited at bottom-right, 300px wide with a 20px inset, preserving its aspect ratio. It also appears during ordinary video playback.
- **Tufte:** switches between bar, column and line charts, maintaining the same title and rows (`Q1, 36; Q2, 43; Q3, 30; Q4, 52`). The final scene moves to the site’s published verification example. This is a recording of that example, not evidence of a newly executed verification command.
- **Scrubber:** records the actual live demo. Its internal progress runs 0→38→75→40→100, so the middle scene demonstrates reversal and the last scene still contains motion. The source flower film retains its existing MDN CC0 attribution.

These outputs are 1280×720, silent H.264/yuv420p, 30 fps, CRF 20, faststart, with keyframes every eight frames. They use ten captured browser frames per output second; intervening encoded frames repeat those captures. Their output frame rate should not be confused with a native 30 fps screen recording.

## Validation

All six clips decode, have no audio track, and contain visible image changes within each of the three copy blocks. Desktop and mobile browser checks confirmed the expected video times at each block, near the end of the final block, and during reverse scrolling. Illustrative’s media files and HTML section were compared against the prior commit and remain unchanged. Physical Safari/iOS and Chrome/Android checks are still separate from these browser viewport tests.
