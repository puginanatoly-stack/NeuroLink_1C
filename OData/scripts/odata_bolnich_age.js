const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
function ageAt(bornStr, atStr) {
  const born = new Date(bornStr);
  const at = new Date(atStr);
  if (isNaN(born) || isNaN(at)) return null;
  let a = at.getFullYear() - born.getFullYear();
  const m = at.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && at.getDate() < born.getDate())) a--;
  return a;
}
(async () => {
  const selBl = encodeURIComponent("Ref_Key,Number,Date,ФизическоеЛицо_Key,Сотрудник_Key,ДатаНачала,ДатаОкончания,ДнейОплаты,Начислено,ПричинаНетрудоспособности,ПроцентОплаты");
  const bl = await get(`${base}Document_БольничныйЛист?$format=json&$select=${selBl}&$orderby=Date desc&$top=2000`);
  const bls = bl.value || [];
  console.log("Всего больничных: " + bls.length);

  const selFl = encodeURIComponent("Ref_Key,Description,ДатаРождения");
  const fl = await get(`${base}Catalog_ФизическиеЛица?$format=json&$select=${selFl}&$top=5000`);
  const fls = fl.value || [];
  const flMap = {};
  fls.forEach((f) => { flMap[f.Ref_Key] = f; });

  console.log("\n=== Документы БольничныйЛист ===");
  let rows = [];
  bls.forEach((b, i) => {
    const f = flMap[b["ФизическоеЛицо_Key"]] || {};
    const born = f["ДатаРождения"];
    const age = ageAt(born, b["ДатаНачала"]);
    rows.push({ num: b.Number, date: (b.Date || "").slice(0, 10), name: f.Description || "?", age, from: (b["ДатаНачала"] || "").slice(0, 10), to: (b["ДатаОкончания"] || "").slice(0, 10), days: b["ДнейОплаты"], sum: b["Начислено"], reason: b["ПричинаНетрудоспособности"] });
  });
  rows.forEach((r, i) => {
    console.log(`${(i + 1)}. ${r.date} | ${r.name} | возр ${r.age} | ${r.from}–${r.to} | дней ${r.days} | ${Number(r.sum).toFixed(2)} руб | ${r.reason}`);
  });

  const withAge = rows.filter((r) => r.age != null && r.age > 0);
  console.log("\n=== Корреляция возраст ↔ больничные ===");
  const groups = { "до 40": [0, 39], "40–49": [40, 49], "50–59": [50, 59], "60+": [60, 200] };
  Object.keys(groups).forEach((g) => {
    const [a, b] = groups[g];
    const gr = withAge.filter((r) => r.age >= a && r.age <= b);
    const days = gr.reduce((s, r) => s + (Number(r.days) || 0), 0);
    const cnt = gr.length;
    console.log(`  ${g.padEnd(6)}: человек-больничных ${cnt}, всего дней ${days}, средн. дней/случай ${cnt ? (days / cnt).toFixed(1) : 0}`);
  });
  const avgAge = withAge.reduce((s, r) => s + r.age, 0) / (withAge.length || 1);
  console.log("Средний возраст болевших: " + avgAge.toFixed(1) + " лет (по " + withAge.length + " случаям)");
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
