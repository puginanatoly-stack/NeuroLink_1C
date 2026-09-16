const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
(async () => {
  const d = await get(`${base}CalculationRegister_Начисления?$format=json&$top=1`);
  const rec = (d.value || [])[0] || {};
  const rows = rec.RecordSet || [];
  console.log("Recorder_Type: " + rec.Recorder_Type);
  console.log("Строк в наборе: " + rows.length);
  console.log("=== Поля строки RecordSet ===");
  const r0 = rows[0] || {};
  Object.keys(r0).forEach((k) => console.log("  " + k + " = " + JSON.stringify(r0[k])));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
