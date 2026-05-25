/**
 * Merges all split data files into a single appData object.
 * Used by Node.js scripts in scripts/ that need the full dataset.
 * Usage: const appData = require("../src/data/merge.cjs");
 */
"use strict";

const path = require("path");
const D = (file) => path.join(__dirname, file);

const appData = {
  ...require(D("./start.json")),
  ciudades: {
    ...require(D("./ciudades/_base.json")),
    options: [
      ...require(D("./ciudades/cienaga_negra.json")),
      ...require(D("./ciudades/cyrodiil.json")),
      ...require(D("./ciudades/roca_alta.json")),
      ...require(D("./ciudades/morrowind.json")),
      ...require(D("./ciudades/skyrim.json")),
    ],
  },
  misiones: {
    ...require(D("./misiones/_base.json")),
    options: [
      ...require(D("./misiones/cienaga_negra.json")),
      ...require(D("./misiones/skyrim.json")),
      ...require(D("./misiones/roca_alta.json")),
      ...require(D("./misiones/morrowind.json")),
      ...require(D("./misiones/cyrodiil.json")),
    ],
  },
  ...require(D("./encuentros_generales.json")),
  ...require(D("./encuentros_provinciales.json")),
  sesion_final: {
    ...require(D("./sesion_final/_base.json")),
    options: [
      ...require(D("./sesion_final/cienaga_negra.json")),
      ...require(D("./sesion_final/roca_alta.json")),
      ...require(D("./sesion_final/skyrim.json")),
      ...require(D("./sesion_final/morrowind.json")),
      ...require(D("./sesion_final/cyrodiil.json")),
    ],
  },
  ...require(D("./ambient.json")),
};

module.exports = appData;
