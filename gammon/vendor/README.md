# vendor/

## three-gammon.js

A tree-shaken build of [three.js](https://threejs.org) **r186 (npm `three@0.186.1`)**
holding only what `../table.js` uses. It is one classic IIFE script that sets
`window.GammonThree`, so it works from `file://` without modules or import maps.
`table.js` loads it itself once motion, WebGL, save-data and memory checks pass,
so visitors who get the static page never download it.

- Size: 549298 bytes raw, 136963 bytes gzip (`gzip -9`).
- SHA-256: `31b986102a6ebb33a6d27540721c42258f7436ea8321dc594e4ccd060aea84f8`
- Entry: `three-gammon.entry.js`, with named exports only so esbuild can drop the rest.

### Rebuild

From this folder, in a scratch directory outside the site:

```sh
tmp=$(mktemp -d) && cp three-gammon.entry.js "$tmp/entry.js" && cd "$tmp"
npm init -y >/dev/null && npm install three@0.186.1 esbuild@0.25.12
npx esbuild entry.js --bundle --format=iife --global-name=GammonThree --minify --target=es2019 \
  --banner:js="/*! three.js r186 (0.186.1) | MIT License | Copyright 2010-2026 three.js authors | https://threejs.org */" \
  --outfile=three-gammon.js
cp three-gammon.js "$OLDPWD/three-gammon.js"
```

To use another three.js symbol, add it to the entry file and rebuild.

### License

three.js is released under the MIT License:

```
The MIT License

Copyright © 2010-2026 three.js authors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
