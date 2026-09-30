# minisvgbench

A lightweight SVG editor: a single `index.html`, plain JavaScript, works offline. Open it directly in Chrome or Edge (Firefox and Safari are untested).
It targets scientific figures exported by ggplot2/svglite and saved by Inkscape: editing text, moving and scaling, styling, multi-panel layout and export. Heavy work such as path node editing is still left to Inkscape.

The interface is in Chinese; button names are given below as English (中文).

## Usage

| Action | How |
|---|---|
| Open / import | Buttons Open (打开) / Import (导入), or drop a file on the window (asks whether to import or open if the canvas has content); Ctrl+O / Ctrl+I |
| New canvas | New (新建): A4, single column 85 mm, double column 180 mm, or custom size (mm) |
| Zoom / pan / fit | Mouse wheel / Space+drag (or middle button) / 5 |
| Select | Click selects the outermost group; double-click enters a group; Esc leaves one level; Shift adds to the selection; drag on empty space for a selection box (Shift+drag always draws a box); Ctrl+click selects an object inside groups directly; Ctrl+A selects everything at the current level |
| Transform | Drag to move (Ctrl locks horizontal/vertical); arrow keys 0.1 mm, Shift+arrow 1 mm; corner handles scale proportionally, Shift for free scaling; orange dot rotates (Ctrl snaps to 15°); X/Y/W/H (mm) and rotation angle in the right panel |
| Z-order / groups | Home raise to top, End lower to bottom, PageUp/PageDown raise/lower one step; Ctrl+G / Ctrl+Shift+G |
| Edit | Ctrl+C / Ctrl+X / Ctrl+V (pastes at the mouse position) / Ctrl+D (duplicate in place) / Delete; Ctrl+Z / Ctrl+Shift+Z |
| Text | Double-click to edit in place (Enter confirms, Esc cancels); T tool, click to create (8 pt Arial); while editing, select characters and press X² / X₂ |
| Shapes | R rectangle, L line, A arrow (Shift locks to 45°), default line width 0.5 pt; Label (标签) places A/B/C at the top-left corner of each selected panel (10 pt bold) |
| Export | SVG (导出 SVG): `originalname_YYMMDD.svg`; PNG 300/600 dpi (white background, resolution written to the pHYs chunk) |

- Every transformation is written to the `transform` attribute (parent transforms are accounted for); bounding boxes of clipped objects are limited to their clip region.
- Untouched elements are written out exactly as they were. Modified values use 8 significant digits for matrix coefficients, 1e-5 for coordinates, and 6 significant digits for font sizes and line widths (as Inkscape does; font sizes are written in px, i.e. user units).
- On import, every id gets an `iN_` prefix and `url(#…)` / `href` references are updated to match; defs are merged into the document's defs, and layers become ordinary groups.

## Tests

The scripts in `test/` need Node and `playwright` (Chromium); `inkcheck.mjs` also needs the `inkscape` command.

```sh
python3 test/make_volcano.py volcano.svg                     # generate a stand-in volcano.svg matching the spec (the real file is not in the repo)
node test/accept.mjs                                         # acceptance runs 1 and 2, driven entirely through the UI; output in test/out/
python3 test/svgdiff.py volcano.svg test/out/volcano_*.svg    # element-by-element attribute comparison
python3 test/svgdiff.py volcano.svg test/out/figure_*.svg --prefix i1_   # compare an imported copy
node test/inkcheck.mjs test/out/volcano_*.svg g8 text117     # Inkscape bounding boxes and rendering vs. the web page
node test/features.mjs                                       # regression test for the remaining features
```

## Known issues

- Dragging a group of 80,000 nodes: there is one relayout/repaint pause when the drag starts and one on release (about 0.7–0.9 s and 0.5 s in the test environment); during the drag each frame takes about 17 ms. After wheel zooming stops there is one sharp repaint (about 0.35 s).
- XML parsing of a 24 MB file takes about 0.8–1.7 s, which is the floor set by the browser's parser.
- Ungrouping a large clipped group (e.g. a panel with 40,000 points) gives every child its own clip-path (as Inkscape does), which makes rendering slower afterwards. Masks and filters are not pushed down to the children on ungroup.
- Sub- and superscripts are written as `font-size:65%;baseline-shift:super|sub` (Inkscape's own markup); Chrome and Inkscape shift subscripts down by slightly different amounts.
- Changing text content, size or font removes the `textLength`/`lengthAdjust` written by svglite; otherwise the glyphs would be stretched.
- For multi-line text (several `sodipodi:role="line"` tspans), double-click edits only the line that was clicked.
- Bounding boxes are geometric (stroke width not included), while Inkscape uses visual bounding boxes by default, so alignment can differ by half a line width. Clips with `clipPathUnits="objectBoundingBox"` and masks are not taken into account for bounding boxes.
- While dragging, the preview does not apply clip-paths of ancestor groups (normal again on release).
- Consistency with Inkscape was verified with Inkscape 1.2.2 (1.4 not tested).
