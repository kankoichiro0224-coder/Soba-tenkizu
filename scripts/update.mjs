// 日経VI と CNN Fear & Greed を取得して data.json に書き出す。
// 取得に失敗した指標は前回値を残す(stale: true)。
import { readFile, writeFile } from 'node:fs/promises';

const UA = 'Mozilla/5.0 (compatible; soba-tenkizu/1.0)';
const OUT = new URL('../data.json', import.meta.url);

const jst = (d) =>
  new Date(d).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

async function getJson(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!r.ok) throw new Error(`${url} -> HTTP ${r.status}`);
  return r.json();
}

async function fetchFearGreed() {
  const d = await getJson('https://production.dataviz.cnn.io/index/fearandgreed/graphdata');
  const fg = d.fear_and_greed;
  if (!fg || typeof fg.score !== 'number') throw new Error('F&G: unexpected shape');
  return { value: Math.round(fg.score * 10) / 10, classification: fg.rating ?? null, as_of: jst(fg.timestamp) };
}

async function fetchNikkeiVI() {
  const d = await getJson('https://query1.finance.yahoo.com/v8/finance/chart/%5EJNIV?range=5d&interval=1d');
  const res = d.chart?.result?.[0];
  const price = res?.meta?.regularMarketPrice;
  if (typeof price !== 'number') throw new Error('VI: unexpected shape');
  return { value: Math.round(price * 100) / 100, as_of: jst((res.meta.regularMarketTime ?? Date.now() / 1000) * 1000) };
}

let prev = {};
try { prev = JSON.parse(await readFile(OUT, 'utf8')); } catch {}

const out = { updated_at: new Date().toISOString() };
let ok = 0;
for (const [key, fn] of [['nikkei_vi', fetchNikkeiVI], ['fear_greed', fetchFearGreed]]) {
  try { out[key] = await fn(); ok++; }
  catch (e) {
    console.error(`${key}: ${e.message}`);
    out[key] = { ...(prev[key] ?? { value: null, as_of: null }), stale: true };
  }
}
if (ok === 0 && prev.updated_at) { console.error('all sources failed; keeping previous file'); process.exit(1); }
await writeFile(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(JSON.stringify(out));
