# minisvgbench

> I once paid for Adobe, then fell for open-source Inkscape, but at heart I've always loved lightweight tools, ideally ones that run right in the browser; now that AI is here, we can hand-craft the manual parts of our workflows exactly the way we want.

**Live: https://jieqianghe.github.io/minisvgbench/**

A tiny in-browser SVG editor for touching up figures from ggplot2 or Inkscape: edit text, move and resize, restyle, combine panels, export. Nothing is uploaded.

- Open or drop an SVG. Click selects a group; double-click goes inside it, Esc comes back out.
- Scroll to move around; Ctrl+scroll (or pinch) zooms.
- Draw text, rectangles, ellipses, lines and arrows, and add A/B/C panel labels in one click. The right panel sets position, size, rotation, alignment, fonts, fill, stroke and dashes; drag the dot inside a selected rectangle's corner to round it.
- Rulers, a mm grid and a light/dark interface can be switched on and off from the top bar.
- Hover any button to see what it does and its shortcut.
- Export writes `name_YYMMDD.svg` (or PNG) and leaves everything you didn't touch unchanged.
