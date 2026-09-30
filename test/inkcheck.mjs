// Checks that an exported SVG opens in Inkscape and lands where the web page shows it.
//   node test/inkcheck.mjs file.svg id1 id2 ...
// Prints Inkscape --query-all boxes vs. the page's boxes (mm) for the given ids, and compares
// an Inkscape PNG render with a Chromium render of the same file (150 dpi). Writes <file>.overlay.png
// (red = only Inkscape, cyan = only Chromium).
import { chromium } from 'playwright';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [file, ...ids] = process.argv.slice(2);
const px2mm = 25.4 / 96, dpi = 150, inkPng = file + '.inkscape.png';
const t0 = Date.now();
const q = execFileSync('inkscape', ['--query-all', file], { maxBuffer: 1 << 28, stdio: ['ignore', 'pipe', 'ignore'] }).toString();
execFileSync('inkscape', [file, '--export-type=png', `--export-dpi=${dpi}`, '--export-area-page', '--export-background=#ffffff', '--export-background-opacity=1', `--export-filename=${inkPng}`], { stdio: 'ignore' });
console.log(`Inkscape: ${q.trim().split('\n').length} objects queried, rendered in ${Date.now() - t0} ms (${execFileSync('inkscape', ['--version'], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()})`);
const ink = Object.fromEntries(q.trim().split('\n').map(l => l.split(',')).map(([id, ...v]) => [id, v.map(x => +x * px2mm)]));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.setInputFiles('#mFile', file);
await page.waitForFunction(() => /^打开 /.test(document.getElementById('mMsg').textContent), null, { timeout: 120000 });
const web = await page.evaluate(ids => Object.fromEntries(ids.map(i => { const b = bbox(document.getElementById(i)); return [i, [(b.x - vb.x) * U, (b.y - vb.y) * U, b.w * U, b.h * U]]; })), ids);
console.log('id'.padEnd(12), 'Inkscape x,y,w,h (mm)'.padEnd(36), 'web x,y,w,h (mm)'.padEnd(36), 'centre offset (mm)');
for (const i of ids) {
  const a = ink[i], b = web[i], f = v => v.map(x => x.toFixed(2).padStart(7)).join(' ');
  console.log(i.padEnd(12), f(a).padEnd(36), f(b).padEnd(36), [(a[0] + a[2] / 2) - (b[0] + b[2] / 2), (a[1] + a[3] / 2) - (b[1] + b[3] / 2)].map(v => v.toFixed(3)).join(', '));
}
const res = await page.evaluate(async ([png, dpi]) => {
  const W = Math.round(vb.w * U / 25.4 * dpi), H = Math.round(vb.h * U / 25.4 * dpi);
  const draw = async src => { const img = new Image(); img.src = src; await img.decode(); const c = new OffscreenCanvas(W, H), g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(img, 0, 0, W, H); return g.getImageData(0, 0, W, H).data; };
  const a = await draw('data:image/png;base64,' + png), b = await draw(URL.createObjectURL(new Blob([svgText()], { type: 'image/svg+xml' })));
  const o = new OffscreenCanvas(W, H), og = o.getContext('2d'), od = og.createImageData(W, H);
  let diff = 0, ink = 0;
  for (let i = 0; i < a.length; i += 4) {
    const da = a[i] + a[i + 1] + a[i + 2] < 600, db = b[i] + b[i + 1] + b[i + 2] < 600;
    ink += da || db; diff += da !== db;
    od.data.set(da && db ? [90, 90, 90, 255] : da ? [230, 0, 0, 255] : db ? [0, 190, 230, 255] : [255, 255, 255, 255], i);
  }
  og.putImageData(od, 0, 0);
  const u = new Uint8Array(await (await o.convertToBlob()).arrayBuffer());
  let s = ''; for (let i = 0; i < u.length; i += 32768) s += String.fromCharCode(...u.subarray(i, i + 32768));
  return { W, H, ink, diff, overlay: btoa(s) };
}, [fs.readFileSync(inkPng).toString('base64'), dpi]);
fs.writeFileSync(file + '.overlay.png', Buffer.from(res.overlay, 'base64'));
console.log(`render ${res.W}x${res.H}: ${res.diff} of ${res.ink} inked pixels differ (${(100 * res.diff / res.ink).toFixed(2)}%), overlay -> ${file}.overlay.png`);
await browser.close();
