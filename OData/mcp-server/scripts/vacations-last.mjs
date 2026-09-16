/**
 * Последние N отпусков (Document_Отпуск) с именами сотрудников и организаций.
 * Использование:
 *   node scripts/vacations-last.mjs [N]
 *   node scripts/vacations-last.mjs 10
 */
import * as odata from './odata-helper.mjs';

const n = parseInt(process.argv[2], 10) || 10;

const [vacations, employees, persons, orgs] = await Promise.all([
  odata.getEntities('Document_Отпуск', { orderby: 'Date desc', top: n }),
  odata.loadCatalogMap('Catalog_Сотрудники'),
  odata.loadCatalogMap('Catalog_ФизическиеЛица'),
  odata.loadCatalogMap('Catalog_Организации'),
]);

console.log(`=== Последние ${vacations.length} отпусков (Document_Отпуск) ===\n`);
vacations.forEach((v, i) => {
  const emp = employees.get(v.Сотрудник_Key) || persons.get(v.ФизическоеЛицо_Key) || '(нет данных)';
  const org = orgs.get(v.Организация_Key) || '(нет данных)';
  const start = (v.ДатаНачалаПериодаОтсутствия || '').substring(0, 10);
  const end = (v.ДатаОкончанияПериодаОтсутствия || '').substring(0, 10);
  console.log(`${i + 1}. [${(v.Number || '').trim()}] ${emp}`);
  console.log(`   Организация: ${org}`);
  console.log(`   Период отпуска: ${start} — ${end}  (${v.КоличествоДнейОсновногоОтпуска} дн.)`);
  console.log(`   Дата документа: ${(v.Date || '').substring(0, 10)}  Проведён: ${v.Posted ? 'да' : 'нет'}`);
  console.log('');
});
