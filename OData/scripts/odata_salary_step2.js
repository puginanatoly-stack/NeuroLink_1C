const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
(async () => {
  const flKey = "bcbb0cbc-2d55-11e6-9b29-5404a6b49dba";
  const empFilter = encodeURIComponent(`ФизическоеЛицо_Key eq guid'${flKey}'`);
  const emp = await get(`${base}Catalog_Сотрудники?$format=json&$select=Ref_Key,Description&$filter=${empFilter}`);
  console.log("=== Сотрудник Гординой ===");
  console.log(JSON.stringify(emp.value, null, 2));

  const doc = await get(`${base}Document_НачислениеЗарплаты?$format=json&$top=1`);
  const row = (doc.value || [])[0] || {};
  console.log("=== Поля Document_НачислениеЗарплаты ===");
  Object.keys(row).forEach((k) => console.log("  " + k + " = " + JSON.stringify(row[k]).slice(0, 400)));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
