// Feature regression test on a blank A4 canvas (headless Chromium via Playwright).
//   node test/features.mjs
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
fs.mkdirSync(path.join(dir, 'test/out'), { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1400, height: 900 }, acceptDownloads: true });
p.on('pageerror', e => console.log('PAGEERROR', e.message));
p.on('dialog', d => d.accept());
await p.goto('file://' + dir + '/index.html');
const E = (f, a) => p.evaluate(f, a);
const frame = () => E(() => new Promise(r => requestAnimationFrame(() => setTimeout(r))));
let fails = 0; const ok = (c, m, extra = '') => { console.log((c ? 'ok  ' : 'FAIL') + ' ' + m + (extra !== '' ? ' ' + JSON.stringify(extra) : '')); if (!c) fails++; };
const scr = (x, y) => E(([x, y]) => { const r = view.getBoundingClientRect(); return [r.x + tx + (x - vb.x) * Z * k, r.y + ty + (y - vb.y) * Z * k]; }, [x, y]); // mm -> client (A4 doc uu=mm)
const box = () => E(() => sb && [sb.x, sb.y, sb.w, sb.h].map(v => +v.toFixed(3)));
const xml = id => E(id => new XMLSerializer().serializeToString(document.getElementById(id)), id);
async function field(f, v) { await p.fill(`[data-f=${f}]`, String(v)); await p.press(`[data-f=${f}]`, 'Enter'); await frame(); }

// new A4 blank is loaded at start
// --- text tool
await p.keyboard.press('t');
let [x, y] = await scr(30, 30); await p.mouse.click(x, y); await p.keyboard.type('Hello'); await p.keyboard.press('Enter'); await frame();
let t = await E(() => { const t = document.querySelector('#layer1 text'); return t && { id: t.id, s: t.getAttribute('style'), c: t.textContent, pt: tsize(t) }; });
ok(t && t.c === 'Hello' && /font-family:Arial/.test(t.s) && Math.abs(t.pt - 8) < 1e-4, 'text tool creates 8pt Arial text', t);
ok(await E(() => tool) === 'text', 'tool stays text'); await p.keyboard.press('Escape');
ok(await E(() => tool) === 'sel', 'Esc returns to select tool');
// --- double-click edit + superscript
let c = await E(id => { const r = document.getElementById(id).getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, t.id);
await p.mouse.dblclick(...c); await frame();
ok(await E(() => !!ed), 'double-click opens editor');
await p.keyboard.press('End'); await p.keyboard.type('2'); await p.keyboard.down('Shift'); await p.keyboard.press('ArrowLeft'); await p.keyboard.up('Shift');
await p.click('[data-a=sup]'); await p.keyboard.press('Enter'); await frame();
ok(/Hello<tspan style="font-size:65%;baseline-shift:super">2<\/tspan><\/text>/.test(await xml(t.id)), 'superscript tspan', await xml(t.id));
// sub
await p.mouse.dblclick(...c); await frame(); await p.keyboard.press('Home'); await p.keyboard.down('Shift'); await p.keyboard.press('ArrowRight'); await p.keyboard.up('Shift');
await p.click('[data-a=sub]'); await p.keyboard.press('Enter'); await frame();
ok(/baseline-shift:sub">H<\/tspan>ello<tspan[^>]*super">2/.test(await xml(t.id)), 'subscript tspan', await xml(t.id));
// Esc cancels edit
await p.mouse.dblclick(...c); await p.keyboard.type('zzz'); await p.keyboard.press('Escape'); await frame();
ok(await E(id => document.getElementById(id).textContent, t.id) === 'Hello2' && await E(() => !ed), 'Esc cancels edit');
// undo chain
await p.keyboard.press('Control+z'); await frame();
ok(/>Hello<tspan[^>]*super">2</.test(await xml(t.id)), 'undo sub', await xml(t.id));
await p.keyboard.press('Control+z'); await p.keyboard.press('Control+z'); await frame();
ok(await E(() => !document.querySelector('#layer1 text')), 'undo text creation');
await p.keyboard.press('Control+Shift+z'); await p.keyboard.press('Control+Shift+z'); await p.keyboard.press('Control+y'); await frame();
ok(/baseline-shift:sub">H</.test(await xml(t.id)), 'redo x3', await xml(t.id));
// empty new text discarded
await p.keyboard.press('t'); [x, y] = await scr(50, 80); await p.mouse.click(x, y); await p.keyboard.press('Enter'); await p.keyboard.press('Escape'); await frame();
ok(await E(() => document.querySelectorAll('#layer1 text').length) === 1 && await E(() => undos.at(-1).some(r => r.target.localName === 'text' && r.attributeName === null)) !== undefined, 'empty new text discarded');
const nUndo = await E(() => undos.length);
// --- bold / italic / color / font size / family
await p.mouse.click(...c); await frame();
await p.click('[data-a=bold]'); await p.click('[data-a=ital]'); await field('fs', 12); await field('ff', 'Times New Roman');
await p.$eval('[data-f=tc]', e => { e.value = '#ff0000'; e.dispatchEvent(new Event('change', { bubbles: true })); }); await frame();
let st = await E(id => document.getElementById(id).getAttribute('style'), t.id);
ok(/font-weight:bold/.test(st) && /font-style:italic/.test(st) && /font-family:'Times New Roman'/.test(st) && /fill:#ff0000/.test(st) && Math.abs(await E(id => tsize(document.getElementById(id)), t.id) - 12) < 1e-3, 'text props', st);
ok(/font-size:65%/.test(await xml(t.id)), 'relative tspan sizes kept');
// --- rect / line / arrow
await p.keyboard.press('r'); let a0 = await scr(20, 100), a1 = await scr(60, 130);
await p.mouse.move(...a0); await p.mouse.down(); await p.mouse.move(...a1, { steps: 4 }); await p.mouse.up(); await frame();
let rc = await E(() => { const e = sel[0]; return e && [e.localName, e.getAttribute('x'), e.getAttribute('y'), e.getAttribute('width'), e.getAttribute('height'), e.getAttribute('style')]; });
ok(rc && rc[0] === 'rect' && Math.abs(rc[3] - 40) < 0.5 && Math.abs(rc[4] - 30) < 0.5, 'rect tool', rc);
await p.keyboard.press('a'); a0 = await scr(20, 150); a1 = await scr(60, 152);
await p.keyboard.down('Shift'); await p.mouse.move(...a0); await p.mouse.down(); await p.mouse.move(...a1, { steps: 4 }); await p.mouse.up(); await p.keyboard.up('Shift'); await frame();
let ar = await E(() => { const e = sel[0]; return [e.getAttribute('d'), e.getAttribute('style'), !!document.getElementById('ArrowMsb')]; });
ok(/marker-end:url\(#ArrowMsb\)/.test(ar[1]) && ar[2] && /L [\d.]+,150$/.test(ar[0]), 'arrow tool (shift = horizontal)', ar);
const arrowId = await E(() => sel[0].id), rectId = rc && await E(() => document.querySelector('#layer1 rect').id);
// --- nudge
await p.mouse.click(...(await scr(20, 115))); await frame();
let b0 = await box(); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Shift+ArrowDown'); let b1 = await box();
ok(Math.abs(b1[0] - b0[0] - 0.1) < 1e-3 && Math.abs(b1[1] - b0[1] - 1) < 1e-3, 'nudge 0.1 mm / shift 1 mm', [b0, b1]);
ok(await E(id => document.getElementById(id).getAttribute('transform'), rectId) === 'translate(0.1,1)', 'nudge writes translate', await E(id => document.getElementById(id).getAttribute('transform'), rectId));
// --- W with lock, X/Y
await field('w', 20); b1 = await box(); ok(Math.abs(b1[2] - 20) < 1e-3 && Math.abs(b1[3] - 15) < 1e-3, 'W=20 locked ratio', b1);
await field('x', 5); await field('y', 7); b1 = await box(); ok(Math.abs(b1[0] - 5) < 1e-3 && Math.abs(b1[1] - 7) < 1e-3, 'X/Y fields', b1);
// --- stroke width pt, fill, opacity
await field('sw', 1); await field('op', 50);
st = await E(id => document.getElementById(id).getAttribute('style'), rectId);
ok(Math.abs(await E(id => { const e = document.getElementById(id); return parseFloat(getComputedStyle(e).strokeWidth) * sc(ctm(e)) * U * PT; }, rectId) - 1) < 1e-3 && /opacity:0.5/.test(st), 'stroke width 1pt / opacity 50%', st);
await p.$eval('[data-f=fill]', e => { e.value = '#00ff00'; e.dispatchEvent(new Event('change', { bubbles: true })); });
ok(/fill:#00ff00/.test(await E(id => document.getElementById(id).getAttribute('style'), rectId)), 'fill color');
await p.check('[data-f=nofill]'); ok(/fill:none/.test(await E(id => document.getElementById(id).getAttribute('style'), rectId)), 'fill none');
// --- scale handle (uniform) then rotate handle
b0 = await box(); let hs = await E(() => [...H.querySelectorAll('[data-h]')].map(h => { const r = h.getBoundingClientRect(); return [h.dataset.h, r.x + r.width / 2, r.y + r.height / 2]; }));
const se = hs.find(h => h[0] === 'se'); await p.mouse.move(se[1], se[2]); await p.mouse.down(); await p.mouse.move(se[1] + 40, se[2] + 5, { steps: 5 }); await p.mouse.up(); await frame();
b1 = await box(); ok(Math.abs(b1[2] / b1[3] - b0[2] / b0[3]) < 1e-3 && b1[2] > b0[2] && Math.abs(b1[0] - b0[0]) < 1e-3, 'corner scale uniform, anchored', [b0, b1]);
hs = await E(() => [...H.querySelectorAll('[data-h]')].map(h => { const r = h.getBoundingClientRect(); return [h.dataset.h, r.x + r.width / 2, r.y + r.height / 2]; }));
const ne = hs.find(h => h[0] === 'ne'); b0 = await box(); await p.keyboard.down('Shift'); await p.mouse.move(ne[1], ne[2]); await p.mouse.down(); await p.mouse.move(ne[1] + 30, ne[2], { steps: 5 }); await p.mouse.up(); await p.keyboard.up('Shift'); await frame();
b1 = await box(); ok(Math.abs(b1[3] - b0[3]) < 1e-3 && b1[2] > b0[2] + 5, 'shift+corner = free scale', [b0, b1]);
hs = await E(() => [...H.querySelectorAll('[data-h]')].map(h => { const r = h.getBoundingClientRect(); return [h.dataset.h, r.x + r.width / 2, r.y + r.height / 2]; }));
const rot = hs.find(h => h[0] === 'rot'); const cc = await E(() => [sb.x + sb.w / 2, sb.y + sb.h / 2]); const cs = await scr(...cc);
await p.keyboard.down('Control'); await p.mouse.move(rot[1], rot[2]); await p.mouse.down(); await p.mouse.move(cs[0] + 200, cs[1], { steps: 8 }); await p.mouse.up(); await p.keyboard.up('Control'); await frame();
let tr = await E(id => document.getElementById(id).getAttribute('transform'), rectId); const m = tr.match(/matrix\(([^)]*)\)/)[1].split(',').map(Number);
ok(Math.abs(Math.atan2(m[1], m[0]) * 180 / Math.PI - 90) < 1e-6, 'rotate handle + ctrl snaps to 90°', tr);
const c2 = await E(() => [sb.x + sb.w / 2, sb.y + sb.h / 2]); ok(Math.abs(c2[0] - cc[0]) < 1e-3 && Math.abs(c2[1] - cc[1]) < 1e-3, 'rotation about centre');
// rotate field
await field('r', -90); tr = await E(id => document.getElementById(id).getAttribute('transform'), rectId); ok(!/matrix/.test(tr) || tr.match(/matrix\(([^)]*)/)[1].split(',').slice(1, 3).every(v => Math.abs(v) < 1e-6), 'rotate field -90 undoes', tr);
// --- group / ungroup
await E(ids => setSel(ids.map(i => document.getElementById(i))), [rectId, arrowId]); const gb0 = await box();
await p.keyboard.press('Control+g'); await frame();
ok(await E(() => sel.length === 1 && sel[0].localName === 'g' && sel[0].children.length === 2), 'group');
await p.keyboard.press('ArrowLeft'); await p.keyboard.press('Control+Shift+g'); await frame(); let gb1 = await box();
ok(await E(() => sel.length === 2) && Math.abs(gb1[0] - gb0[0] + 0.1) < 1e-3 && Math.abs(gb1[2] - gb0[2]) < 1e-3, 'ungroup keeps positions', [gb0, gb1]);
// --- z-order
const order = () => E(() => [...document.getElementById('layer1').children].map(e => e.id));
await E(id => setSel([document.getElementById(id)]), rectId);
let o0 = await order(); await p.keyboard.press('End'); let o1 = await order(); ok(o1[0] === rectId, 'lower to bottom', o1);
await p.keyboard.press('PageUp'); o1 = await order(); ok(o1[1] === rectId, 'raise one step', o1);
await p.keyboard.press('Home'); o1 = await order(); ok(o1.at(-1) === rectId, 'raise to top', o1);
await p.keyboard.press('PageDown'); o1 = await order(); ok(o1.at(-2) === rectId, 'lower one step', o1);
// --- align / distribute
await E(ids => setSel(ids.map(i => document.getElementById(i))), [rectId, arrowId, t.id]);
await p.selectOption('#mRel', '1'); await p.click('[data-a=al]'); await frame();
let lefts = await E(() => sel.map(e => +bbox(e).x.toFixed(4))); ok(lefts.every(v => v === 0), 'align left to page', lefts);
await p.selectOption('#mRel', ''); await p.click('[data-a=dv]'); await frame();
let bs = await E(() => sel.map(e => bbox(e)).sort((a, b) => a.y - b.y)); const gaps = bs.slice(1).map((b, i) => +(b.y - bs[i].y - bs[i].h).toFixed(4));
ok(Math.abs(gaps[0] - gaps[1]) < 1e-3, 'distribute vertical equal gaps', gaps);
await p.click('[data-a=ac]'); await frame(); let cx = await E(() => sel.map(e => { const b = bbox(e); return +(b.x + b.w / 2).toFixed(3); })); ok(new Set(cx).size === 1, 'align centre', cx);
// --- copy / paste / duplicate / delete
await E(id => setSel([document.getElementById(id)]), rectId);
await p.keyboard.press('Control+c'); [x, y] = await scr(150, 200); await p.mouse.move(x, y); await p.keyboard.press('Control+v'); await frame();
let pc = await E(() => { const b = bbox(sel[0]); return [sel[0].id, +(b.x + b.w / 2).toFixed(2), +(b.y + b.h / 2).toFixed(2)]; });
ok(pc[0] !== rectId && Math.abs(pc[1] - 150) < 0.5 && Math.abs(pc[2] - 200) < 0.5, 'paste at cursor with new id', pc);
await p.keyboard.press('Control+d'); ok(await E(() => sel[0].id) !== pc[0] && await E(() => { const b = bbox(sel[0]); return Math.abs(b.x + b.w / 2 - 150) < 0.5; }), 'duplicate in place');
await p.keyboard.press('Delete'); ok(await E(id => !!document.getElementById(id) && sel.length === 0, pc[0]), 'delete');
// --- ungroup a clipped group (svglite style) including a transformed child
await E(() => { const d = defs(), cp = mk('clipPath', { id: 'cpT', clipPathUnits: 'userSpaceOnUse' }, d); mk('rect', { x: 100, y: 100, width: 20, height: 20 }, cp);
  const g = mk('g', { id: 'cg', 'clip-path': 'url(#cpT)', style: 'fill:#0000ff', transform: 'translate(5,5)' }, document.getElementById('layer1'));
  mk('rect', { id: 'cr1', x: 90, y: 90, width: 40, height: 40 }, g); mk('rect', { id: 'cr2', x: 90, y: 90, width: 40, height: 40, transform: 'translate(10,0)' }, g); commit(); setSel([g]); });
const before = await E(() => [...document.getElementById('cg').children].map(e => { const b = bbox(e); return [b.x, b.y, b.w, b.h].map(v => +v.toFixed(3)); }));
await p.keyboard.press('Control+Shift+g'); await frame();
const after = await E(() => sel.map(e => { const b = bbox(e); return [e.id, e.getAttribute('clip-path'), getComputedStyle(e).fill, [b.x, b.y, b.w, b.h].map(v => +v.toFixed(3))]; }));
ok(JSON.stringify(after.map(a => a[3])) === JSON.stringify([[105, 105, 20, 20], [105, 105, 20, 20]]) && after.every(a => a[1] && a[2] === 'rgb(0, 0, 255)'), 'ungroup clipped group keeps clip/style/position', { before, after });
// --- Ctrl+A, Esc
await p.keyboard.press('Control+a'); ok(await E(() => sel.length) >= 5, 'ctrl+a'); await p.keyboard.press('Escape'); ok(await E(() => sel.length) === 0, 'esc clears');
// --- zoom / pan
const z0 = await E(() => [Z, tx, ty]); [x, y] = await scr(100, 100);
await p.mouse.move(x, y); await p.mouse.wheel(0, -300); await p.waitForTimeout(400);
const z1 = await E(() => [Z, tx, ty]); const back = await E(([x, y]) => { const r = view.getBoundingClientRect(); return toU([x - r.x, y - r.y]); }, [x, y]);
ok(z1[0] > z0[0] * 1.5 && Math.abs(back.x - 100) < 0.3 && Math.abs(back.y - 100) < 0.3, 'wheel zoom keeps cursor point', [z0, z1, back]);
await p.keyboard.down(' '); await p.mouse.down(); await p.mouse.move(x + 50, y + 20, { steps: 3 }); await p.mouse.up(); await p.keyboard.up(' ');
const z2 = await E(() => [tx, ty]); ok(Math.abs(z2[0] - z1[1] - 50) < 1 && Math.abs(z2[1] - z1[2] - 20) < 1, 'space+drag pans', z2);
await p.keyboard.press('5'); ok(Math.abs(await E(() => Z) - z0[0]) < 1e-9, 'fit (5)');
// --- PNG export with pHYs
const [d] = await Promise.all([p.waitForEvent('download', { timeout: 60000 }), p.click('[data-a=p300]')]);
const png = fs.readFileSync(await d.path()); const w = png.readUInt32BE(16), h = png.readUInt32BE(20), ph = png.indexOf('pHYs');
ok(w === 2480 && h === 3508 && ph === 37 && png.readUInt32BE(41) === 11811 && png.slice(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), 'PNG 300 dpi A4 with pHYs', [d.suggestedFilename(), w, h, ph, png.readUInt32BE(41)]);
const [d2] = await Promise.all([p.waitForEvent('download'), p.click('[data-a=svg]')]); fs.writeFileSync(path.join(dir, 'test/out/features.svg'), fs.readFileSync(await d2.path()));
ok(d2.suggestedFilename() === 'figure_' + (await E(() => ymd())) + '.svg', 'svg name', d2.suggestedFilename());
console.log(fails ? `${fails} FAILED` : 'all passed'); await b.close(); process.exitCode = fails ? 1 : 0;
