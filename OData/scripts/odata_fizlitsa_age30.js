const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 800));
  return r.json();
}
function age(bornStr) {
  const born = new Date(bornStr);
  const now = new Date();
  let a = now.getFullYear() - born.getFullYear();
  const m = now.getMonth() - born.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < born.getDate())) a--;
  return a;
}
(async () => {
  const cutoff = "1996-08-28";
  const filter = encodeURIComponent(`ДатаРождения lt datetime'${cutoff}T00:00:00'`);
  const select = encodeURIComponent("Description,ДатаРождения");
  const orderby = encodeURIComponent("ДатаРождения");
  const url = `${base}Catalog_ФизическиеЛица?$format=json&$select=${select}&$filter=${filter}&$orderby=${orderby}&$top=200`;
  const d = await get(url);
  const rows = d.value || [];
  console.log("Физ.лица старше 30 лет: " + rows.length);
  rows.forEach((v, i) => {
    const born = (v["ДатаРождения"] || "").slice(0, 10);
    console.log(`${(i + 1)}. ${v.Description} — ${born} (${age(v["ДатаРождения"])} лет)`);
  });
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
