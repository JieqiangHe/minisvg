# minisvg

A lightweight in-browser SVG editor for touching up ggplot2/svglite figures (often re-saved by Inkscape). Live at https://jieqianghe.github.io/minisvg/ (GitHub Pages serves `main`). The repo was renamed from `minisvgbench`.

## Repo rules

- The whole app is one file, `index.html` (~100 KB). The repo contains `index.html`, `README.md`, `LICENSE`, `minisvg.plugin`, `.claude/` (the TBtools plugin skill), `.gitignore` and `CLAUDE.md`; only `.DS_Store` is gitignored. Do not add test files, build files or other folders.
- Plain JavaScript, no framework, no build step, no dependencies, no CDN. It must work offline and as a static page.
- Commit and push straight to `main`; HTTPS auth fails in this sandbox, so push over SSH (`git push git@github.com:JieqiangHe/minisvg.git main`). Do not create branches or PRs unless asked.
- UI text, tooltips, messages and README are English only. Never leave Chinese in the app.
- Code style: dense and short, no comments, match the surrounding one-liner style. Simplify without changing behaviour; don't refactor unasked.
- README ends at "... Nothing is uploaded." followed by the `**Live: ...**` line and the TBtools-II note. Keep it that short.
- After changing `index.html`, rebuild `minisvg.plugin` with the skill (JDK: micromamba env `openjdk_25.0.2`, `~/.local/share/mamba/envs/openjdk_25.0.2/lib/jvm/bin`; TBtools jar: `/Applications/TBtools-II.app/Contents/java/app/TBtools_JRE1.6.jar`) and commit it.

## Architecture (names in index.html)

- `root` is the document `<svg>`; `vb` is its viewBox; `U` = mm per user unit; `Z*k` = screen px per user unit; `tx`,`ty` = pan.
- Undo: MutationObserver records into `pend`; `commit()` pushes a step (stack capped at 200; held arrow keys merge their nudges into one step via `merge`), `revert()` undoes, `quiet(fn)` makes temporary mutations that are not recorded.
- Matrices: never use DOMMatrix translate/scale/rotate (float32). Build them from arrays with `mx`, `T`, `S`, `Rot`, `about`. `lm(e)` parses the transform attribute in double precision; `ctm(e)` walks up to root. Write transforms with `setT`.
- Number output: `fm` (8 significant digits), `fc` (fixed 1e-5), `f6`. Untouched elements must serialise byte-identical.
- Bounding boxes:
  - `lbox(e)` is the local box, clipped by clip-path; `bbox(e)` = `mbox(e, parentCTM*lm(e))`.
  - `mbox` recurses for rotated matrices. It is exact for circle/ellipse, line/poly and straight-line paths.
  - Groups with more than 2000 descendants fall back to the loose box for speed.
  - Use `memoize(()=>...)` around batches of bbox calls.
- Selection: `sel`, `setSel(a,noRefresh)`, `refresh()`, `sb` (selection box); handles live in `H`.
  - Click selects the part under the pointer (`grab`); Ctrl/⌘+click selects its top-level object (`pick`). `ctx` is the group of the selection; Esc climbs it, an empty click resets it to root.
  - `hit(e)` uses `document.elementFromPoint` with `#mGW`, `#mCap` and the handles set to `pointer-events:none` (elementsFromPoint costs ~35 ms per call on a 150k-element file). Over a filled area, a thin line or small mark painted above within 4 px wins; the search stops after 40 ms.
  - Box select `boxed()` takes whole groups that fit, else recurses into them; children of a group with over 2000 children are measured with getBoundingClientRect.
  - Handles sit outside selections under 24 px on screen, so small points can be dragged. `curParent()` skips clipped groups so new shapes and pastes are not clipped away.
- Drag preview ("ghost"): selected nodes move into `svg#mGhost` inside `div#mGW`. The CSS transform goes on the div, not the svg, so text doesn't re-layout.
- Snapping: when a move drag starts, `snapSet()` stores the selection box in `D.s0` and the snap targets in `D.sn`. Targets are the page's edges and centre, plus, when there are fewer than 500 of them, the bbox edges and centres of the other objects in `ctx` (`cands`; root when `ctx` is a layer). `move` snaps the box's edges or centre within 5 px on screen and keeps the matched lines in `D.g`, which `hud()` draws in orange. Ctrl/⌘ turns snapping off. Shift keeps the move to 45° steps, and only the free axis snaps.
- Style copy: `styCopy()`/`styPaste()` (Edit menu only, actions `stc`/`stp`; Ctrl+Shift+V is Paste in place) keep `sty`: the `PS` paint values, the stroke width in pt (`ptw`), the dashes as multiples of the width, and for text its family, weight, style and size. Paste sets them on the leaves of selected groups (`klea`), so widths and sizes keep their pt. `styCopy(l)`/`styPaste(a)` also take an element or a list. `alike(p)` (Select menu, actions `sf`/`ss`) selects every text, or every shape, whose computed fill or stroke matches the first selected leaf (`lf0`).
- Eyedropper (`drop` tool, in `down()`): a click picks the clicked object's style into `sty` and applies it to the selection, unless the click is inside the selection. Alt+click applies `sty` to the clicked object.
- Fill/stroke swatches (`#mFS` in the tool bar: `#mFF`/`#mSF` labels over transparent colour inputs `#mFc`/`#mSc`): `panel()` paints them with `fsw()`. They colour the selection through `styleSet`, or set `pen`, the fill and stroke `create()` gives new rectangles and ellipses, when nothing is selected. Lines and arrows keep fill none, and fall back to black when `pen.stroke` is none. `swapFS()` (Shift+X, action `swap`) swaps the computed fill/stroke and their opacities on every leaf, or swaps `pen`; `pnt()` writes rgb as hex and paint servers as `url(#id)`.
- Class styling (svglite): a `<style>` scopes to a class-carrying group. `ungroup()` and pasting onto another canvas snapshot the computed `KP` values (fill, stroke, linecap, linejoin, miterlimit) of the leaves (`klea`/`kps`/`kpr`) and write back inline only what would change; `styleSet` on a group skips leaves whose fill/stroke computes to none.
- Text editing: `edit()` / `finish()` use a contenteditable `.ed` overlay. As in Illustrator, Esc finishes (`finish(true)`; Ctrl+Z undoes it) and Enter starts a new line; there is no cancel key. Ctrl+Shift+= / Ctrl+Alt+Shift+= superscript and subscript while editing.
- Font field `F.ff` (`<input list="mFonts">`): a datalist filters by the current value, so on focus the value moves to the placeholder and `#mFonts` is rebuilt from `FONTS` plus the fonts the document's texts use; on blur an untouched field gets its value back. Focusing it also calls `localFonts(1)` (Chrome/Edge `queryLocalFonts`; the click is the user activation the first permission prompt needs; failures are silent), which adds the installed families to `sysF` (deduplicated, sorted, dot-names dropped); at startup `localFonts()` loads them only if the permission is already granted. Untested in a real browser prompt and in JxBrowser. `<sup>`/`<sub>` become `tspan style="font-size:65%;baseline-shift:super|sub"`.
- AI chat panel: providers and models live in the `AI` object (first array element is the URL, the rest are the `#mModel` options). All current models see images, so the old vision gating is gone. Keep the Model dropdown even though each provider has one model — new models may be added; do not simplify it away.
- Page: `syncPage()` and `setPage(x,y,w,h)` (undoable). There is a side-panel preset `#mPg`, and the New dialog `nd()` uses presets `#mPre` and radios `mOr`.
  - Preset rule: a preset keeps its own orientation, except that a portrait preset is flipped while landscape is selected.
- Export:
  - `svgText()` gives the clean SVG (via `finish(true)` + `prolog` + XMLSerializer).
  - `outName(ext,tag='')` builds `name[_tag]_YYMMDD_HHMMSS` (`stamp()`, local time) in lowercase, first stripping one or two trailing `_\d{6}` groups so re-saving doesn't stack stamps; PNG is `name_300dpi_YYMMDD_HHMMSS.png`.
  - `png(dpi)` and `pdf()` both use `vb.w*U` for mm. `pdf()` is a hidden iframe with `@page{size:Wmm Hmm;margin:0}` plus `print()`.
  - Ctrl+S (`save`) keeps the `showSaveFilePicker` handle in `fh` after the first save and writes back to it; `load()` clears `fh`; without the API, or when the write fails, it falls back to `dl()`.
- Clipboard: `copyOut` also writes the selection as SVG (or a note) to the system clipboard, remembered in `lastOut`; a paste of text starting with `<svg`/`<?xml` that is not `lastOut` is imported. `reid()` renames ids in a subtree and relinks its internal `url(#…)`/href references, so duplicates stay self-contained.
- Preferences in localStorage: `msbTheme` (first visit is light, then the last choice is remembered), `msbRulers`, `msbGrid`, `msbChat` (SVG Chat panel), and the AI panel's `msbAi`, `msbThink`, `msb<Glm|Ds>{Model,Key,Ep}`.
- Actions: buttons use `data-a` mapped in the action object; fields use `data-f` and are reached as `F.<name>`. Tools use `data-t`; keys follow Illustrator: V select, T text, M rect, L ellipse, \ line, I eyedropper (`drop`), C crop, plus A arrow and B inhibit (Illustrator has no such tools).
- Shortcuts follow Illustrator. Punctuation keys (brackets, = -, 0 1, ', . ,) are matched on `e.code`, letters on `e.key`. Ctrl+[ ] and Ctrl+Shift+[ ] reorder (Home/End/PgUp/PgDn are kept as aliases); Ctrl+0/1/=/- fit, 100 %, zoom (`zv`); Ctrl+R rulers, Ctrl+' grid; Ctrl+Shift+A deselect; Ctrl+Shift+S save as (`svgAs` clears `fh`); Ctrl+Shift+P place (Ctrl+I kept); Ctrl+P PDF; Ctrl+Shift+. / , change the font size by 1 pt (`fsz`); D default colours (`dflt`); Shift+X swap. The browser keeps Ctrl+N/T/W, so New has no shortcut.
- Transform again: `keep(M,b,c)` stores the last drag, nudge or panel transform in `again` as a matrix relative to the box centre (`c` marks an Alt+drag copy). `tAgain()` (Ctrl+D) re-applies it about the current selection's centre, duplicating first via `dup()` when `c` is set, and merges the steps into one undo. Alt held at pointer-up on a move turns it into a copy: `up(ev)` puts the originals back, `dup()`s them and moves the copies.
- Paste variants: Ctrl+V at the cursor, Ctrl+Shift+V in place on top (`paste(true)`), Ctrl+F / Ctrl+B in place just in front of / behind the selection (`pasteZ`, which moves the pasted nodes next to it, rewriting their transforms if the parent differs).
- Marker heads: the Appearance field Head (`F.hd`, %) calls `heads(p)`. For each marker the selected leaves use (`MP`), `hmk(id,p)` returns the base marker at 100 % or a sibling clone `<base>_h<p>`: the base's attributes, overflow visible, and its children (re-id'd) in a `<g>` scaled about refX/refY. A clone made from a clone (base gone) scales by p/current. `_h` clones left unused are removed. The panel reads the % back from the id suffix.
- Crop (`crop` tool, `crop(img,a,b)`): dragging across an `<image>` (the selected one, else the one under the drag start) clips it with a `clipPath id="crop…"` holding one rect in the image's own coordinates. A later crop edits that rect if no one else uses it; a box covering the whole image removes the crop. A clip-path the image already had is chained onto the new clipPath (`clip-path` on the clipPath). Pixels are never touched.
- Pitfall: global name collisions. A helper named `pick` once broke selection's `pick()`, so grep before adding a name.

## Testing (keep scripts outside the repo; scratchpad: `~/a/projs/misc/test4minisvg`)

- As of Oct 2026 this machine has no node, Playwright or `/opt/pw-browsers`, and the old scripts (`features.mjs`, `accept.mjs`, `svgdiff.py`, `make_volcano.py`) and the 24 MB volcano file are gone. The scratchpad holds data files plus `check.jsx` (the syntax check below) and `bench.html` (a copy of index.html that loads a data file and reports timings via fetch to `python3 -m http.server`, opened in Safari — the only browser here; its `do JavaScript` gate is off). `main1_260509.svg` (17 MB, ~8.5k elements, 584 texts) serves as a big-file smoke test: Safari loads it in ~0.3 s and `sizes()` costs 1–3 ms, so it stays synchronous in `commit()`.
- Before pushing: syntax-check every inline `<script>` block — in `osascript -l JavaScript`, read the file, split on the `<script>` regex and `new Function(src)` each block (the node-free `node --check`).
- If a browser comes back, rewrite the Playwright checks first. They used to cover 47 UI features, an acceptance run whose exports had to be byte-identical to the baseline, and a headless print test (patch the iframe's `contentWindow.print`, capture its HTML, `page.pdf({preferCSSPageSize:true})`; Chromium rounded the page size by under 0.1 mm).
- Inkscape is no longer installed. Results that still stand: exports rendered the same as Chromium (under 1% pixel difference); ungrouping clipped svglite groups moved objects by less than 0.001 mm; an Inkscape-saved file round-tripped with only the edited elements changed.
- PDF: poppler is in micromamba env `poppler_26.05.0` (`~/.local/share/mamba/envs/poppler_26.05.0/bin`).
- Performance targets from the old 24 MB file, kept as reference: about 1.5 s load, about 17 ms per drag frame, about 6 ms rotated-group bbox.

## Open issues

- A user on a Mac saw the in-place text editor box narrower than the text (text cut off, blank at first). It could not be reproduced in Chromium. A defensive fix is in place (`.ed{width:max-content;overflow:visible}`); if it recurs, get the browser and the SVG file.
- Ctrl+click on macOS depends on the canvas `contextmenu` being suppressed; untested on a Mac.
- Firefox and Safari have not been tested (only Chromium is available here). Safari may ignore `@page size` for PDF; record it, don't hack around it.
- Ctrl+S overwrite saving needs `showSaveFilePicker` (Chromium; Safari and Firefox fall back to a download). Untested in TBtools' JxBrowser.
- Pasting SVG text trusts `text/plain` that starts with `<svg`/`<?xml` and differs from what this page last wrote; other clipboard flavours (an SVG wrapped in `text/html`, for instance) are ignored.
