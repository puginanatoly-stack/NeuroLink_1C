const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
(async () => {
  const d = await get(`${base}Document_Отпуск?$format=json&$orderby=Date desc&$top=10`);
  const rows = d.value || [];
  console.log("Документов: " + rows.length);
  const r0 = rows[0] || {};
  console.log("=== Поля Document_Отпуск ===");
  Object.keys(r0).forEach((k) => console.log("  " + k + " = " + JSON.stringify(r0[k]).slice(0, 120)));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
