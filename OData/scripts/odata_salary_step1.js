const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
(async () => {
  const filter = encodeURIComponent("Description eq 'Гордина Елена Владимировна'");
  const fl = await get(`${base}Catalog_ФизическиеЛица?$format=json&$select=Ref_Key,Description&$filter=${filter}`);
  console.log("=== Физ.лицо ===");
  console.log(JSON.stringify(fl.value, null, 2));

  const emp = await get(`${base}Catalog_Сотрудники?$format=json&$top=1`);
  const row = (emp.value || [])[0] || {};
  console.log("=== Поля Catalog_Сотрудники (первая запись) ===");
  Object.keys(row).forEach((k) => console.log("  " + k + " = " + JSON.stringify(row[k])));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
