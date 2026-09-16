const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
(async () => {
  const d = await get(base + "Catalog_ФизическиеЛица?$format=json&$top=1");
  const row = (d.value || [])[0] || {};
  console.log("Поля записи:");
  Object.keys(row).forEach((k) => console.log("  " + k + " = " + JSON.stringify(row[k])));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
