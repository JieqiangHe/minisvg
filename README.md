# minisvgbench

**Live: https://jieqianghe.github.io/minisvgbench/**

A single-file, offline SVG editor for quick touch-ups of ggplot2/svglite figures saved by Inkscape: edit text, move and scale, restyle, lay out panels, export. Files are processed in your browser and never uploaded. Tested in Chrome/Edge. Path node editing is left to Inkscape.

## Shortcuts

- **View:** wheel zoom · Space+drag pan · `5` fit · ◐ switches light/dark interface (the page stays white; the choice is remembered)
- **Select:** click selects the outer group · double-click enters it · Esc goes up a level · Shift adds · Ctrl+click selects inside groups
- **Move:** drag (Ctrl locks the axis) · arrows 0.1 mm, Shift+arrows 1 mm
- **Scale/rotate:** corner handles (Shift for free scaling) · edge handles stretch one direction · orange dot rotates (Ctrl snaps to 15°)
- **Edit:** Ctrl+C / V / D / G, Ctrl+Shift+G · Delete · Ctrl+Z / Ctrl+Shift+Z · Home/End/PageUp/PageDown for z-order
- **Tools** (left strip): V select · T text · R rectangle · L line · A arrow · panel labels with the letter box below

Exports are named `name_YYMMDD.svg`. Untouched elements are written out unchanged, and edits are stored as `transform` attributes.

## Known issues

- Dragging very large groups (80k nodes) pauses about 0.5–0.9 s at the start and on release; the drag itself is smooth.
- Editing text removes svglite's `textLength`.
- Sub/superscript offsets differ slightly between Chrome and Inkscape.
- Tested against Inkscape 1.2.2.
