const fs = require("fs");

const path = "src/data.json";
const data = JSON.parse(fs.readFileSync(path, "utf8"));

function normalize(text) {
  return String(text || "").toLowerCase();
}

function inferProvinciaFromText(text) {
  const t = normalize(text);
  if (t.includes("cn-") || t.includes("_cn_") || t.includes("cienaga negra") || t.includes("ciénaga negra")) return "cienaga_negra";
  if (t.includes("sk-") || t.includes("_sk_") || t.includes("skyrim")) return "skyrim";
  if (t.includes("ra-") || t.includes("_ra_") || t.includes("roca alta") || t.includes("wrothgar")) return "roca_alta";
  if (t.includes("morrowind")) return "morrowind";
  if (t.includes("cyrodiil") || t.includes("leyawiin")) return "cyrodiil";
  return "";
}

function inferGremioFromText(text) {
  const t = normalize(text);
  if (t.includes("gremio de ladrones")) return "ladrones";
  if (t.includes("gremio de magos")) return "magos";
  if (t.includes("gremio de luchadores")) return "luchadores";
  return "";
}

let mergedCount = 0;
let taggedCount = 0;
const removable = new Set();

for (const [, node] of Object.entries(data)) {
  if (!node || !Array.isArray(node.options)) continue;

  node.options = node.options.map((option) => {
    const nextId = option?.next;
    const nextNode = nextId ? data[nextId] : null;
    const combinedText = [
      option?.label || "",
      option?.description || "",
      nextId || "",
      nextNode?.title || "",
      nextNode?.description || ""
    ].join(" ");

    const provinciaTag = inferProvinciaFromText(combinedText);
    const gremioTag = inferGremioFromText(combinedText);

    const out = { ...option };
    if (provinciaTag) out.provinciaTag = provinciaTag;
    if (gremioTag) out.gremioTag = gremioTag;
    if (provinciaTag || gremioTag) taggedCount++;

    const isLeafAudioTarget = !!(
      nextId &&
      nextNode &&
      !Array.isArray(nextNode.options) &&
      (nextNode.audio || (Array.isArray(nextNode.audios) && nextNode.audios.length > 0))
    );

    if (isLeafAudioTarget) {
      out.leafTitle = nextNode.title || out.label || "";
      out.leafDescription = nextNode.description || "";
      if (nextNode.audio) out.audio = nextNode.audio;
      if (Array.isArray(nextNode.audios) && nextNode.audios.length > 0) out.audios = nextNode.audios;
      delete out.next;
      removable.add(nextId);
      mergedCount++;
    }

    return out;
  });
}

for (const key of removable) {
  delete data[key];
}

fs.writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, "utf8");

console.log(JSON.stringify({
  mergedCount,
  taggedCount,
  removedNodes: removable.size,
  totalKeys: Object.keys(data).length
}, null, 2));
