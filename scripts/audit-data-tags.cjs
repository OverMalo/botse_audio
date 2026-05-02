const data = require("../src/data.json");

let leaf = 0;
let withProvincia = 0;
let withGremio = 0;
let unresolvedNext = 0;
const missingRefs = [];

const keys = new Set(Object.keys(data));

for (const [screenId, node] of Object.entries(data)) {
  if (!node || !Array.isArray(node.options)) continue;

  for (const opt of node.options) {
    if (opt.next && !keys.has(opt.next)) {
      missingRefs.push({ screenId, label: opt.label || "", next: opt.next });
    }

    const isLeaf = !!(
      opt.audio ||
      (Array.isArray(opt.audios) && opt.audios.length) ||
      opt.leafDescription ||
      opt.leafTitle ||
      !opt.next
    );

    if (!isLeaf) continue;

    leaf++;
    if (opt.provinciaTag) withProvincia++;
    if (opt.gremioTag) withGremio++;
    if (opt.next) unresolvedNext++;
  }
}

console.log(
  JSON.stringify({
    leaf,
    withProvincia,
    withGremio,
    unresolvedNext,
    missingRefs
  }, null, 2)
);
