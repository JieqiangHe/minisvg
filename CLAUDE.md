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
- Undo: MutationObserver records into `pend`; `commit()` pushes a step, `revert()` undoes, `quiet(fn)` makes temporary mutations that are not recorded.
- Matrices: never use DOMMatrix translate/scale/rotate (float32). Build them from arrays with `mx`, `T`, `S`, `Rot`, `about`. `lm(e)` parses the transform attribute in double precision; `ctm(e)` walks up to root. Write transforms with `setT`.
- Number output: `fm` (8 significant digits), `fc` (fixed 1e-5), `f6`. Untouched elements must serialise byte-identical.
- Bounding boxes:
  - `lbox(e)` is the local box, clipped by clip-path; `bbox(e)` = `mbox(e, parentCTM*lm(e))`.
  - `mbox` recurses for rotated matrices. It is exact for circle/ellipse, line/poly and straight-line paths.
  - Groups with more than 2000 descendants fall back to the loose box for speed.
  - Use `memoize(()=>...)` around batches of bbox calls.
- Selection: `sel`, `setSel(a,noRefresh)`, `refresh()`, `sb` (selection box); handles live in `H`. Hit-testing uses `document.elementsFromPoint` through `#mCap`.
- Drag preview ("ghost"): selected nodes move into `svg#mGhost` inside `div#mGW`. The CSS transform goes on the div, not the svg, so text doesn't re-layout.
- Text editing: `edit()` / `finish()` use a contenteditable `.ed` overlay. `<sup>`/`<sub>` become `tspan style="font-size:65%;baseline-shift:super|sub"`.
- AI chat panel: providers and models live in the `AI` object (first array element is the URL, the rest are the `#mModel` options). All current models see images, so the old vision gating is gone. Keep the Model dropdown even though each provider has one model — new models may be added; do not simplify it away.
- Page: `syncPage()` and `setPage(x,y,w,h)` (undoable). There is a side-panel preset `#mPg`, and the New dialog `nd()` uses presets `#mPre` and radios `mOr`.
  - Preset rule: a preset keeps its own orientation, except that a portrait preset is flipped while landscape is selected.
- Export:
  - `svgText()` gives the clean SVG (via `finish(true)` + `prolog` + XMLSerializer).
  - `outName(ext)` builds `name_YYMMDD` in lowercase.
  - `png(dpi)` and `pdf()` both use `vb.w*U` for mm. `pdf()` is a hidden iframe with `@page{size:Wmm Hmm;margin:0}` plus `print()`.
- Preferences in localStorage: `msbTheme` (first visit is light, then the last choice is remembered), `msbRulers`, `msbGrid`, and the AI panel's `msbAi`, `msbThink`, `msb<Glm|Ds>{Model,Key,Ep}`.
- Actions: buttons use `data-a` mapped in the action object; fields use `data-f` and are reached as `F.<name>`. Tools use `data-t`, with keys V/T/R/E/L/A.
- Pitfall: global name collisions. A helper named `pick` once broke selection's `pick()`, so grep before adding a name.

## Testing (keep scripts outside the repo; scratchpad: `~/a/projs/misc/test4minisvg`)

- As of Oct 2026 this machine has no node, Playwright or `/opt/pw-browsers`, and the old scripts (`features.mjs`, `accept.mjs`, `svgdiff.py`, `make_volcano.py`) and the 24 MB volcano file are gone. The scratchpad only holds data files; `main1_260509.svg` (17 MB) serves as a big-file smoke test.
- Before pushing: syntax-check every inline `<script>` block — in `osascript -l JavaScript`, read the file, split on the `<script>` regex and `new Function(src)` each block (the node-free `node --check`).
- If a browser comes back, rewrite the Playwright checks first. They used to cover 47 UI features, an acceptance run whose exports had to be byte-identical to the baseline, and a headless print test (patch the iframe's `contentWindow.print`, capture its HTML, `page.pdf({preferCSSPageSize:true})`; Chromium rounded the page size by under 0.1 mm).
- Inkscape is no longer installed. Results that still stand: exports rendered the same as Chromium (under 1% pixel difference); ungrouping clipped svglite groups moved objects by less than 0.001 mm; an Inkscape-saved file round-tripped with only the edited elements changed.
- PDF: poppler is in micromamba env `poppler_26.05.0` (`~/.local/share/mamba/envs/poppler_26.05.0/bin`).
- Performance targets from the old 24 MB file, kept as reference: about 1.5 s load, about 17 ms per drag frame, about 6 ms rotated-group bbox.

## Open issues

- A user on a Mac saw the in-place text editor box narrower than the text (text cut off, blank at first). It could not be reproduced in Chromium. A defensive fix is in place (`.ed{width:max-content;overflow:visible}`); if it recurs, get the browser and the SVG file.
- Firefox and Safari have not been tested (only Chromium is available here). Safari may ignore `@page size` for PDF; record it, don't hack around it.
