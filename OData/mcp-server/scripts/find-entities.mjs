/**
 * Поиск сущностей OData по ключевому слову (по имени EntitySet).
 * Использование:
 *   node scripts/find-entities.mjs Отпуск
 *   node scripts/find-entities.mjs Организац
 */
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const keyword = process.argv[2];
if (!keyword) { console.error('Укажи ключевое слово: node scripts/find-entities.mjs <слово>'); process.exit(1); }

const env = { ...process.env };
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !(m[1] in env)) env[m[1]] = m[2];
  }
}
const base = (env.ODATA_BASE_URL || 'https://host.example.com/infobase/main_int/281/odata/standard.odata/').replace(/\/+$/, '') + '/';
const user = env.ODATA_USERNAME || 'OData.user';
const pass = env.ODATA_PASSWORD;
if (!pass || /^__/.test(pass)) { console.error('ODATA_PASSWORD не задан'); process.exit(1); }
const auth = 'Basic ' + Buffer.from(`${user}:${pass}`).toString('base64');

https.get(base + '?$format=json', { headers: { Authorization: auth, Accept: 'application/json' } }, (res) => {
  const chunks = [];
  res.on('data', c => chunks.push(c));
  res.on('end', () => {
    if (res.statusCode !== 200) { console.error('HTTP', res.statusCode); process.exit(1); }
    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    const hits = data.value.filter(e => e.name && e.name.includes(keyword)).map(e => e.name);
    console.log(`Найдено сущностей с «${keyword}»: ${hits.length}`);
    hits.forEach(n => console.log(' -', n));
  });
}).on('error', e => { console.error(e.message); process.exit(1); });
