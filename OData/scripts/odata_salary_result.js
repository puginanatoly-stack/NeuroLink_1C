const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
(async () => {
  const empKey = "bcbb0cbb-2d55-11e6-9b29-5404a6b49dba";
  const filter = encodeURIComponent(`Сотрудник_Key eq guid'${empKey}'`);
  const select = encodeURIComponent("Ref_Key,LineNumber,Сотрудник_Key,Начисление_Key,Результат,ДатаНачала,ДатаОкончания");
  const url = `${base}Document_НачислениеЗарплаты_Начисления?$format=json&$select=${select}&$filter=${filter}&$top=1000`;
  const d = await get(url);
  const rows = d.value || [];
  console.log("Строк начислений: " + rows.length);
  const byMonth = {};
  rows.forEach((r) => {
    const m = (r["ДатаНачала"] || "").slice(0, 7);
    const sum = Number(r["Результат"] || 0);
    byMonth[m] = (byMonth[m] || 0) + sum;
  });
  console.log("\n=== Начисленная зарплата по месяцам (Гордина Е.В.) ===");
  Object.keys(byMonth).sort().forEach((m) => console.log(m + "  →  " + byMonth[m].toFixed(2)));
  const total = Object.values(byMonth).reduce((a, b) => a + b, 0);
  console.log("ИТОГО: " + total.toFixed(2));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
