// ── Paquete del idioma: Español (es) ───────────────────────────────────────
// Todo lo específico de este idioma vive en esta carpeta:
//   ui.json         → textos de interfaz
//   manifest.json   → metadatos de la PWA (nombre, descripción…)
//   soundtrack.json → pistas de la banda sonora
//   data/           → contenido narrado (ciudades, misiones, encuentros…)
//
// Para crear un idioma nuevo: copia esta carpeta a src/i18n/<código>/, traduce
// los .json (y, en su caso, apunta los audios a su versión localizada) y
// registra el idioma en src/i18n.js.

import ui from "./ui.json";
import manifest from "./manifest.json";
import soundtrack from "./soundtrack.json";

import start from "./data/start.json";
import ciudadesBase from "./data/ciudades/_base.json";
import ciudadesCN from "./data/ciudades/cienaga_negra.json";
import misionesBase from "./data/misiones/_base.json";
import misionesCN from "./data/misiones/cienaga_negra.json";
import misionesSkyrim from "./data/misiones/skyrim.json";
import misionesRA from "./data/misiones/roca_alta.json";
import misionesMW from "./data/misiones/morrowind.json";
import misionesCY from "./data/misiones/cyrodiil.json";
import encuentrosG from "./data/encuentros_generales.json";
import encuentrosP from "./data/encuentros_provinciales.json";
import sesionFinalBase from "./data/sesion_final/_base.json";
import sesionFinalCN from "./data/sesion_final/cienaga_negra.json";
import sesionFinalRA from "./data/sesion_final/roca_alta.json";
import sesionFinalSkyrim from "./data/sesion_final/skyrim.json";
import sesionFinalMW from "./data/sesion_final/morrowind.json";
import sesionFinalCY from "./data/sesion_final/cyrodiil.json";
import ambientConfig from "./data/ambient.json";

import { composeAppData } from "../compose.js";

export default {
  code: "es",
  ui,
  manifest,
  soundtrack,
  appData: composeAppData({
    start,
    ciudadesBase,
    ciudadesCN,
    misionesBase,
    misionesCN,
    misionesSkyrim,
    misionesRA,
    misionesMW,
    misionesCY,
    encuentrosG,
    encuentrosP,
    sesionFinalBase,
    sesionFinalCN,
    sesionFinalRA,
    sesionFinalSkyrim,
    sesionFinalMW,
    sesionFinalCY,
    ambientConfig,
  }),
};
