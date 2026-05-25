// Compone el árbol de contenido (appData) a partir de las piezas de datos de un
// idioma. El orden de las provincias es significativo, por eso la composición es
// explícita y compartida por todos los idiomas (cada idioma aporta sus piezas).
export function composeAppData(p) {
  return {
    ...p.start,
    ciudades: {
      ...p.ciudadesBase,
      options: [...p.ciudadesCN],
    },
    misiones: {
      ...p.misionesBase,
      options: [
        ...p.misionesCN,
        ...p.misionesSkyrim,
        ...p.misionesRA,
        ...p.misionesMW,
        ...p.misionesCY,
      ],
    },
    ...p.encuentrosG,
    ...p.encuentrosP,
    sesion_final: {
      ...p.sesionFinalBase,
      options: [
        ...p.sesionFinalCN,
        ...p.sesionFinalRA,
        ...p.sesionFinalSkyrim,
        ...p.sesionFinalMW,
        ...p.sesionFinalCY,
      ],
    },
    ...p.ambientConfig,
  };
}
