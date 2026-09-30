# Synthetic stand-in for volcano.svg: ggplot2/svglite facet volcano plot re-saved by Inkscape 1.4.
import random, sys

random.seed(7)
N = 20000  # circles and paths per panel
out = []
w = out.append


def el(tag, ind, attrs, body=None):
    pad = ' ' * ind
    s = pad + '<' + tag + ''.join('\n' + pad + '   ' + k + '="' + v + '"' for k, v in attrs)
    w(s + (' />' if body is None else '>' + body + '</' + tag + '>'))


def f(v, d=5):
    s = f'{v:.{d}f}'.rstrip('0').rstrip('.')
    return s


ids = {}


def nid(p):
    ids[p] = ids.get(p, 0) + 1
    return f'{p}{ids[p] + 100}'


P1, P2 = (38.83, 238.52), (244.0, 443.69)
PY = (40.1, 324.37)
CPF = 'cpMC4wMHw1MDQuMDB8MC4wMHwzNjAuMDA='
TL = "font-size:8.8px;font-family:'Liberation Sans';fill:#4d4d4d"

w('<?xml version="1.0" encoding="UTF-8" standalone="no"?>')
w('<!-- Created with Inkscape (http://www.inkscape.org/) -->\n')
w('''<svg
   width="210mm"
   height="297mm"
   viewBox="0 0 210 297"
   version="1.1"
   id="svg1"
   inkscape:version="1.4 (86a8ad7, 2024-10-11)"
   sodipodi:docname="volcano.svg"
   xmlns:inkscape="http://www.inkscape.org/namespaces/inkscape"
   xmlns:sodipodi="http://sodipodi.sourceforge.net/DTD/sodipodi-0.dtd"
   xmlns="http://www.w3.org/2000/svg"
   xmlns:svg="http://www.w3.org/2000/svg">
  <sodipodi:namedview
     id="namedview1"
     pagecolor="#ffffff"
     bordercolor="#000000"
     borderopacity="0.25"
     inkscape:showpageshadow="2"
     inkscape:pageopacity="0.0"
     inkscape:pagecheckerboard="0"
     inkscape:deskcolor="#d1d1d1"
     inkscape:document-units="mm"
     inkscape:zoom="0.73049556"
     inkscape:cx="396.99075"
     inkscape:cy="561.95"
     inkscape:window-width="1920"
     inkscape:window-height="1011"
     inkscape:window-x="0"
     inkscape:window-y="32"
     inkscape:window-maximized="1"
     inkscape:current-layer="layer1" />
  <defs
     id="defs1">
    <style
       type="text/css"
       id="style1"><![CDATA[
    .svglite line, .svglite polyline, .svglite polygon, .svglite path, .svglite rect, .svglite circle {
      fill: none;
      stroke: #000000;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-miterlimit: 10.00;
    }
    .svglite text {
      white-space: pre;
    }
  ]]></style>''')
clips = [(CPF, (0, 0, 504, 360)), ('clipPath2', (P1[0], PY[0], P1[1] - P1[0], PY[1] - PY[0])),
         ('clipPath3', (P2[0], PY[0], P2[1] - P2[0], PY[1] - PY[0])), ('clipPath4', (P1[0], 22.4, P1[1] - P1[0], 17.7)),
         ('clipPath5', (P2[0], 22.4, P2[1] - P2[0], 17.7)), (CPF + '-7', (0, 0, 504, 360)), ('clipPath7', (0, 0, 504, 360))]
for cid, (x, y, cw, ch) in clips:
    w(f'    <clipPath\n       clipPathUnits="userSpaceOnUse"\n       id="{cid}">')
    el('rect', 6, [('x', f(x, 2)), ('y', f(y, 2)), ('width', f(cw, 2)), ('height', f(ch, 2)), ('id', nid('rect'))])
    w('    </clipPath>')
w('  </defs>')
w('  <g\n     inkscape:label="Layer 1"\n     inkscape:groupmode="layer"\n     id="layer1">')
w('    <g\n       id="g1"\n       transform="matrix(0.35277778,0,0,0.35277778,15.52,20.35)">')
el('rect', 6, [('width', '504'), ('height', '360'), ('style', 'fill:#ffffff;stroke:none'), ('id', 'rect1')])


def grp(gid, clip):
    w(f'      <g\n         clip-path="url(#{clip})"\n         id="{gid}">')


grp('g2', CPF)
el('rect', 8, [('x', '0'), ('y', '0'), ('width', '504'), ('height', '360'),
               ('style', 'fill:#ffffff;stroke:#ffffff;stroke-width:1.06698;stroke-linecap:round;stroke-linejoin:round'), ('id', nid('rect'))])
w('      </g>')


def sx(px, v): return px[0] + 9.07 + (v + 5) / 10 * (px[1] - px[0] - 18.14)
def sy(v): return PY[1] - 13 - v / 17 * (PY[1] - PY[0] - 26)


def panel(gid, clip, px):
    grp(gid, clip)
    el('rect', 8, [('x', f(px[0], 2)), ('y', f(PY[0], 2)), ('width', f(px[1] - px[0], 2)), ('height', f(PY[1] - PY[0], 2)),
                   ('style', 'fill:#ebebeb;stroke:none'), ('id', nid('rect'))])
    for v in (0, 5, 10, 15):
        el('polyline', 8, [('points', f'{f(px[0], 2)},{f(sy(v), 2)} {f(px[1], 2)},{f(sy(v), 2)} '),
                           ('style', 'fill:none;stroke:#ffffff;stroke-width:1.06698;stroke-linecap:butt'), ('id', nid('polyline'))])
    for v in (-4, -2, 0, 2, 4):
        el('polyline', 8, [('points', f'{f(sx(px, v), 2)},{f(PY[1], 2)} {f(sx(px, v), 2)},{f(PY[0], 2)} '),
                           ('style', 'fill:none;stroke:#ffffff;stroke-width:1.06698;stroke-linecap:butt'), ('id', nid('polyline'))])
    for _ in range(N):
        x = random.gauss(0, 0.9)
        y = abs(random.gauss(0, 1.6))
        el('circle', 8, [('cx', f(sx(px, x))), ('cy', f(sy(y))), ('r', '1.95'),
                         ('style', 'fill:#bebebe;fill-opacity:0.6;stroke:#bebebe;stroke-width:0.708661;stroke-opacity:0.6'),
                         ('id', nid('circle'))])
    for _ in range(N):
        up = random.random() < 0.5
        x = (1 if up else -1) * (1 + abs(random.gauss(0, 1.3)))
        y = 1.3 + abs(random.gauss(0, 4))
        cx, cy = sx(px, x) + 1.95, sy(y)
        col, sc = ('#b2182b', '#67001f') if up else ('#2166ac', '#053061')
        d = (f'm {f(cx)},{f(cy)} c 0,1.07695 -0.87305,1.95 -1.95,1.95 -1.07695,0 -1.95,-0.87305 -1.95,-1.95 '
             '0,-1.07695 0.87305,-1.95 1.95,-1.95 1.07695,0 1.95,0.87305 1.95,1.95 z')
        el('path', 8, [('d', d), ('style', f'fill:{col};fill-opacity:0.8;stroke:{sc};stroke-width:0.708661;stroke-linecap:round;stroke-linejoin:round;stroke-miterlimit:10;stroke-opacity:0.8'),
                       ('id', nid('path'))])
    for v in (-1, 1):
        el('polyline', 8, [('points', f'{f(sx(px, v), 2)},{f(PY[1], 2)} {f(sx(px, v), 2)},{f(PY[0], 2)} '),
                           ('style', 'fill:none;stroke:#333333;stroke-width:0.853583;stroke-dasharray:3.41, 3.41;stroke-linecap:butt'), ('id', nid('polyline'))])
    w('      </g>')


panel('g3', 'clipPath2', P1)
panel('g4', 'clipPath3', P2)
for gid, clip, px, lab in (('g5', 'clipPath4', P1, 'KO vs WT'), ('g6', 'clipPath5', P2, 'DKO vs WT')):
    grp(gid, clip)
    el('rect', 8, [('x', f(px[0], 2)), ('y', '22.4'), ('width', f(px[1] - px[0], 2)), ('height', '17.7'),
                   ('style', 'fill:#d9d9d9;stroke:none'), ('id', nid('rect'))])
    el('text', 8, [('x', f((px[0] + px[1]) / 2, 2)), ('y', '34.28'), ('text-anchor', 'middle'),
                   ('style', "font-size:8.8px;font-family:'Liberation Sans';fill:#1a1a1a"), ('textLength', '38.66px'),
                   ('lengthAdjust', 'spacingAndGlyphs'), ('id', nid('text'))], lab)
    w('      </g>')
grp('g7', CPF + '-7')
for px in (P1, P2):
    for v in (-4, -2, 0, 2, 4):
        x = sx(px, v)
        el('polyline', 8, [('points', f'{f(x, 2)},{f(PY[1] + 2.74, 2)} {f(x, 2)},{f(PY[1], 2)} '),
                           ('style', 'fill:none;stroke:#333333;stroke-width:1.06698;stroke-linecap:butt'), ('id', nid('polyline'))])
        el('text', 8, [('x', f(x, 2)), ('y', f(PY[1] + 10.58, 2)), ('text-anchor', 'middle'), ('style', TL),
                       ('textLength', f(4.89 * len(str(v)), 2) + 'px'), ('lengthAdjust', 'spacingAndGlyphs'), ('id', nid('text'))], str(v))
for v in (0, 5, 10, 15):
    y = sy(v)
    el('polyline', 8, [('points', f'{f(P1[0] - 2.74, 2)},{f(y, 2)} {f(P1[0], 2)},{f(y, 2)} '),
                       ('style', 'fill:none;stroke:#333333;stroke-width:1.06698;stroke-linecap:butt'), ('id', nid('polyline'))])
    el('text', 8, [('x', f(P1[0] - 4.93, 2)), ('y', f(y + 3.15, 2)), ('text-anchor', 'end'), ('style', TL),
                   ('textLength', f(4.89 * len(str(v)), 2) + 'px'), ('lengthAdjust', 'spacingAndGlyphs'), ('id', nid('text'))], str(v))
el('text', 8, [('x', '241.26'), ('y', '352.03'), ('text-anchor', 'middle'), ('style', 'font-size:11px;font-family:Arial;fill:#000000'),
               ('id', nid('text'))], 'log2 fold change')
el('text', 8, [('transform', 'rotate(-90)'), ('x', '-182.24'), ('y', '13.37'), ('text-anchor', 'middle'),
               ('style', 'font-size:11px;font-family:Arial;fill:#000000'), ('id', nid('text'))], '-log10(P)')
w(f'''        <text
           xml:space="preserve"
           x="38.83"
           y="14.93"
           style="font-weight:bold;font-size:13.2px;font-family:Arial;-inkscape-font-specification:'Arial Bold';fill:#000000"
           id="{nid('text')}"><tspan
             sodipodi:role="line"
             id="tspan1"
             x="38.83"
             y="14.93">Differential expression</tspan></text>''')
w('      </g>')
grp('g8', 'clipPath7')
el('text', 8, [('x', '452.2'), ('y', '160.4'), ('style', 'font-size:11px;fill:#000000'), ('font-family', 'Helvetica'), ('id', nid('text'))], 'Regulation')
for i, (lab, fill, stroke, circ) in enumerate((('Down', '#2166ac', '#053061', 0), ('NS', '#bebebe', '#bebebe', 1), ('Up', '#b2182b', '#67001f', 0))):
    y0 = 167.3 + i * 17.28
    el('rect', 8, [('x', '452.2'), ('y', f(y0, 2)), ('width', '17.28'), ('height', '17.28'), ('style', 'fill:#ebebeb;stroke:none'), ('id', nid('rect'))])
    cx, cy = 460.84, y0 + 8.64
    if circ:
        el('circle', 8, [('cx', f(cx, 2)), ('cy', f(cy, 2)), ('r', '1.95'), ('style', f'fill:{fill};stroke:{stroke};stroke-width:0.708661'), ('id', nid('circle'))])
    else:
        el('path', 8, [('d', f'm {f(cx + 1.95, 2)},{f(cy, 2)} c 0,1.07695 -0.87305,1.95 -1.95,1.95 -1.07695,0 -1.95,-0.87305 -1.95,-1.95 0,-1.07695 0.87305,-1.95 1.95,-1.95 1.07695,0 1.95,0.87305 1.95,1.95 z'),
                       ('style', f'fill:{fill};stroke:{stroke};stroke-width:0.708661'), ('id', nid('path'))])
    el('text', 8, [('x', '474.96'), ('y', f(cy + 3.15, 2)), ('style', 'font-size:8.8px;font-family:Helvetica;fill:#000000'), ('id', nid('text'))], lab)
w('      </g>\n    </g>\n  </g>\n</svg>\n')
open(sys.argv[1] if len(sys.argv) > 1 else 'volcano.svg', 'w').write('\n'.join(out))
