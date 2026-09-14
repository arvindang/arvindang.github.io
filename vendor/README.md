# Scroll Video Scrubber

`scroll-video-scrubber.js` contains the implementation from
[`arvindang/scroll-video-scrubber` revision c67adc9061488b1b1f9da914b20d6d02aab30290](https://github.com/arvindang/scroll-video-scrubber/commit/c67adc9061488b1b1f9da914b20d6d02aab30290).
Its MIT license is in `scroll-video-scrubber-LICENSE`.

The upstream ESM export was replaced by an IIFE that exposes
`window.ScrollVideoScrubber`, so an ordinary deferred script can load it from
`file://` as well as HTTP(S). The implementation inside the wrapper is unchanged.
The original ESM source map was removed because it no longer matches this file.
No bundler or runtime dependency is needed.

When updating, preserve this classic-script entry point and verify direct-file
loading as well as served playback and forward/reverse seeking.
