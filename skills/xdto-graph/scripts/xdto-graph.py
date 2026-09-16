# xdto-graph v1.0 - Build a full interactive graph (vis-network) of a 1C XDTO package
# Parses Ext/Package.bin (Designer XML export; actually XML with UTF-8 BOM),
# builds the type graph (nodes = types, edges = property references),
# computes hubs / roots / degrees and renders an interactive HTML (vis.js).
import argparse
import json
import os
import sys
from lxml import etree

sys.stdout.reconfigure(encoding="utf-8")
sys.stderr.reconfigure(encoding="utf-8")

X = "http://v8.1c.ru/8.1/xdto"
XS = "http://www.w3.org/2001/XMLSchema"

parser = argparse.ArgumentParser(allow_abbrev=False)
parser.add_argument("-PackagePath", "-Path", required=True,
                    help="package dir, path to Ext/Package.bin, or path to <Name>.xml descriptor")
parser.add_argument("-OutFile", default="", help="output .html (UTF-8); default: <pkg>.graph.html next to input")
parser.add_argument("-MinDegree", type=int, default=0, help="hide types referenced fewer times (in-degree)")
parser.add_argument("-Title", default="", help="page title / package label override")
args = parser.parse_args()


def find_bin(p):
    if os.path.isdir(p):
        cand = os.path.join(p, "Ext", "Package.bin")
        return cand if os.path.isfile(cand) else None
    if p.lower().endswith(".bin"):
        return p if os.path.isfile(p) else None
    if p.lower().endswith(".xml"):  # descriptor <Name>.xml -> <Name>/Ext/Package.bin
        base = p[:-4]               # folder named same as descriptor, minus .xml
        cand = os.path.join(base, "Ext", "Package.bin")
        if os.path.isfile(cand):
            return cand
        cand2 = os.path.join(os.path.dirname(p), "Ext", "Package.bin")
        return cand2 if os.path.isfile(cand2) else None
    return None

BIN = find_bin(args.PackagePath)
if not BIN:
    sys.exit("xdto-graph: Package.bin not found for %s" % args.PackagePath)

tree = etree.parse(BIN)
root = tree.getroot()
own_ns = root.get("targetNamespace")

prefix_uri = {}
for el in tree.iter():
    for k, v in el.nsmap.items():
        if k and k not in prefix_uri:
            prefix_uri[k] = v


def resolve(t):
    if not t:
        return ("none", "")
    if ":" in t:
        p, local = t.split(":", 1)
        uri = prefix_uri.get(p, "?")
    else:
        uri, local = own_ns, t
    if uri == own_ns:
        return ("own", local)
    if uri == XS:
        return ("xs", local)
    return ("ext", local)


imports = [i.get("namespace") for i in root.iter("{%s}import" % X)]
value_types = {}
object_types = {}
for vt in root.iter("{%s}valueType" % X):
    value_types[vt.get("name")] = {"base": vt.get("base"),
                                   "enum": [e.text for e in vt.iter("{%s}enumeration" % X)]}
for ot in root.iter("{%s}objectType" % X):
    props = [(p.get("name"), p.get("type"), p.get("cardinality"))
             for p in ot.iter("{%s}property" % X)]
    object_types[ot.get("name")] = {"base": ot.get("base"), "props": props}

pkg_name = os.path.basename(os.path.dirname(os.path.dirname(BIN))) or os.path.basename(BIN)
if args.Title:
    pkg_name = args.Title

agg = {}
ext_refs = {}
for ot_name, ot in object_types.items():
    for (pn, pt, card) in ot["props"]:
        cat, local = resolve(pt)
        if cat == "own" and local in value_types or (cat == "own" and local in object_types):
            agg.setdefault((ot_name, local), []).append(pn)
        else:
            ext_refs[(cat, local)] = ext_refs.get((cat, local), 0) + 1

nodes = []
seen = set()


def add_node(n):
    if n in seen:
        return
    seen.add(n)
    if n in object_types:
        group = "obj"
        shape, color = "box", "#1565c0"
        ttl = "ТИП (объектный)<br/>свойств: %d<br/>ссылок на него: %d" % (len(object_types[n]["props"]), indeg.get(n, 0))
        size = 12 + min(indeg.get(n, 0) * 2, 40)
    elif len(value_types[n].get("enum", [])) > 0:
        group = "enum"
        shape, color = "dot", "#f9a825"
        ttl = "ПЕРЕЧИСЛЕНИЕ<br/>значений: %d<br/>ссылок на него: %d" % (len(value_types[n]["enum"]), indeg.get(n, 0))
        size = 8 + min(indeg.get(n, 0) * 1.6, 34)
    else:
        group = "ref"
        shape, color = "dot", "#00897b"
        ttl = "ТИП (атомарный/ссылка)<br/>base: %s<br/>ссылок на него: %d" % (value_types[n].get("base", ""), indeg.get(n, 0))
        size = 8 + min(indeg.get(n, 0) * 1.6, 34)
    nodes.append({"id": n, "label": n.split(".")[-1], "title": ttl,
                  "shape": shape, "color": color, "value": size, "group": group, "name": n})


indeg = {}
for (s, d) in agg:
    indeg[d] = indeg.get(d, 0) + 1

edges = []
for (s, d), props in agg.items():
    add_node(s)
    add_node(d)
    edges.append({"from": s, "to": d,
                  "title": " : ".join(props[:8]) + (" …" if len(props) > 8 else ""),
                  "width": min(1 + len(props) * 0.7, 6)})

if args.MinDegree:
    keep = {n for n in seen if indeg.get(n, 0) >= args.MinDegree}
    nodes = [n for n in nodes if n["id"] in keep]
    edges = [e for e in edges if e["from"] in keep and e["to"] in keep]
    seen = keep

hubs = sorted(indeg.items(), key=lambda kv: -kv[1])[:10]
roots = sorted(n for n in object_types if indeg.get(n, 0) == 0)

data = {
    "nodes": nodes, "edges": edges,
    "ninfo": {n["name"]: n["title"] for n in nodes},
    "meta": {
        "name": pkg_name, "ns": own_ns, "imports": imports,
        "counts": {"object": sum(1 for n in seen if n in object_types),
                   "enum": sum(1 for n in seen if n in value_types and len(value_types[n]["enum"]) > 0),
                   "ref": sum(1 for n in seen if n in value_types and not len(value_types[n]["enum"]) > 0),
                   "edges": len(edges)},
        "hubs": hubs, "roots": roots,
    },
}

TPL = r"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>XDTO-граф: __TITLE__</title>
<script src="https://unpkg.com/vis-network@9.1.9/standalone/umd/vis-network.min.js"></script>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; margin:0; background:#f5f6f8; color:#222; }
  .top { background:#fff; border-bottom:1px solid #ddd; padding:10px 16px; display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
  .top h1 { font-size:16px; margin:0; }
  .meta { color:#666; font-size:12px; }
  #wrap { display:flex; height:calc(100vh - 52px); }
  #net { flex:1; background:#fff; }
  #side { width:340px; background:#fff; border-left:1px solid #ddd; overflow:auto; padding:12px; font-size:13px; }
  #side h3 { margin:6px 0; font-size:14px; }
  input[type=text] { width:100%; box-sizing:border-box; padding:7px 9px; border:1px solid #bbb; border-radius:5px; font-size:13px; }
  .chk { display:block; margin:4px 0; }
  table { border-collapse:collapse; width:100%; font-size:12px; }
  td, th { border:1px solid #e0e0e0; padding:3px 6px; text-align:left; }
  th { background:#eef1f5; }
  .lg { display:flex; align-items:center; gap:6px; margin:3px 0; }
  .sw { width:12px; height:12px; border-radius:50%; display:inline-block; }
  .swb { width:12px; height:12px; border:1px solid #999; display:inline-block; background:#1565c0; }
  #detail { margin-top:8px; font-size:12px; }
  #detail .d { background:#f5f7fa; border:1px solid #ddd; border-radius:6px; padding:8px; margin-top:6px; }
</style>
</head>
<body>
<div class="top">
  <h1>XDTO-граф: __TITLE__</h1>
  <span class="meta" id="meta">…</span>
</div>
<div id="wrap">
  <div id="net"></div>
  <div id="side">
    <input type="text" id="q" placeholder="Поиск типа… (Enter — выделить)">
    <button id="clear">Сброс</button>
    <h3>Фильтры</h3>
    <label class="chk"><input type="checkbox" id="f_obj" checked> Объектные типы</label>
    <label class="chk"><input type="checkbox" id="f_enum" checked> Перечисления</label>
    <label class="chk"><input type="checkbox" id="f_ref" checked> Атомарные/ссылки</label>
    <h3>Легенда</h3>
    <div class="lg"><span class="swb"></span> объектный тип</div>
    <div class="lg"><span class="sw" style="background:#f9a825"></span> перечисление</div>
    <div class="lg"><span class="sw" style="background:#00897b"></span> атомарный/ссылочный тип</div>
    <div class="lg"><span class="sw" style="background:#fff; border:1px solid #999"></span> размер = число ссылок</div>
    <h3>Хабы (топ-10)</h3>
    <div id="hubs"></div>
    <h3>Детали</h3>
    <div id="detail">Кликните тип на графе</div>
  </div>
</div>
<script>
const DATA = __DATA__;
const nodes = new vis.DataSet(DATA.nodes.map(n => ({...n})));
const edges = new vis.DataSet(DATA.edges.map(e => ({...e})));
const options = {
  nodes: { font: { size: 11, face: 'Segoe UI, Arial' } },
  edges: { arrows: 'to', smooth: { type: 'continuous' }, color: { color: '#90a4ae', highlight: '#e65100' } },
  physics: { enabled: true, solver: 'forceAtlas2Based', forceAtlas2Based: { gravitationalConstant: -60, centralGravity: 0.012, springLength: 120, springConstant: 0.06 }, stabilization: { iterations: 400 } },
  interaction: { hover: true, tooltipDelay: 120, hideEdgesOnDrag: true, keyboard: true },
  layout: { improvedLayout: true }
};
const net = new vis.Network(document.getElementById('net'), { nodes, edges }, options);
document.getElementById('meta').textContent =
  'объектных типов: ' + DATA.meta.counts.object +
  ' · перечислений: ' + DATA.meta.counts.enum +
  ' · атомарных/ссылок: ' + DATA.meta.counts.ref +
  ' · рёбер: ' + DATA.meta.counts.edges +
  ' · ns: ' + DATA.meta.ns;
document.getElementById('hubs').innerHTML = '<table><tr><th>Тип</th><th>ссылок</th></tr>' +
  DATA.meta.hubs.map(h => '<tr><td>' + h[0].split('.').pop() + '</td><td>' + h[1] + '</td></tr>').join('') + '</table>';
net.on('click', params => {
  if (!params.nodes.length) return;
  const id = params.nodes[0];
  const n = nodes.get(id);
  const es = edges.get().filter(e => e.from === id || e.to === id);
  let h = '<b>' + n.name + '</b><br/>' + n.title + '<br/>связей: ' + es.length + '<br/><ul style="margin:4px 0 0 14px;padding:0">';
  es.slice(0, 30).forEach(e => {
    const other = e.from === id ? nodes.get(e.to).name : nodes.get(e.from).name;
    h += '<li>' + (e.from === id ? '→ ' : '← ') + other.split('.').pop() + (e.title ? ' <span style="color:#888">[' + e.title + ']</span>' : '') + '</li>';
  });
  if (es.length > 30) h += '<li>… ещё ' + (es.length - 30) + '</li>';
  h += '</ul>';
  document.getElementById('detail').innerHTML = h;
});
function applyFilters() {
  const v = { obj: document.getElementById('f_obj').checked, enum: document.getElementById('f_enum').checked, ref: document.getElementById('f_ref').checked };
  nodes.forEach(n => nodes.update({ id: n.id, hidden: !v[n.group] }));
  edges.forEach(e => edges.update({ id: e.id, hidden: !(v[nodes.get(e.from).group] && v[nodes.get(e.to).group]) }));
  net.fit({ animation: true });
}
['f_obj', 'f_enum', 'f_ref'].forEach(id => document.getElementById(id).addEventListener('change', applyFilters));
document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('q').value = '';
  nodes.forEach(n => nodes.update({ id: n.id, hidden: false }));
  edges.forEach(e => edges.update({ id: e.id, hidden: false }));
  net.fit({ animation: true });
});
document.getElementById('q').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const q = e.target.value.trim().toLowerCase();
    if (!q) return;
    const hit = DATA.nodes.find(n => n.name.toLowerCase().includes(q));
    if (hit) { net.selectNodes([hit.id], true); net.focus(hit.id, { scale: 1.2, animation: true }); }
  }
});
</script>
</body>
</html>
"""

html_body = TPL.replace("__TITLE__", pkg_name).replace("__DATA__", json.dumps(data, ensure_ascii=False))

out = args.OutFile or os.path.join(os.path.dirname(BIN), pkg_name + ".graph.html")
with open(out, "wb") as f:
    f.write(b"\xef\xbb\xbf" + html_body.encode("utf-8"))

print("nodes=%d edges=%d roots=%d" % (len(nodes), len(edges), len(roots)))
print("graph -> %s" % out)
