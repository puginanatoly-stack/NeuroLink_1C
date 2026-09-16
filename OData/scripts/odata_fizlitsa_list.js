const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 500));
  return r.json();
}
(async () => {
  const d = await get(base + "Catalog_ФизическиеЛица?$format=json&$top=50&$orderby=Description&$select=Ref_Key,Description");
  const rows = d.value || [];
  console.log("Всего в выборке: " + rows.length);
  rows.forEach((v, i) => console.log((i + 1) + ". " + (v.Description || v.Ref_Key)));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
