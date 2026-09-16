const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function getText(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.text();
}
(async () => {
  const md = await getText(base + "$metadata");
  const sets = [...md.matchAll(/EntitySet\s+Name="([^"]+)"/g)].map((m) => m[1]);
  const calc = sets.filter((s) => /CalculationRegister/i.test(s));
  console.log("=== Регистры расчёта ===");
  calc.forEach((s) => console.log("  " + s));
  console.log("=== EntitySet с 'Начисл' ===");
  sets.filter((s) => /Начисл/i.test(s)).forEach((s) => console.log("  " + s));
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
