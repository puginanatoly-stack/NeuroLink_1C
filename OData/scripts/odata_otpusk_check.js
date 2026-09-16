const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
(async () => {
  const d = await get(`${base}Document_Отпуск?$format=json&$top=5`);
  console.log("Document_Отпуск записей (top=5): " + (d.value || []).length);
  const r0 = (d.value || [])[0];
  if (r0) {
    console.log("=== Поля ===");
    Object.keys(r0).forEach((k) => console.log("  " + k + " = " + JSON.stringify(r0[k]).slice(0, 120)));
  } else {
    console.log("Записей нет вовсе.");
  }
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
