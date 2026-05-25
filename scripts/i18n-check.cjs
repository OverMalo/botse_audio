#!/usr/bin/env node
/*
 * Prueba de cobertura de i18n.
 *
 * Comprueba que:
 *   1. Todas las claves t("...") usadas en src/main.js existen en cada locale.
 *   2. Todos los locales declarados en src/i18n.js tienen el mismo conjunto de claves
 *      (ningún idioma se queda con textos sin traducir).
 *   3. Cada provincia/gremio conocido tiene su etiqueta traducida.
 *   4. No quedan textos de interfaz "hardcodeados" en src/main.js.
 *   5. La lógica de resolución + interpolación de t() funciona.
 *
 * Uso: node scripts/i18n-check.cjs   (o: npm test)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SRC = path.join(ROOT, "src");

let failures = 0;
const fail = (msg) => { failures++; console.error("  ✗ " + msg); };
const ok = (msg) => console.log("  ✓ " + msg);

function readFile(p) {
  return fs.readFileSync(p, "utf8");
}

// ── Cargar locales declarados en src/i18n.js ────────────────────────────────
const i18nSrc = readFile(path.join(SRC, "i18n.js"));
// Ignoramos comentarios para no contar idiomas de ejemplo (// { code: "en" }).
const i18nNoComments = i18nSrc
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const localeCodes = [...i18nNoComments.matchAll(/code:\s*"([a-z-]+)"/g)].map((m) => m[1]);
if (!localeCodes.length) fail("No se detectó ningún idioma en LANGUAGES (src/i18n.js)");

const locales = {};       // code -> ui.json
const localeRoots = {};   // code -> ruta de la carpeta del idioma
for (const code of localeCodes) {
  const root = path.join(SRC, "i18n", code);
  localeRoots[code] = root;
  const uiFile = path.join(root, "ui.json");
  if (!fs.existsSync(uiFile)) { fail(`Falta src/i18n/${code}/ui.json`); continue; }
  try {
    locales[code] = JSON.parse(readFile(uiFile));
  } catch (e) {
    fail(`JSON inválido en ${code}/ui.json: ${e.message}`);
  }
}
console.log(`\nIdiomas detectados: ${localeCodes.join(", ") || "(ninguno)"}`);

// ── Resolución de claves (misma lógica que t() en i18n.js) ──────────────────
function resolve(messages, key) {
  return key.split(".").reduce((obj, part) => (obj == null ? undefined : obj[part]), messages);
}

// Aplana un objeto de mensajes a su conjunto de rutas-hoja.
function leafKeys(obj, prefix = "") {
  const keys = [];
  for (const [k, v] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...leafKeys(v, full));
    else keys.push(full);
  }
  return keys;
}

// ── 1. Claves t("...") usadas en main.js ────────────────────────────────────
console.log("\n[1] Claves t() usadas en main.js");
const mainSrc = readFile(path.join(SRC, "main.js"));
const usedKeys = [...mainSrc.matchAll(/\bt\(\s*["'`]([^"'`]+)["'`]/g)]
  .map((m) => m[1])
  .filter((k) => !k.includes("${")); // descarta plantillas dinámicas (provincias.${id})
// Claves dinámicas (provincias.<id>, gremios.<id>) construidas con plantillas:
const dynamicPrefixes = [...mainSrc.matchAll(/\bt\(\s*`([a-zA-Z.]+)\.\$\{/g)].map((m) => m[1]);
const uniqueUsed = [...new Set(usedKeys)];
console.log(`    ${uniqueUsed.length} claves estáticas + prefijos dinámicos: ${dynamicPrefixes.join(", ") || "(ninguno)"}`);

const base = locales[localeCodes[0]];
if (base) {
  let missing = 0;
  for (const key of uniqueUsed) {
    if (resolve(base, key) === undefined) { fail(`Clave usada pero ausente en ${localeCodes[0]}.json: "${key}"`); missing++; }
  }
  if (!missing) ok(`Todas las claves t() (${uniqueUsed.length}) existen en ${localeCodes[0]}.json`);
}

// ── 2. Paridad entre idiomas ────────────────────────────────────────────────
console.log("\n[2] Paridad de claves entre idiomas");
if (base) {
  const baseKeys = new Set(leafKeys(base));
  for (const code of localeCodes) {
    if (code === localeCodes[0] || !locales[code]) continue;
    const theseKeys = new Set(leafKeys(locales[code]));
    const missingHere = [...baseKeys].filter((k) => !theseKeys.has(k));
    const extraHere = [...theseKeys].filter((k) => !baseKeys.has(k));
    if (missingHere.length) fail(`${code}.json: faltan ${missingHere.length} claves (${missingHere.slice(0, 5).join(", ")}…)`);
    if (extraHere.length) fail(`${code}.json: tiene ${extraHere.length} claves de más (${extraHere.slice(0, 5).join(", ")}…)`);
    if (!missingHere.length && !extraHere.length) ok(`${code}.json tiene las mismas claves que ${localeCodes[0]}.json`);
  }
  if (localeCodes.length === 1) ok("Solo hay un idioma; nada que comparar (preparado para más).");
}

// ── 3. Provincias y gremios ─────────────────────────────────────────────────
console.log("\n[3] Etiquetas de provincias y gremios");
const PROVINCIAS = ["cienaga_negra", "skyrim", "roca_alta", "morrowind", "cyrodiil"];
const GREMIOS = ["circulo_campeones", "ladrones", "luchadores", "magos", "guardia_exterior", "hermandad_oscura", "intrepidos", "ojos_reina", "orden_psijic"];
if (base) {
  let bad = 0;
  for (const id of PROVINCIAS) if (!resolve(base, `provincias.${id}`)) { fail(`Falta provincias.${id}`); bad++; }
  for (const id of GREMIOS) if (!resolve(base, `gremios.${id}`)) { fail(`Falta gremios.${id}`); bad++; }
  if (!bad) ok(`Las ${PROVINCIAS.length} provincias y ${GREMIOS.length} gremios tienen etiqueta`);
}

// ── 4. Sin textos de interfaz hardcodeados en main.js ───────────────────────
console.log("\n[4] Sin textos hardcodeados en main.js");
// Eliminamos comentarios para no dar falsos positivos.
const noComments = mainSrc
  .replace(/\/\*[\s\S]*?\*\//g, "")
  .replace(/^\s*\/\/.*$/gm, "");
const FORBIDDEN = [
  "ASSET HERE", "La Traición", "Características", "Bienvenida", "Narraciones",
  "Selecciona una provincia", "No hay paneles", "Auto-play", "Audio ambiente",
  "Banda Sonora", "Descargando", "Sin pistas", "Canción anterior", "Canción siguiente",
  "Volumen de la banda", "Barra de progreso", "Falta definir", "Mostrar el texto narrado",
  "Abrir menú lateral", "Cerrar menú lateral",
];
let leftovers = 0;
for (const phrase of FORBIDDEN) {
  if (noComments.includes(phrase)) { fail(`Texto hardcodeado encontrado en main.js: "${phrase}"`); leftovers++; }
}
if (!leftovers) ok("No se han encontrado textos de interfaz hardcodeados");

// ── 5. Lógica de t() (resolución + interpolación) ───────────────────────────
console.log("\n[5] Lógica de resolución/interpolación");
function t(messages, key, params) {
  let msg = resolve(messages, key);
  if (msg === undefined) return key;
  if (typeof msg !== "string") return msg;
  if (!params) return msg;
  return msg.replace(/\{(\w+)\}/g, (m, n) => (Object.prototype.hasOwnProperty.call(params, n) ? String(params[n]) : m));
}
if (base) {
  const interp = t(base, "soundtrackPlayer.downloading", { pct: 42 });
  if (interp.includes("42")) ok(`Interpolación correcta: "${interp}"`);
  else fail(`Interpolación fallida: "${interp}"`);

  const arr = t(base, "welcome.features");
  if (Array.isArray(arr) && arr.length && arr[0].term) ok(`welcome.features devuelve un array (${arr.length} items)`);
  else fail("welcome.features no devuelve un array válido");

  const fallback = t(base, "clave.que.no.existe");
  if (fallback === "clave.que.no.existe") ok("Clave inexistente recae en la propia clave");
  else fail("El fallback de clave inexistente no funciona");
}

// ── 6. Estructura de carpeta por idioma (ui/manifest/soundtrack/data/index) ──
console.log("\n[6] Estructura de carpeta por idioma");
const REQUIRED_DATA = [
  "start.json", "ambient.json", "encuentros_generales.json", "encuentros_provinciales.json",
  "ciudades/_base.json", "ciudades/cienaga_negra.json",
  "misiones/_base.json", "misiones/cienaga_negra.json", "misiones/skyrim.json",
  "misiones/roca_alta.json", "misiones/morrowind.json", "misiones/cyrodiil.json",
  "sesion_final/_base.json", "sesion_final/cienaga_negra.json", "sesion_final/roca_alta.json",
  "sesion_final/skyrim.json", "sesion_final/morrowind.json", "sesion_final/cyrodiil.json",
];
const MANIFEST_FIELDS = ["name", "short_name", "description"];
for (const code of localeCodes) {
  const root = localeRoots[code];
  let bad = 0;
  // index.js
  if (!fs.existsSync(path.join(root, "index.js"))) { fail(`${code}: falta index.js`); bad++; }
  // manifest.json
  const manifestFile = path.join(root, "manifest.json");
  if (!fs.existsSync(manifestFile)) { fail(`${code}: falta manifest.json`); bad++; }
  else {
    try {
      const m = JSON.parse(readFile(manifestFile));
      for (const f of MANIFEST_FIELDS) if (!m[f]) { fail(`${code}/manifest.json: falta "${f}"`); bad++; }
    } catch (e) { fail(`${code}/manifest.json inválido: ${e.message}`); bad++; }
  }
  // soundtrack.json
  const stFile = path.join(root, "soundtrack.json");
  if (!fs.existsSync(stFile)) { fail(`${code}: falta soundtrack.json`); bad++; }
  else {
    try {
      const st = JSON.parse(readFile(stFile));
      if (!Array.isArray(st)) { fail(`${code}/soundtrack.json no es un array`); bad++; }
    } catch (e) { fail(`${code}/soundtrack.json inválido: ${e.message}`); bad++; }
  }
  // data/
  for (const rel of REQUIRED_DATA) {
    const f = path.join(root, "data", rel);
    if (!fs.existsSync(f)) { fail(`${code}: falta data/${rel}`); bad++; }
    else {
      try { JSON.parse(readFile(f)); }
      catch (e) { fail(`${code}/data/${rel} JSON inválido: ${e.message}`); bad++; }
    }
  }
  if (!bad) ok(`${code}: estructura completa (ui, manifest, soundtrack, ${REQUIRED_DATA.length} ficheros de data, index.js)`);
}

// La carpeta de datos antigua (src/data) no debe seguir existiendo.
if (fs.existsSync(path.join(SRC, "data"))) fail("src/data sigue existiendo (debería estar en src/i18n/<code>/data)");
else ok("src/data ya no existe (contenido movido a los idiomas)");

// El monolito legacy src/data.json tampoco debe existir (textos sin traducir fuera de i18n).
if (fs.existsSync(path.join(SRC, "data.json"))) fail("src/data.json sigue existiendo (fichero legacy; el contenido vive en src/i18n/<code>/data)");
else ok("src/data.json ya no existe");

// ── Resultado ───────────────────────────────────────────────────────────────
console.log("");
if (failures) {
  console.error(`✗ i18n-check: ${failures} problema(s) encontrados.\n`);
  process.exit(1);
} else {
  console.log("✓ i18n-check: todas las comprobaciones han pasado.\n");
}
