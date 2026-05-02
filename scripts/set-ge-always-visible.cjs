const fs = require("fs");

const filePath = "src/data.json";
const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

let updated = 0;

for (const node of Object.values(data)) {
  if (!node || !Array.isArray(node.options)) continue;

  for (const option of node.options) {
    const label = String(option?.label || "");
    if (!/^GE-\d{2}$/.test(label)) continue;

    option.provinciaTag = "all";
    option.gremioTag = "all";
    updated++;
  }
}

fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ updated }, null, 2));
