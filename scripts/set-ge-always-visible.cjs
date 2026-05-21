const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "../src/data/encuentros_generales.json");
const wrapper = JSON.parse(fs.readFileSync(filePath, "utf8"));
const data = wrapper.encuentros_generales;

let updated = 0;

if (Array.isArray(data.options)) {
  for (const option of data.options) {
    const label = String(option?.label || "");
    if (!/^GE-\d{2}$/.test(label)) continue;

    option.provinciaTag = "all";
    option.gremioTag = "all";
    updated++;
  }
}

fs.writeFileSync(filePath, `${JSON.stringify(wrapper, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ updated }, null, 2));
