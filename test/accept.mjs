// Acceptance runs 1 and 2 driven through the UI with Playwright (headless Chromium).
//   node test/accept.mjs [outdir]
// Writes volcano_YYMMDD.svg, figure_YYMMDD.svg and PNG exports into outdir (default test/out).
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.resolve(process.argv[2] || path.join(dir, 'test/out'));
fs.mkdirSync(out, { recursive: true });
const volcano = path.join(dir, 'volcano.svg');
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 }, acceptDownloads: true });
page.on('pageerror', e => { log('PAGE ERROR', e.message); process.exitCode = 1; });
await page.goto('file://' + path.join(dir, 'index.html'));

const status = () => page.textContent('#mMsg');
const frame = () => page.evaluate(() => new Promise(r => requestAnimationFrame(() => setTimeout(r))));
const rect = id => page.evaluate(id => { const r = document.getElementById(id).getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }, id);
const union = async ids => { const rs = await Promise.all(ids.map(rect)); const x = Math.min(...rs.map(r => r.x)), y = Math.min(...rs.map(r => r.y)); return { x, y, x2: Math.max(...rs.map(r => r.x + r.w)), y2: Math.max(...rs.map(r => r.y + r.h)) }; };
const textIds = pred => page.evaluate(src => [...document.querySelectorAll('#mStage text')].filter(new Function('t', 'return ' + src)).map(t => t.id), pred);
const selected = () => page.evaluate(() => sel.map(e => e.id));
async function pickFile(action, file) {
  await page.evaluate(() => document.getElementById('mMsg').textContent = '');
  const [fc] = await Promise.all([page.waitForEvent('filechooser'), page.click(`[data-a=${action}]`)]);
  await fc.setFiles(file);
  await page.waitForFunction(() => /^(打开|导入) .* ms$/.test(document.getElementById('mMsg').textContent), null, { timeout: 120000 });
  log('  ' + await status());
}
async function field(f, v) { await page.fill(`[data-f=${f}]`, String(v)); await page.press(`[data-f=${f}]`, 'Enter'); await frame(); }
async function band(r, pad = 3) {
  await page.keyboard.down('Shift');
  await page.mouse.move(r.x2 + pad, r.y2 + pad); await page.mouse.down();
  await page.mouse.move((r.x + r.x2) / 2, (r.y + r.y2) / 2, { steps: 3 }); await page.mouse.move(r.x - pad, r.y - pad, { steps: 3 });
  await page.mouse.up(); await page.keyboard.up('Shift');
}
async function drag(x, y, dx, dy, steps = 30) {
  await page.mouse.move(x, y); await page.mouse.down();
  const t0 = Date.now();
  const l = Math.hypot(dx, dy); await page.mouse.move(x + 5 * dx / l, y + 5 * dy / l); await frame();
  const t1 = Date.now();
  await page.evaluate(() => { window.__f = []; const f = t => { __f.push(t); window.__r = requestAnimationFrame(f); }; requestAnimationFrame(f); });
  for (let i = 2; i <= steps; i++) { await page.mouse.move(x + dx * i / steps, y + dy * i / steps); await page.waitForTimeout(16); }
  const f = await page.evaluate(() => { cancelAnimationFrame(__r); return __f.slice(1).map((t, i) => t - __f[i]).sort((a, b) => a - b); });
  const t2 = Date.now(); await page.mouse.up(); await frame();
  return { start: t1 - t0, drop: Date.now() - t2, median: Math.round(f[f.length >> 1]), p90: Math.round(f[Math.floor(f.length * 0.9)]) };
}
async function save(action) {
  const [d] = await Promise.all([page.waitForEvent('download', { timeout: 120000 }), page.click(`[data-a=${action}]`)]);
  const f = path.join(out, d.suggestedFilename()); await d.saveAs(f); log('  saved', f); return f;
}

log('== Run 1: volcano.svg -> Arial, ticks 7 pt, axis titles 8 pt, move legend, export');
await pickFile('open', volcano);
await page.click('[data-a=arial]'); await frame();
const ticks = await textIds("t.parentNode.id==='g7' && /^-?\\d+$/.test(t.textContent)");
const xticks = [], yticks = [];
for (const id of ticks) (await page.evaluate(id => document.getElementById(id).getAttribute('text-anchor'), id)) === 'end' ? yticks.push(id) : xticks.push(id);
const r0 = await rect(xticks[0]);
await page.mouse.dblclick(r0.cx, r0.cy); await frame();
log('  1st double-click selects', await selected(), '| context', await page.textContent('#mCtx'));
await page.mouse.dblclick(r0.cx, r0.cy); await frame();
log('  2nd double-click selects', await selected(), '| context', await page.textContent('#mCtx'));
await band(await union(xticks)); await band(await union(yticks));
log('  texts in selection:', await page.evaluate(() => selTexts().length));
await field('fs', 7);
const [xt, yt] = await textIds("t.textContent==='log2 fold change' || t.textContent==='-log10(P)'");
await page.mouse.click((await rect(xt)).cx, (await rect(xt)).cy);
await page.keyboard.down('Shift'); await page.mouse.click((await rect(yt)).cx, (await rect(yt)).cy); await page.keyboard.up('Shift');
log('  axis titles selected:', await selected());
await field('fs', 8);
await page.keyboard.press('Escape'); await frame();
log('  Esc -> context', await page.textContent('#mCtx'), '| selected', await selected());
const lg = await rect(await textIds("t.textContent==='Regulation'").then(a => a[0]));
await page.mouse.click(lg.cx, lg.cy); await frame();
log('  legend click selects', await selected());
const mm = await page.evaluate(() => Z / U);
const d1 = await drag(lg.cx, lg.cy, -12 * mm, 30 * mm);
log('  legend drag:', JSON.stringify(d1), '| g8 transform =', await page.evaluate(() => document.getElementById('g8').getAttribute('transform')));
await save('svg');

log('== Drag the whole figure (80k nodes) and undo');
await page.keyboard.press('Escape'); await page.keyboard.press('Escape');
const g1 = await rect('g1');
await page.mouse.click(g1.x + 30, g1.y + 30);
log('  selected', await page.textContent('#mSel'));
const d2 = await drag(g1.x + 30, g1.y + 30, 40 * mm, 20 * mm, 60);
log('  whole-figure drag:', JSON.stringify(d2));
await page.keyboard.press('Control+z'); await frame();
log('  after undo g1 transform =', await page.evaluate(() => document.getElementById('g1').getAttribute('transform')));

log('== Run 2: new 180 mm canvas, import volcano.svg twice side by side, labels A/B, export');
page.once('dialog', d => d.accept());
await page.click('[data-a=new]');
await page.selectOption('#mPre', '180,120'); await page.fill('#mNH', '75'); await page.click('#mNew button[value=ok]'); await frame();
log('  ' + await status());
for (const [x, pre] of [[1, 'i1_'], [91, 'i2_']]) {
  await pickFile('imp', volcano);
  log('  imported group', await selected());
  await field('w', 88); await field('x', x); await field('y', 4);
}
const a = await rect('i1_g'), b = await rect('i2_g');
await page.mouse.click(a.x + 20, a.y + 20);
await page.keyboard.down('Shift'); await page.mouse.click(b.x + 20, b.y + 20); await page.keyboard.up('Shift');
await page.click('[data-a=at]'); await frame();
await page.click('[data-a=label]'); await frame();
log('  labels:', await page.evaluate(() => sel.map(t => `${t.textContent}@${t.getAttribute('x')},${t.getAttribute('y')}`)));
log('  panel boxes (mm):', await page.evaluate(() => ['i1_g', 'i2_g'].map(i => { const b = bbox(document.getElementById(i)); return [b.x, b.y, b.w, b.h].map(v => +v.toFixed(3)); })));
await save('svg');
await save('p300');
await browser.close();
