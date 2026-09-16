/**
 * Общий помощник для запросов к 1С OData (1С:Фреш).
 * Конфиг берётся из переменных окружения ODATA_* либо из .env.local / .env.
 * Пароли в этом файле НЕ хранятся.
 *
 * Использование (ES module):
 *   import * as odata from './odata-helper.mjs';
 *   const data = await odata.getEntities('Catalog_Организации', { top: 100 });
 *   const docs = await odata.getEntities('Document_Отпуск', { orderby: 'Date desc', top: 10 });
 */
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'; // внутренний сертификат Russian Post

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const ENV_FILES = ['.env.local', '.env'];

function loadEnv() {
  const env = { ...process.env };
  for (const file of ENV_FILES) {
    const p = path.join(ROOT, file);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (m && !(m[1] in env)) env[m[1]] = m[2].replace(/^"(.*)"$/, '$1').trim();
    }
  }
  return env;
}

function getConfig() {
  const env = loadEnv();
  const url = env.ODATA_BASE_URL || 'https://host.example.com/infobase/main_int/281/odata/standard.odata/';
  const user = env.ODATA_USERNAME || 'OData.user';
  const pass = env.ODATA_PASSWORD;
  if (!pass || /^__/.test(pass)) {
    throw new Error('ODATA_PASSWORD не задан. Передайте переменную окружения ODATA_PASSWORD (или заполните .env.local).');
  }
  return { base: url.replace(/\/+$/, '') + '/', user, pass };
}

function request(url, auth) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Authorization: auth, Accept: 'application/json' } }, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode !== 200) {
          reject(new Error('HTTP ' + res.statusCode + ': ' + buf.toString('utf8').substring(0, 300)));
          return;
        }
        try { resolve(JSON.parse(buf.toString('utf8'))); } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.setTimeout(60000, () => req.destroy(new Error('timeout')));
  });
}

/** URL-энкодинг кириллического имени сущности, например Catalog_Сотрудники */
function encEntity(name) {
  return name.split('').map(c => encodeURIComponent(c)).join('');
}

/**
 * Запрос списка сущностей.
 * @param {string} entity имя сущности (напр. 'Catalog_Сотрудники' или 'Document_Отпуск')
 * @param {object} opts { top, orderby, filter, select, skip }
 */
async function getEntities(entity, opts = {}) {
  const cfg = getConfig();
  const auth = 'Basic ' + Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64');
  const q = [];
  if (opts.top) q.push('$top=' + opts.top);
  if (opts.skip) q.push('$skip=' + opts.skip);
  if (opts.orderby) q.push('$orderby=' + encodeURIComponent(opts.orderby));
  if (opts.filter) q.push('$filter=' + encodeURIComponent(opts.filter));
  if (opts.select) q.push('$select=' + encodeURIComponent(opts.select));
  q.push('$format=json');
  const url = cfg.base + encEntity(entity) + (q.length ? '?' + q.join('&') : '');
  const data = await request(url, auth);
  return data.value || [];
}

/** Получить одну сущность по Ref_Key */
async function getEntityByRef(entity, refKey) {
  const cfg = getConfig();
  const auth = 'Basic ' + Buffer.from(`${cfg.user}:${cfg.pass}`).toString('base64');
  const url = cfg.base + encEntity(entity) + `(guid'${refKey}')?$format=json`;
  const data = await request(url, auth);
  return data;
}

/** Загрузить справочник целиком в Map: Ref_Key -> Description */
async function loadCatalogMap(entity) {
  const items = await getEntities(entity, { top: 100000 });
  const map = new Map();
  for (const it of items) map.set(it.Ref_Key, it.Description);
  return map;
}

export { getConfig, getEntities, getEntityByRef, loadCatalogMap, encEntity, ROOT };
