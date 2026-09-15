# Project queue

## Completed: dark mode and compact mobile navigation

Implemented on September 14, 2026, after Arvin selected share-preview option 01
and approved the compact mobile navigation mockup.

- Default to the operating system's light or dark appearance, and follow system
  changes until the visitor makes an explicit choice.
- Provide an accessible toggle between light and dark mode. Remember the
  visitor's choice across visits when browser storage is available.
- Preserve the distinct project colors, sticky headings, progress footers,
  translucent project lettering, and About section in both appearances.
- Keep Less motion and navigation reachable on small screens. Preserve direct
  `file://` opening and the script-free fallback.
- Check the portfolio, privacy page, and QR page in both appearances; the QR
  code must remain still, high contrast, and easy to scan.

### Implementation

1. Define shared light/dark palettes in `theme.css`, retaining the original
   project hues. CSS follows the OS when JavaScript is unavailable.
2. Load `theme.js` as a deferred classic script on the portfolio, privacy, and
   QR pages. It follows live OS changes until the visitor toggles, saves an
   explicit choice under `arv-in-theme`, and updates other tabs and restored
   pages. Storage failures leave the toggle usable for the current page.
3. Add a 44×44 header button. Its moon offers dark mode; its sun offers light
   mode. The accessible label and tooltip name the destination. The button is
   hidden until its handler is ready and works independently of the scrubber.
4. Use one 62px header row on portfolio screens at most 700px wide: wordmark,
   appearance, QR, and Menu. The menu contains seven project links, contact
   links, and a motion control that stays reachable as the project list scrolls.
   Desktop retains its original navigation. Both motion buttons share state,
   including system reduced-motion and short-screen overrides.

The browser's theme color follows the selected palette. The QR image remains
black on white, and videos and screenshots retain their original colors.
The privacy page explains the locally stored appearance choice. The selected
lavender share image remains the preview in both modes.

### Validation

- All 42 dependency-free tests passed, including 12 appearance tests for OS
  defaults and changes, explicit overrides, denied storage, cross-tab updates,
  and page restoration, plus a desktop/mobile motion synchronization check.
- Chromium verified destination icons, Enter/Space activation, persistence
  through reloads and navigation, live OS changes, and tab synchronization.
- Both OS appearances work without JavaScript on all three pages. A missing
  theme script keeps the CSS appearance; a missing scrubber does not disable
  the theme toggle. Storage-denied and direct `file://` checks passed.
- Checked 36 page/viewport combinations from 320×568 through 1440×900,
  including landscape phones and tall tablets. Header controls fit without
  overlaps or horizontal overflow, and the full QR code remains in view.
- Checked all three copy beats for all seven projects at four phone sizes
  (84 layouts). Films, copy, chapter controls, and progress footers fit.
- Visually reviewed the desktop and phone hero, a phone project, project menu,
  About, privacy, and QR pages in dark mode.
- Verified the final compact menu in both themes at five viewport sizes,
  including 320px portrait and 700px landscape. Checked Escape dismissal,
  project links, persistent appearance controls, motion synchronization across
  viewport changes, both script-free appearances, and direct-file navigation.

These are Chromium viewport checks, not physical Safari/iOS device tests.
