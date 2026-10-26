# TrueSheet: a sheet presented from the start isn't server-rendered on the web

Expo SDK 58 (Expo Router 58.0.26, React 19.3, react-native-web 0.21.4) with `web.output: 'server'`,
`@lodev09/react-native-true-sheet@4.0.0-beta.31`.

The app is an Expo Router `Sheet` navigator: `/` (Home) and `/details`, a sheet screen. Opening `/details` from its
URL renders Home with the Details sheet presented on it from the start. The layout also has a `TrueSheetOverlay`.

```sh
bun install
npx expo export --platform web
npx expo serve --port 8098
```

Then, in another terminal:

```sh
curl -s localhost:8098/details | grep -c "The content of the details sheet"
node check-ssr.mjs http://localhost:8098/details            # a phone's window (390×844)
node check-ssr.mjs http://localhost:8098/details 1280 800   # a desktop's
node check-ssr.mjs http://localhost:8098/details 1280 800 dark   # in dark mode
```

`check-ssr.mjs` (puppeteer-core with the installed Chrome, `CHROME=…` to set its path) prints the sheet's content
position frame by frame from the page's first parse, and the page's errors.

**Expected:** the server's HTML has the sheet, presented: the page shows it from its first paint, where it stays once
hydrated, and hydrates without errors.

**Actual:**

- `curl` finds no sheet content (`0`): the sheet renders in a portal, and portals render nothing on the server.
- In the browser, the sheet only appears once hydrated (~250-450 ms after the first parse), and slides in from the
  bottom of the window (`top=1266` to `top=422` over ~450 ms), like a sheet presented after the page loaded.
- `Minified React error #418` (hydration mismatch) on every page, `/` included: `TrueSheetOverlay` creates its portal
  in the browser's first render, which the server's HTML doesn't have.

## With the fix

`vendor/react-native-true-sheet-fix-web-ssr.tgz` is `npm pack` of the branch `fix/web-ssr-initial-sheet` of
react-native-true-sheet.

```sh
bun run fix           # installs the tgz (bun run unfix goes back to 4.0.0-beta.31)
rm -rf dist
npx expo export --platform web
npx expo serve --port 8098
```

- `curl` finds the sheet's content (`1`).
- `check-ssr.mjs`: the content is there from the first frame, where it stays (`top=422` at 390×844; `top=400` and
  the wrapper 640 px wide at 1280×800, the width of a wide window, from the first frame too), in the color scheme's
  background from the first frame too (`rgb(247, 242, 250)`, `dark`: `rgb(29, 27, 32)`, at both sizes), and no #418.
- The sheet still works: tap the dim or press Escape to dismiss it (back to `/`); **Open the details sheet** presents
  it again, animated, as before (in the portal, like any sheet presented after the page loaded).

The repro has a single sheet: a press on a sheet rendered in place, below a portaled sheet without a dim, is covered by
the library's unit tests rather than here.
