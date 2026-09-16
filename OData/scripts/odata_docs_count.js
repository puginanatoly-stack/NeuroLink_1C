const base = "http://localhost:8081/demohrmcorp/odata/standard.odata/";
const auth = "Basic " + Buffer.from("OData:Odata").toString("base64");
async function get(url) {
  const r = await fetch(url, { headers: { Authorization: auth } });
  if (!r.ok) throw new Error(r.status + " " + (await r.text()).slice(0, 500));
  return r.json();
}
(async () => {
  const docs = [
    "Document_Отпуск",
    "Document_ОтпускБезСохраненияОплаты",
    "Document_ОтпускПоУходуЗаРебенком",
    "Document_Командировка",
    "Document_БольничныйЛист",
    "Document_Премия",
    "Document_РазовоеНачисление",
    "Document_НачислениеЗаПервуюПоловинуМесяца"
  ];
  for (const name of docs) {
    try {
      const d = await get(`${base}${name}?$format=json&$top=1`);
      console.log(name.padEnd(45) + " : " + (d.value || []).length + " записей (top=1)");
    } catch (e) {
      console.log(name.padEnd(45) + " : ERR " + e.message);
    }
  }
})().catch(e => { console.error("ERR:", e.message); process.exit(1); });
