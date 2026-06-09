import "./styles.css";
import { t, getLang, setLang, LANGUAGES, getContent } from "./i18n.js";
import SOUNDTRACK from "./i18n/es/soundtrack.json";
import CardScanner, { CROP } from "./card-scanner.js";

// ── Data (split across multiple files for maintainability) ──────────────────
import _start from "./i18n/es/data/start.json";
import _ciudadesBase from "./i18n/es/data/ciudades/_base.json";
import _ciudadesCN from "./i18n/es/data/ciudades/cienaga_negra.json";
import _ciudadesCY from "./i18n/es/data/ciudades/cyrodiil.json";
import _ciudadesRA from "./i18n/es/data/ciudades/roca_alta.json";
import _ciudadesMW from "./i18n/es/data/ciudades/morrowind.json";
import _ciudadesSkyrim from "./i18n/es/data/ciudades/skyrim.json";
import _misionesBase from "./i18n/es/data/misiones/_base.json";
import _misionesCN from "./i18n/es/data/misiones/cienaga_negra.json";
import _misionesSkyrim from "./i18n/es/data/misiones/skyrim.json";
import _misionesRA from "./i18n/es/data/misiones/roca_alta.json";
import _misionesMW from "./i18n/es/data/misiones/morrowind.json";
import _misionesCY from "./i18n/es/data/misiones/cyrodiil.json";
import _encuentrosG from "./i18n/es/data/encuentros_generales.json";
import _encuentrosP from "./i18n/es/data/encuentros_provinciales.json";
import _sesionFinalBase from "./i18n/es/data/sesion_final/_base.json";
import _sesionFinalCN from "./i18n/es/data/sesion_final/cienaga_negra.json";
import _sesionFinalRA from "./i18n/es/data/sesion_final/roca_alta.json";
import _sesionFinalSkyrim from "./i18n/es/data/sesion_final/skyrim.json";
import _sesionFinalMW from "./i18n/es/data/sesion_final/morrowind.json";
import _sesionFinalCY from "./i18n/es/data/sesion_final/cyrodiil.json";
import _ambientConfig from "./i18n/es/data/ambient.json";

const appData = {
  ..._start,
  ciudades: {
    ..._ciudadesBase,
    options: [
      ..._ciudadesCN,
      ..._ciudadesCY,
      ..._ciudadesRA,
      ..._ciudadesMW,
      ..._ciudadesSkyrim,
    ],
  },
  misiones: {
    ..._misionesBase,
    options: [
      ..._misionesCN,
      ..._misionesSkyrim,
      ..._misionesRA,
      ..._misionesMW,
      ..._misionesCY,
    ],
  },
  ..._encuentrosG,
  ..._encuentrosP,
  sesion_final: {
    ..._sesionFinalBase,
    options: [
      ..._sesionFinalCN,
      ..._sesionFinalRA,
      ..._sesionFinalSkyrim,
      ..._sesionFinalMW,
      ..._sesionFinalCY,
    ],
  },
  ..._ambientConfig,
};

const screenEl = document.getElementById("screen");
const sidebarEl = document.getElementById("sidebar");

// Solo los IDs son estables; las etiquetas mostradas se traducen con t() en
// tiempo de render (provincias.<id> / gremios.<id> en los .json de i18n).
const FILTER_OPTIONS = {
  provincias: ["cienaga_negra", "skyrim", "roca_alta", "morrowind", "cyrodiil"],
  gremios: [
    "circulo_campeones",
    "ladrones",
    "luchadores",
    "magos",
    "guardia_exterior",
    "hermandad_oscura",
    "intrepidos",
    "ojos_reina",
    "orden_psijic"
  ]
};

const provinciaLabel = (id) => t(`provincias.${id}`);
const gremioLabel = (id) => t(`gremios.${id}`);

// Imagen de cabecera de la landing. Pon "" para volver al placeholder "ASSET HERE".
const WELCOME_BANNER_SRC = "images/tes_bse_banner_02.jpg";

// Email de contacto que aparece en el pie de la landing.
const CONTACT_EMAIL = "overmalo@gmail.com";

// ── SVG Icons ────────────────────────────────────────────────────────────────
// Inline SVGs en lugar de caracteres Unicode/emoji para renderizado idéntico
// en todos los SO (iOS, Android, desktop). fill="currentColor" hereda el color
// CSS del elemento padre; aria-hidden="true" en cada SVG (los botones ya tienen
// aria-label propio).
const ICONS = {
  // Media controls
  play:          `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 14,8"/></svg>`,
  pause:         `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="1" width="4" height="14"/><rect x="10" y="1" width="4" height="14"/></svg>`,
  prev:          `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="1" y="1" width="3" height="14"/><polygon points="13,1 13,15 4,8"/></svg>`,
  next:          `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="3,1 3,15 12,8"/><rect x="12" y="1" width="3" height="14"/></svg>`,
  musicNote:     `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M5 13V4h8v8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="5" cy="13" r="2.5"/><circle cx="13" cy="12" r="2.5"/></svg>`,
  speaker:       `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="1,5 4.5,5 8,2 8,14 4.5,11 1,11"/><path d="M10 5.5a4.5 4.5 0 0 1 0 5M12 3.5a7 7 0 0 1 0 9" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  // UI controls
  close:         `<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="2" y1="2" x2="14" y2="14"/><line x1="14" y1="2" x2="2" y2="14"/></svg>`,
  caretDown:     `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,4 14,4 8,12"/></svg>`,
  caretUp:       `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="2,12 14,12 8,4"/></svg>`,
  globe:         `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><circle cx="8" cy="8" r="6.5"/><ellipse cx="8" cy="8" rx="3" ry="6.5"/><line x1="1.5" y1="8" x2="14.5" y2="8"/><line x1="2.5" y1="5" x2="13.5" y2="5"/><line x1="2.5" y1="11" x2="13.5" y2="11"/></svg>`,
  // State indicators
  diamondFilled: `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><polygon points="8,1 15,8 8,15 1,8"/></svg>`,
  diamondEmpty:  `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><polygon points="8,1 15,8 8,15 1,8"/></svg>`,
  boxFilled:     `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1"/></svg>`,
  boxEmpty:      `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="2" y="2" width="12" height="12" rx="1"/></svg>`,
  dotFilled:     `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><circle cx="8" cy="8" r="5"/></svg>`,
  dotEmpty:      `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="8" cy="8" r="5"/></svg>`,
  minus:         `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="7" width="12" height="2"/></svg>`,
  plus:          `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><rect x="2" y="7" width="12" height="2"/><rect x="7" y="2" width="2" height="12"/></svg>`,
  chevronRight:  `<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="5,2 11,8 5,14"/></svg>`,
};

function loadState() {
  try {
    // One-time migration: move existing sessionStorage data to localStorage
    const legacy = sessionStorage.getItem("navState");
    if (legacy && !localStorage.getItem("navState")) {
      localStorage.setItem("navState", legacy);
    }
    if (legacy) sessionStorage.removeItem("navState");

    const saved = localStorage.getItem("navState");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    selectedProvincia: "",
    selectedGremio: "",
    revealedDescriptions: [],
    autoPlay: true,
    recognizerConfirmCard: false,
    playbackRate: 1,
    stEnabled: false,
    provinciaCollapsed: false,
    gremioCollapsed: false,
    narrationsCollapsed: false,
    bandaCollapsed: false
  };
}

function saveState() {
  localStorage.setItem(
    "navState",
    JSON.stringify({
      view,
      selectedProvincia,
      selectedGremio,
      expandedPanels: [...expandedPanels],
      revealedDescriptions: [...revealedDescriptions],
      autoPlay,
      recognizerConfirmCard,
      playbackRate,
      stEnabled,
      provinciaCollapsed,
      gremioCollapsed,
      narrationsCollapsed,
      bandaCollapsed,
      stVolume,
      stCurrentTrack,
      stCurrentTime: stAudio?.currentTime ?? 0
    })
  );
}

const state = loadState();
let selectedProvincia = typeof state.selectedProvincia === "string" ? state.selectedProvincia : "";
let selectedGremio = typeof state.selectedGremio === "string" ? state.selectedGremio : "";
let expandedPanels = new Set(Array.isArray(state.expandedPanels) ? state.expandedPanels : []);
let revealedDescriptions = new Set(Array.isArray(state.revealedDescriptions) ? state.revealedDescriptions : []);
let autoPlay = typeof state.autoPlay === "boolean" ? state.autoPlay : true;
let recognizerConfirmCard = typeof state.recognizerConfirmCard === "boolean" ? state.recognizerConfirmCard : false;
let playbackRate = [1, 1.15, 1.25, 1.5].includes(state.playbackRate) ? state.playbackRate : 1;
let stEnabled = typeof (state.stEnabled ?? state.ytEnabled) === "boolean" ? (state.stEnabled ?? state.ytEnabled) : false;

// Vista activa: "inicio" (bienvenida) o "narraciones"
let view = state.view === "narraciones" ? "narraciones" : "inicio";

let provinciaCollapsed = typeof state.provinciaCollapsed === "boolean" ? state.provinciaCollapsed : false;
let gremioCollapsed = typeof state.gremioCollapsed === "boolean" ? state.gremioCollapsed : false;
let narrationsCollapsed = typeof state.narrationsCollapsed === "boolean" ? state.narrationsCollapsed : false;
let bandaCollapsed = typeof state.bandaCollapsed === "boolean" ? state.bandaCollapsed : false;

/** @type {null | { rafId: number, panelEl: HTMLAudioElement, ambientEl: HTMLAudioElement|null, hasAmbient: boolean, totalDuration: number, playerEl: HTMLElement, isSeeking: boolean }} */
let activePlayer = null;

let contentTree = buildTreeFromStart();
let accordionIndex = buildAccordionIndex(contentTree);

/** Map<cardLabel, nodeId> — sólo hojas con labels tipo XX-NN */
const CARD_LABEL_RE = /^[A-Z]{2}-\d{2}$/;
let cardLabelMap = buildCardLabelMap();
let cardSearchQuery = "";
let preSearchExpandedPanels = null;

function normalizeCardSearchInput(value) {
  return (value ?? "").toString().trim().replace(/\s+/g, " ");
}

function stripDiacritics(value) {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function normalizeSearchText(value) {
  return stripDiacritics(value)
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toLooseSearchKey(value) {
  return normalizeSearchText(value).replace(/[^a-z0-9]+/g, "");
}

function beginCardSearchSession() {
  if (preSearchExpandedPanels) return;
  preSearchExpandedPanels = new Set(expandedPanels);
}

function endCardSearchSession() {
  if (!preSearchExpandedPanels) return;
  expandedPanels = new Set(preSearchExpandedPanels);
  preSearchExpandedPanels = null;
}

function applyCardSearchQuery(nextValue) {
  const nextQuery = normalizeCardSearchInput(nextValue);
  if (nextQuery === cardSearchQuery) return false;

  const hadQuery = Boolean(cardSearchQuery);
  const hasQuery = Boolean(nextQuery);

  if (!hadQuery && hasQuery) beginCardSearchSession();
  if (hadQuery && !hasQuery) {
    endCardSearchSession();
    saveState();
  }

  cardSearchQuery = nextQuery;
  return true;
}

function resetCardSearch() {
  applyCardSearchQuery("");
  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput) cardSearchInput.value = "";
}

function syncTopbarSearchAvailability() {
  const enabled = Boolean(selectedProvincia);
  const topbarProvinceHint = document.getElementById("topbar-province-hint");
  if (topbarProvinceHint) {
    topbarProvinceHint.hidden = enabled;
  }

  const cardSearchWrap = document.querySelector(".card-search");
  if (cardSearchWrap) cardSearchWrap.hidden = !enabled;

  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput) {
    cardSearchInput.disabled = !enabled;
    cardSearchInput.setAttribute("aria-disabled", enabled ? "false" : "true");
    cardSearchInput.setAttribute("title", enabled ? "" : t("search.disabledHint"));
    if (!enabled) cardSearchInput.value = "";
  }

  const scannerBtn = document.getElementById("scanner-btn");
  if (scannerBtn) {
    scannerBtn.hidden = !enabled;
    scannerBtn.disabled = !enabled;
    scannerBtn.setAttribute("aria-disabled", enabled ? "false" : "true");
    scannerBtn.setAttribute("title", enabled ? "" : t("scanner.disabledHint"));
  }
}

function goToInicio() {
  view = "inicio";
  selectedProvincia = "";
  selectedGremio = "";
  resetCardSearch();
  stopActivePlayer();
  closeScanner();
  saveState();
  render();
}

function getNodeCardLabel(node) {
  const rawLabel = typeof node?.title === "string" ? node.title.trim().toUpperCase() : "";
  return CARD_LABEL_RE.test(rawLabel) ? rawLabel : "";
}

function nodeMatchesSearch(node, queryRaw) {
  if (!queryRaw) return true;

  const textQuery = normalizeSearchText(queryRaw);
  const looseQuery = toLooseSearchKey(queryRaw);
  const textHaystack = normalizeSearchText([
    node?.title,
    node?.summary,
    node?.contentTitle,
  ].filter(Boolean).join(" "));

  if (textQuery && textHaystack.includes(textQuery)) {
    return true;
  }

  if (!looseQuery) {
    return false;
  }

  const labelLoose = toLooseSearchKey(getNodeCardLabel(node));
  if (labelLoose && labelLoose.includes(looseQuery)) {
    return true;
  }

  const looseHaystack = toLooseSearchKey([
    node?.title,
    node?.summary,
    node?.contentTitle,
  ].filter(Boolean).join(" "));

  return looseHaystack.includes(looseQuery);
}

function buildCardLabelMap() {
  const map = new Map();
  function walk(nodes) {
    for (const node of nodes) {
      if (node.type === "leaf") {
        const label = getNodeCardLabel(node);
        if (label) map.set(label, node.id);
      }
      if (node.children?.length) walk(node.children);
    }
  }
  walk(contentTree);
  return map;
}

let swRegistration = null;

registerServiceWorker();

// ── Sidebar toggle (mobile) ──────────────────────────────────────────────
const sidebarToggleEl = document.getElementById("sidebar-toggle");

function setSidebarOpen(open) {
  sidebarEl.classList.toggle("sidebar--open", open);
  document.getElementById("sidebar-overlay").classList.toggle("sidebar-overlay--visible", open);
  sidebarToggleEl?.setAttribute("aria-expanded", open ? "true" : "false");
  sidebarToggleEl?.setAttribute("aria-label", open ? t("a11y.closeSidebar") : t("a11y.openSidebar"));
}

sidebarToggleEl?.addEventListener("click", () => {
  const willOpen = !sidebarEl.classList.contains("sidebar--open");
  setSidebarOpen(willOpen);
  // Move focus into the sidebar when opening for keyboard users
  if (willOpen) sidebarEl.querySelector(".sidebar-nav-item")?.focus();
});
document.getElementById("sidebar-overlay")?.addEventListener("click", () => setSidebarOpen(false));

// Close the mobile sidebar with Escape and return focus to the toggle
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && sidebarEl.classList.contains("sidebar--open")) {
    setSidebarOpen(false);
    sidebarToggleEl?.focus();
  }
});

// ── Soundtrack ────────────────────────────────────────────

const ST_CACHE_NAME = "botse-soundtrack-v2";
// IDs de pistas ya descargadas (persistido en localStorage para evitar cache.open en cada arranque)
const stCachedIds = new Set(JSON.parse(localStorage.getItem("stCachedIds") || "[]"));

/** @type {HTMLAudioElement | null} */
let stAudio = null;
/** @type {AudioContext | null} */
let stAudioCtx = null;
/** @type {GainNode | null} */
let stGainNode = null;
let stCurrentTrack = (typeof state.stCurrentTrack === "number" && state.stCurrentTrack >= 0 && state.stCurrentTrack < SOUNDTRACK.length) ? state.stCurrentTrack : 0;
let stVolume = (typeof state.stVolume === "number" && state.stVolume >= 0 && state.stVolume <= 100) ? state.stVolume : 100;
let stRestoreTime = (typeof state.stCurrentTime === "number" && state.stCurrentTime > 0) ? state.stCurrentTime : 0;
let stSaveTickCount = 0;
let stIsDucked = false;
let stPollId = null;
let stIsSeeking = false;
let stIsDownloading = false;
/** @type {Promise<void> | null} */
let stDownloadPromise = null;
const stObjectUrls = {}; // index → objectURL (para revocar al cambiar pista)

function stTrackUrl(index) {
  const src = SOUNDTRACK[index]?.src ?? "";
  if (/^https?:\/\//.test(src)) {
    // En desarrollo, redirigir a través del proxy de Vite para evitar CORS con R2
    if (import.meta.env.DEV) {
      const pathname = new URL(src).pathname;
      return `/r2-dev${pathname}`;
    }
    return src;
  }
  return `${import.meta.env.BASE_URL}${src}`;
}

function setupSTPlayer() {
  if (stAudio) return;
  if (!SOUNDTRACK.length) return;
  stAudio = new Audio();
  stAudio.preload = "metadata";
  try {
    stAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    stGainNode = stAudioCtx.createGain();
    stAudioCtx.createMediaElementSource(stAudio).connect(stGainNode);
    stGainNode.connect(stAudioCtx.destination);
    stGainNode.gain.value = stVolume / 100;
  } catch (_) {
    stAudio.volume = stVolume / 100;
  }
  stAudio.addEventListener("ended", () => {
    stCurrentTrack = (stCurrentTrack + 1) % SOUNDTRACK.length;
    loadSTTrack(stCurrentTrack).then(() => {
      stAudio.play().catch(() => {});
    });
    updateSTUI();
    saveState();
    updateSTMediaSession(true);
  });
  stAudio.addEventListener("pause", saveState);
}

async function loadSTTrack(index) {
  if (!stAudio || !SOUNDTRACK[index]) return;
  const url = stTrackUrl(index);

  // Revocar objectURL anterior de este slot
  if (stObjectUrls[index]) {
    URL.revokeObjectURL(stObjectUrls[index]);
    delete stObjectUrls[index];
  }

  if (typeof caches !== "undefined") {
    try {
      const cache = await caches.open(ST_CACHE_NAME);
      const cached = await cache.match(url);
      if (cached) {
        const blob = await cached.blob();
        const objectUrl = URL.createObjectURL(blob);
        stObjectUrls[index] = objectUrl;
        stAudio.src = objectUrl;
        stAudio.load();
        return;
      }
    } catch (_) {}
  }

  if (import.meta.env.DEV) {
    console.warn("[ST] cache miss, cargando directo desde red:", url);
  }
  stAudio.src = url;
  stAudio.load();
}

function updateSTDownloadUI(progress) {
  const bar = document.getElementById("st-download-bar");
  const text = document.getElementById("st-download-text");
  const fill = document.getElementById("st-download-fill");
  if (!bar) return;
  if (progress < 0) {
    bar.style.display = "none";
    return;
  }
  bar.style.display = "";
  const pct = Math.round(progress * 100);
  if (text) text.textContent = t("soundtrackPlayer.downloading", { pct });
  if (fill) fill.style.width = `${pct}%`;
}

async function downloadSTIfNeeded() {
  if (!SOUNDTRACK.length || stIsDownloading) return stDownloadPromise;

  if (typeof caches === "undefined") return;
  const cache = await caches.open(ST_CACHE_NAME);

  // Fast path: si localStorage dice que todo está cacheado, verificar al menos que
  // la primera pista existe en la Cache API real (detecta borrado externo de caché).
  const allInLS = SOUNDTRACK.every((t) => stCachedIds.has(t.id));
  if (allInLS) {
    const firstCached = await cache.match(stTrackUrl(0));
    if (firstCached) return; // caché real intacta
    // Caché fue borrada externamente → limpiar localStorage y re-descargar todo
    stCachedIds.clear();
    localStorage.removeItem("stCachedIds");
  }

  const toDownload = [];
  for (let i = 0; i < SOUNDTRACK.length; i++) {
    const cached = await cache.match(stTrackUrl(i));
    if (!cached) toDownload.push(i);
  }
  if (!toDownload.length) return;

  stIsDownloading = true;
  stDownloadPromise = (async () => {
  updateSTDownloadUI(0);

  // Solicitar almacenamiento persistente para que el navegador no evicte la caché
  if (navigator.storage?.persist) {
    navigator.storage.persist().catch(() => {});
  }

  for (let di = 0; di < toDownload.length; di++) {
    const trackIndex = toDownload[di];
    const url = stTrackUrl(trackIndex);
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const contentLength = parseInt(response.headers.get("Content-Length") || "0", 10);
      const reader = response.body.getReader();
      const chunks = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        received += value.length;
        const fileProgress = contentLength > 0 ? received / contentLength : 0;
        updateSTDownloadUI((di + fileProgress) / toDownload.length);
      }

      const blob = new Blob(chunks, { type: "audio/mpeg" });
      await cache.put(url, new Response(blob, {
        headers: { "Content-Type": "audio/mpeg", "Content-Length": String(blob.size) }
      }));

      // Marcar como descargado en localStorage
      stCachedIds.add(SOUNDTRACK[trackIndex].id);
      localStorage.setItem("stCachedIds", JSON.stringify([...stCachedIds]));

      // Si era la pista en reproducción, recargarla desde caché sin interrumpir
      if (trackIndex === stCurrentTrack && stAudio) {
        const wasPlaying = !stAudio.paused;
        const savedTime = stAudio.currentTime;
        await loadSTTrack(trackIndex);
        stAudio.currentTime = savedTime;
        if (wasPlaying) stAudio.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Soundtrack download failed:", url, err);
    }
  }

  stIsDownloading = false;
  updateSTDownloadUI(-1);
  })();
  return stDownloadPromise;
}

function setSTGain(value) {
  if (stGainNode) stGainNode.gain.value = value;
  else if (stAudio) stAudio.volume = value;
}

function getSTGain() {
  if (stGainNode) return stGainNode.gain.value;
  if (stAudio) return stAudio.volume;
  return stVolume / 100;
}

function duckST() {
  if (stEnabled && stAudio) {
    stIsDucked = true;
    setSTGain(Math.min(stVolume, 20) / 100);
  }
}

function duckSTFade(onDone) {
  const targetVol = Math.min(stVolume, 20) / 100;
  if (!stEnabled || !stAudio || stAudio.paused) {
    onDone();
    return;
  }
  stIsDucked = true;
  if (getSTGain() <= targetVol) {
    setSTGain(targetVol);
    setTimeout(onDone, 300);
    return;
  }
  const startVol = getSTGain();
  const startTime = performance.now();
  const FADE_MS = 500;
  function step() {
    const t = Math.min((performance.now() - startTime) / FADE_MS, 1);
    setSTGain(startVol + (targetVol - startVol) * t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      onDone();
    }
  }
  requestAnimationFrame(step);
}

function restoreST() {
  if (stEnabled && stAudio) {
    stIsDucked = false;
    setSTGain(stVolume / 100);
    if (!stAudio.paused) updateSTMediaSession(true);
  }
}

function restoreSTFade() {
  stIsDucked = false;
  if (!stEnabled || !stAudio || stAudio.paused) return;
  const targetVol = stVolume / 100;
  if (getSTGain() >= targetVol) {
    setSTGain(targetVol);
    updateSTMediaSession(true);
    return;
  }
  const startVol = getSTGain();
  const startTime = performance.now();
  const FADE_MS = 800;
  function step() {
    const t = Math.min((performance.now() - startTime) / FADE_MS, 1);
    setSTGain(startVol + (targetVol - startVol) * t);
    if (t < 1) {
      requestAnimationFrame(step);
    } else {
      setSTGain(targetVol);
      if (!stAudio.paused) updateSTMediaSession(true);
    }
  }
  requestAnimationFrame(step);
}

function updateSTUI() {
  const titleEl = document.getElementById("st-track-title");
  const playBtn = document.querySelector("[data-st-playpause]");
  const engaged = stEnabled && stAudio;
  const isPlaying = engaged ? !stAudio.paused : false;
  if (titleEl) {
    titleEl.textContent = engaged
      ? (SOUNDTRACK[stCurrentTrack]?.title ?? "")
      : t("soundtrackPlayer.idle");
  }
  if (playBtn) playBtn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  musicBarEl?.classList.toggle("music-bar--playing", isPlaying);
  if (engaged && !stAudio.paused) startSTPoll(); else stopSTPoll();
  tickSTProgress();
}

function startSTPoll() {
  if (stPollId) return;
  stPollId = setInterval(() => {
    if (!stAudio || stAudio.paused) { stopSTPoll(); return; }
    tickSTProgress();
    if (++stSaveTickCount >= 20) { stSaveTickCount = 0; saveState(); }
  }, 500);
}

function stopSTPoll() {
  if (stPollId) { clearInterval(stPollId); stPollId = null; }
  stSaveTickCount = 0;
}

function tickSTProgress() {
  if (stIsSeeking || !stAudio) return;
  const current = stAudio.currentTime;
  const duration = stAudio.duration;
  const seekbar = document.getElementById("st-seekbar");
  const currentEl = document.getElementById("st-current-time");
  const totalEl = document.getElementById("st-total-time");
  if (seekbar && isFinite(duration) && duration > 0) seekbar.value = Math.round((current / duration) * 1000);
  if (currentEl) currentEl.textContent = formatTimeLong(current);
  if (totalEl) totalEl.textContent = isFinite(duration) && duration > 0 ? formatTimeLong(duration) : "-:--";
}

// Barra de música de ambiente, persistente en la zona superior (independiente de
// la sección). Mantiene los mismos IDs que usa la lógica de audio (updateSTUI,
// tickSTProgress, updateSTDownloadUI…). Se renderiza y enlaza UNA sola vez.
function renderMusicBar() {
  if (!musicBarEl) return;
  const engaged = stEnabled && stAudio;
  const isPlaying = engaged ? !stAudio.paused : false;
  const title = engaged
    ? (SOUNDTRACK[stCurrentTrack]?.title ?? t("soundtrackPlayer.fallbackTitle"))
    : t("soundtrackPlayer.idle");

  musicBarEl.className = `music-bar${isPlaying ? " music-bar--playing" : ""}`;
  musicBarEl.innerHTML = `
    <div class="mb-inner" role="group" aria-label="${escapeAttribute(t("soundtrackPlayer.barLabel"))}">
      <span class="mb-icon" aria-hidden="true">${ICONS.musicNote}</span>
      <div class="mb-controls">
        <button type="button" class="mb-btn" data-st-prev aria-label="${escapeAttribute(t("soundtrackPlayer.prev"))}">${ICONS.prev}</button>
        <button type="button" class="mb-btn mb-btn--play" data-st-playpause aria-label="${escapeAttribute(t("soundtrackPlayer.playPause"))}">${isPlaying ? ICONS.pause : ICONS.play}</button>
        <button type="button" class="mb-btn" data-st-next aria-label="${escapeAttribute(t("soundtrackPlayer.next"))}">${ICONS.next}</button>
      </div>
      <span class="mb-title" id="st-track-title">${escapeHtml(title)}</span>
      <div class="mb-progress">
        <span class="mb-time" id="st-current-time">0:00</span>
        <input type="range" class="mb-seekbar" id="st-seekbar" min="0" max="1000" value="0" step="1" aria-label="${escapeAttribute(t("soundtrackPlayer.seek"))}">
        <span class="mb-time" id="st-total-time">-:--</span>
      </div>
      <div class="mb-volume">
        <span class="mb-vol-icon" aria-hidden="true">${ICONS.speaker}</span>
        <input type="range" class="mb-volume-slider" id="st-volume" min="0" max="100" value="${stVolume}" step="1" aria-label="${escapeAttribute(t("soundtrackPlayer.volume"))}">
      </div>
      <div id="st-download-bar" class="mb-download" style="display:none" role="status" aria-live="polite">
        <span id="st-download-text"></span>
        <div class="st-download-progress"><div class="st-download-progress-fill" id="st-download-fill" style="width:0%"></div></div>
      </div>
    </div>
  `;
}

// Arranca la música por primera vez (al pulsar play sin estar enganchada).
function engageMusic() {
  stEnabled = true;
  setupSTPlayer();
  loadSTTrack(stCurrentTrack).then(() => {
    stAudioCtx?.resume();
    stAudio?.play().catch(() => {});
    updateSTMediaSession(true);
    updateSTUI();
  });
  downloadSTIfNeeded();
  stopActivePlayer();
  renderMusicBar();
  saveState();
  render(); // refresca el sidebar (el ajuste de audio ambiente puede haber cambiado)
  setTimeout(updateSTUI, 200);
}

function stPlayPause() {
  if (!stEnabled || !stAudio) { engageMusic(); return; }
  if (stAudio.paused) {
    stAudioCtx?.resume();
    stAudio.play().catch(() => {});
    updateSTMediaSession(true);
  } else {
    stAudio.pause();
    updateSTMediaSession(false);
  }
  updateSTUI();
}

function stPrev() {
  if (!stAudio || !SOUNDTRACK.length) return;
  const wasPlaying = !stAudio.paused;
  if (stAudio.currentTime > 3) {
    stAudio.currentTime = 0;
    updateSTUI();
    if (wasPlaying) updateSTMediaSession(true);
  } else {
    stCurrentTrack = (stCurrentTrack - 1 + SOUNDTRACK.length) % SOUNDTRACK.length;
    loadSTTrack(stCurrentTrack).then(() => {
      if (wasPlaying) stAudio.play().catch(() => {});
      updateSTUI();
      saveState();
      if (wasPlaying) updateSTMediaSession(true);
    });
  }
}

function stNext() {
  if (!stAudio || !SOUNDTRACK.length) return;
  const wasPlaying = !stAudio.paused;
  stCurrentTrack = (stCurrentTrack + 1) % SOUNDTRACK.length;
  loadSTTrack(stCurrentTrack).then(() => {
    if (wasPlaying) stAudio.play().catch(() => {});
    updateSTUI();
    saveState();
    if (wasPlaying) updateSTMediaSession(true);
  });
}

// Eventos de la barra de música. Delegación sobre el contenedor persistente:
// así renderMusicBar() puede reescribir su contenido sin perder los listeners.
function bindMusicBarEvents() {
  if (!musicBarEl || musicBarEl.dataset.bound === "true") return;
  musicBarEl.dataset.bound = "true";

  musicBarEl.addEventListener("click", (event) => {
    if (event.target.closest("[data-st-playpause]")) stPlayPause();
    else if (event.target.closest("[data-st-prev]")) stPrev();
    else if (event.target.closest("[data-st-next]")) stNext();
  });

  const startSeek = (event) => { if (event.target.id === "st-seekbar") stIsSeeking = true; };
  musicBarEl.addEventListener("mousedown", startSeek);
  musicBarEl.addEventListener("touchstart", startSeek, { passive: true });

  musicBarEl.addEventListener("change", (event) => {
    if (event.target.id !== "st-seekbar") return;
    stIsSeeking = false;
    if (!stAudio) return;
    const duration = stAudio.duration;
    if (isFinite(duration) && duration > 0) {
      stAudio.currentTime = (parseInt(event.target.value, 10) / 1000) * duration;
      tickSTProgress();
    }
  });

  musicBarEl.addEventListener("input", (event) => {
    if (event.target.id !== "st-volume") return;
    stVolume = parseInt(event.target.value, 10);
    setSTGain((stIsDucked ? Math.min(stVolume, 30) : stVolume) / 100);
    saveState();
  });
}

function updateSTMediaSession(playing) {
  if (!("mediaSession" in navigator) || !SOUNDTRACK.length) return;
  const base = import.meta.env.BASE_URL;
  if (playing) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: SOUNDTRACK[stCurrentTrack]?.title ?? t("soundtrackPlayer.fallbackTitle"),
      artist: t("app.mediaArtist"),
      artwork: [
        { src: `${base}icons/icon-192.png`, sizes: "192x192", type: "image/png" },
        { src: `${base}icons/icon-512.png`, sizes: "512x512", type: "image/png" },
      ]
    });
    navigator.mediaSession.setActionHandler("play", () => {
      stAudio?.play().catch(() => {});
      updateSTUI();
      updateSTMediaSession(true);
    });
    navigator.mediaSession.setActionHandler("pause", () => {
      stAudio?.pause();
      stopSTPoll();
      updateSTUI();
      navigator.mediaSession.playbackState = "paused";
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => {
      if (!stAudio) return;
      const wasPlaying = !stAudio.paused;
      if (stAudio.currentTime > 3) {
        stAudio.currentTime = 0;
        updateSTUI();
        updateSTMediaSession(true);
      } else {
        stCurrentTrack = (stCurrentTrack - 1 + SOUNDTRACK.length) % SOUNDTRACK.length;
        loadSTTrack(stCurrentTrack).then(() => {
          if (wasPlaying) stAudio.play().catch(() => {});
          updateSTUI();
          updateSTMediaSession(true);
        });
      }
    });
    navigator.mediaSession.setActionHandler("nexttrack", () => {
      if (!stAudio) return;
      const wasPlaying = !stAudio.paused;
      stCurrentTrack = (stCurrentTrack + 1) % SOUNDTRACK.length;
      loadSTTrack(stCurrentTrack).then(() => {
        if (wasPlaying) stAudio.play().catch(() => {});
        updateSTUI();
        updateSTMediaSession(true);
      });
    });
  }
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}

// Barra de música de ambiente (persistente en la zona superior).
const musicBarEl = document.getElementById("music-bar");

// ── Language switcher ─────────────────────────────────────────────────────
const langSwitcherEl = document.getElementById("lang-switcher");
let langMenuOpen = false;

function renderLangSwitcher() {
  if (!langSwitcherEl) return;
  const current = getLang();
  const currentLangObj = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];
  const options = LANGUAGES.map((l) => {
    const isCurrent = l.code === current;
    return `<button type="button" class="lang-option" role="menuitemradio" aria-checked="${isCurrent ? "true" : "false"}" data-lang-code="${escapeAttribute(l.code)}"><span class="lang-option-mark" aria-hidden="true">${isCurrent ? ICONS.diamondFilled : ICONS.diamondEmpty}</span><span>${escapeHtml(l.name)} (${escapeHtml(l.label)})</span></button>`;
  }).join("");

  const btnLabel = `${t("langSwitcher.label")}. ${t("langSwitcher.current", { name: currentLangObj.name })}`;

  langSwitcherEl.innerHTML = `
    <button type="button" class="lang-btn" id="lang-btn" aria-haspopup="menu" aria-expanded="${langMenuOpen ? "true" : "false"}" aria-label="${escapeAttribute(btnLabel)}">
      <span class="lang-globe" aria-hidden="true">${ICONS.globe}</span>
      <span class="lang-current">${escapeHtml(currentLangObj.label)}</span>
      <span class="lang-caret" aria-hidden="true">${ICONS.caretDown}</span>
    </button>
    <div class="lang-menu" id="lang-menu" role="menu" aria-label="${escapeAttribute(t("langSwitcher.menuLabel"))}"${langMenuOpen ? "" : " hidden"}>
      ${options}
    </div>
  `;
  bindLangSwitcherEvents();
}

function bindLangSwitcherEvents() {
  const btn = document.getElementById("lang-btn");
  const menu = document.getElementById("lang-menu");
  if (!btn || !menu) return;

  btn.addEventListener("click", (event) => {
    event.stopPropagation();
    langMenuOpen = !langMenuOpen;
    menu.hidden = !langMenuOpen;
    btn.setAttribute("aria-expanded", langMenuOpen ? "true" : "false");
    if (langMenuOpen) menu.querySelector(".lang-option")?.focus();
  });

  menu.querySelectorAll("[data-lang-code]").forEach((opt) => {
    opt.addEventListener("click", () => {
      const code = opt.dataset.langCode;
      langMenuOpen = false;
      const changed = code !== getLang() && setLang(code);
      if (changed) {
        stopActivePlayer();
        reloadContent();
        applyStaticI18n();
        render();
      }
      renderLangSwitcher();
      document.getElementById("lang-btn")?.focus();
    });
  });
}

function closeLangMenu() {
  if (!langMenuOpen) return;
  langMenuOpen = false;
  document.getElementById("lang-menu")?.setAttribute("hidden", "");
  document.getElementById("lang-btn")?.setAttribute("aria-expanded", "false");
}

document.addEventListener("click", (event) => {
  if (langMenuOpen && langSwitcherEl && !langSwitcherEl.contains(event.target)) closeLangMenu();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && langMenuOpen) {
    closeLangMenu();
    document.getElementById("lang-btn")?.focus();
  }
});

// Recarga el contenido (datos + banda sonora) y reconstruye el árbol al cambiar
// de idioma. Los ids del árbol son estructurales (no dependen del texto), así que
// los paneles abiertos siguen siendo válidos.
function reloadContent() {
  contentTree = buildTreeFromStart();
  accordionIndex = buildAccordionIndex(contentTree);
  cardLabelMap = buildCardLabelMap();
  if (stCurrentTrack >= SOUNDTRACK.length) stCurrentTrack = 0;
}

// Localiza el manifest de la PWA. El idioma por defecto usa el fichero estático
// (instalable); para otros idiomas se genera uno al vuelo desde su manifest.json.
const DEFAULT_MANIFEST_LANG = LANGUAGES[0]?.code || "es";
function applyManifest() {
  const link = document.querySelector('link[rel="manifest"]');
  if (!link) return;
  if (getLang() === DEFAULT_MANIFEST_LANG) {
    if (link.dataset.objUrl) {
      URL.revokeObjectURL(link.dataset.objUrl);
      delete link.dataset.objUrl;
    }
    link.href = `${import.meta.env.BASE_URL}manifest.webmanifest`;
    return;
  }
  try {
    const blob = new Blob([JSON.stringify(getContent().manifest)], { type: "application/manifest+json" });
    if (link.dataset.objUrl) URL.revokeObjectURL(link.dataset.objUrl);
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.dataset.objUrl = url;
  } catch {}
}

// Applies translations to document-level / static chrome that lives outside render().
function applyStaticI18n() {
  document.documentElement.lang = getLang();
  document.title = t("app.title");
  document.querySelector('meta[name="description"]')?.setAttribute("content", t("app.metaDescription"));
  const skip = document.querySelector(".skip-link");
  if (skip) skip.textContent = t("app.skipLink");
  const topbarProvinceHint = document.getElementById("topbar-province-hint");
  if (topbarProvinceHint) topbarProvinceHint.textContent = t("topbar.selectProvinceHint");
  sidebarToggleEl?.setAttribute(
    "aria-label",
    sidebarEl.classList.contains("sidebar--open") ? t("a11y.closeSidebar") : t("a11y.openSidebar")
  );
  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput) {
    cardSearchInput.placeholder = t("search.placeholder");
    cardSearchInput.setAttribute("aria-label", t("search.ariaLabel"));
  }
  const scannerBtn = document.getElementById("scanner-btn");
  if (scannerBtn) {
    scannerBtn.setAttribute("aria-label", t("scanner.ariaLabel"));
  }
  applyStaticI18nScanner();
  applyManifest();
}

function applyStaticI18nScanner() {
  const okLabel = document.getElementById("scanner-action-ok-label");
  if (okLabel) okLabel.textContent = t("scanner.actionOk");
  const retryLabel = document.getElementById("scanner-action-retry-label");
  if (retryLabel) retryLabel.textContent = t("scanner.actionRetry");
  
  const okBtn = document.getElementById("scanner-confirm-ok");
  if (okBtn) okBtn.setAttribute("aria-label", t("scanner.actionOk"));
  const retryBtn = document.getElementById("scanner-retry");
  if (retryBtn) retryBtn.setAttribute("aria-label", t("scanner.actionRetry"));
}

applyStaticI18n();
renderLangSwitcher();
renderMusicBar();
bindMusicBarEvents();
render();

// ── Scanner de cartas ────────────────────────────────────────────────────────
const ANALYZE_URL = import.meta.env.VITE_ANALYZE_URL ?? "http://localhost:3000/analyze";

/**
 * Envía el blob de imagen al servidor de análisis y devuelve el identificador
 * de carta (e.g. "GE-01") o null si no se reconoció o hubo error.
 * @param {Blob} blob
 * @returns {Promise<string | null>}
 */
async function recognizeWithAPI(blob) {
  try {
    const form = new FormData();
    form.append("image", blob, "card.jpg");
    const res = await fetch(ANALYZE_URL, { method: "POST", body: form });
    if (res.ok) {
      const { identifier } = await res.json();
      return identifier ?? null;
    }
    const { error } = await res.json().catch(() => ({}));
    console.warn("[scanner] API error", res.status, error);
    return null;
  } catch (err) {
    console.error("[scanner] fetch failed", err);
    return null;
  }
}
let scannerStream = null;
let lastGuideRect = null;
let scannerPendingCardId = "";
let scannerPendingNodeId = "";

const scannerOverlayEl = document.getElementById("scanner-overlay");
const scannerBtnEl = document.getElementById("scanner-btn");
const scannerVideoEl = document.getElementById("scanner-video");
const scannerGuideEl = document.getElementById("scanner-guide");
const scannerStatusEl = document.getElementById("scanner-status");
const scannerPreviewEl = document.getElementById("scanner-preview");
const scannerCaptureBtnEl = document.getElementById("scanner-capture");
const scannerResultActionsEl = document.getElementById("scanner-result-actions");
const scannerConfirmOkEl = document.getElementById("scanner-confirm-ok");
const scannerRetryEl = document.getElementById("scanner-retry");

function setScannerStatus(msg, modifier = "") {
  if (!scannerStatusEl) return;
  scannerStatusEl.textContent = msg;
  scannerStatusEl.className = "scanner-status" + (modifier ? " scanner-status--" + modifier : "");
}

function showScannerActionMode(mode = "capture") {
  if (scannerCaptureBtnEl) scannerCaptureBtnEl.hidden = mode !== "capture";
  if (scannerResultActionsEl) scannerResultActionsEl.hidden = !(mode === "confirm" || mode === "retry");
  if (scannerConfirmOkEl) scannerConfirmOkEl.hidden = mode !== "confirm";
  if (scannerRetryEl) scannerRetryEl.hidden = !(mode === "confirm" || mode === "retry");
}

function resetScannerRecognition(message) {
  scannerPendingCardId = "";
  scannerPendingNodeId = "";
  const analyzingEl = document.getElementById("scanner-analyzing");
  if (analyzingEl) {
    analyzingEl.hidden = true;
    analyzingEl.classList.remove("scanner-analyzing--frozen");
  }
  if (scannerVideoEl) scannerVideoEl.hidden = false;
  if (scannerGuideEl) scannerGuideEl.hidden = false;
  if (scannerPreviewEl) scannerPreviewEl.hidden = true;
  if (scannerCaptureBtnEl) scannerCaptureBtnEl.disabled = false;
  showScannerActionMode("capture");
  if (message !== undefined) setScannerStatus(message);
}

function normalizeDetectedCardId(cardId) {
  const normalized = (cardId ?? "").toString().trim().toUpperCase();
  // Filtrar respuestas de error o vacías de la API
  if (!normalized || normalized.includes("IDENTIFIER") || normalized.includes("ERROR") || normalized.includes("FOUND")) {
    return "";
  }
  return normalized;
}

function collectActiveLeafNodeIds() {
  const activeIds = new Set();
  const filteredRoots = contentTree.map(filterTree).filter(Boolean);

  function walk(nodes) {
    for (const node of nodes) {
      if (node.type === "leaf") {
        activeIds.add(node.id);
      }
      if (node.children?.length) walk(node.children);
    }
  }

  walk(filteredRoots);
  return activeIds;
}

function getActiveNodeIdForDetectedCard(cardId) {
  const detectedId = normalizeDetectedCardId(cardId);
  const nodeId = cardLabelMap.get(detectedId);
  if (!nodeId) return null;
  const activeIds = collectActiveLeafNodeIds();
  return activeIds.has(nodeId) ? nodeId : null;
}

function drawScannerGuide(rect) {
  if (!scannerGuideEl) return;
  const ctx = scannerGuideEl.getContext("2d");
  const W = scannerGuideEl.width;
  const H = scannerGuideEl.height;
  ctx.clearRect(0, 0, W, H);

  // Fondo oscuro fuera del encuadre
  ctx.fillStyle = "rgba(0,0,0,0.50)";
  ctx.fillRect(0, 0, W, H);
  ctx.clearRect(rect.x, rect.y, rect.w, rect.h);

  // Esquinas tipo visor — proporcionales al tamaño del rect
  const arm = Math.round(Math.min(rect.w, rect.h) * 0.12);
  const corners = [
    [rect.x,           rect.y,            1,  1],
    [rect.x + rect.w,  rect.y,           -1,  1],
    [rect.x,           rect.y + rect.h,   1, -1],
    [rect.x + rect.w,  rect.y + rect.h,  -1, -1],
  ];
  ctx.strokeStyle = "#d4a23c";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  corners.forEach(([cx, cy, dx, dy]) => {
    ctx.beginPath();
    ctx.moveTo(cx + dx * arm, cy);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx, cy + dy * arm);
    ctx.stroke();
  });

  // Texto de ayuda dentro del encuadre
  ctx.fillStyle = "rgba(212,162,60,0.75)";
  ctx.font = `${Math.max(12, Math.round(rect.h * 0.07))}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "bottom";
  ctx.fillText("Encuadra el ID de la carta", rect.x + rect.w / 2, rect.y + rect.h - 8);
}

function resizeGuide() {
  if (!scannerGuideEl) return;
  const cW = scannerGuideEl.offsetWidth || scannerVideoEl.clientWidth;
  const cH = scannerGuideEl.offsetHeight || scannerVideoEl.clientHeight;
  if (!cW || !cH) return;
  scannerGuideEl.width = cW;
  scannerGuideEl.height = cH;
  const rect = {
    x: Math.round(cW * CROP.x),
    y: Math.round(cH * CROP.y),
    w: Math.round(cW * CROP.w),
    h: Math.round(cH * CROP.h),
  };
  lastGuideRect = rect;
  drawScannerGuide(rect);
}

async function openScanner() {
  if (!scannerOverlayEl) return;
  scannerOverlayEl.hidden = false;
  scannerPendingCardId = "";
  scannerPendingNodeId = "";
  showScannerActionMode("capture");
  if (scannerCaptureBtnEl) scannerCaptureBtnEl.disabled = true;
  setScannerStatus(t("scanner.init"));

  try {
    scannerStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
  } catch {
    setScannerStatus(t("scanner.noCameraAccess"), "error");
    return;
  }

  scannerVideoEl.srcObject = scannerStream;
  await scannerVideoEl.play().catch(() => {});

  if (scannerVideoEl.videoWidth > 0) {
    resizeGuide();
  } else {
    scannerVideoEl.addEventListener("loadedmetadata", resizeGuide, { once: true });
  }

  resetScannerRecognition(t("scanner.ready"));

  if (scannerCaptureBtnEl) {
    scannerCaptureBtnEl._handler = async () => {
      scannerCaptureBtnEl.disabled = true;
      scannerCaptureBtnEl.hidden = true;
      setScannerStatus(t("scanner.capturing"));

      const frame = await CardScanner.captureFrame(scannerVideoEl);
      if (!frame) {
        setScannerStatus(t("scanner.captureError"), "error");
        showScannerActionMode("capture");
        return;
      }

      if (scannerPreviewEl) {
        scannerPreviewEl.src = frame.dataUrl;
        scannerPreviewEl.hidden = false;
      }

      // Ocultar cámara y mostrar gráfico de análisis
      scannerVideoEl.hidden = true;
      if (scannerGuideEl) scannerGuideEl.hidden = true;
      const analyzingEl = document.getElementById("scanner-analyzing");
      const analyzingImgEl = document.getElementById("scanner-analyzing-img");
      if (analyzingEl && analyzingImgEl) {
        analyzingImgEl.src = frame.dataUrl;
        analyzingEl.hidden = false;
      }

      setScannerStatus(t("scanner.analyzing"));

      const rawCardId = await recognizeWithAPI(frame.blob);
      const detectedCardId = normalizeDetectedCardId(rawCardId);

      // Freeze analyzing overlay — keep captured image visible, stop scanline
      if (analyzingEl) analyzingEl.classList.add("scanner-analyzing--frozen");

      if (!detectedCardId) {
        setScannerStatus(t("scanner.noCardDetected"), "error");
        if (recognizerConfirmCard) {
          showScannerActionMode("retry");
        } else {
          setTimeout(() => resetScannerRecognition(), 2000);
        }
        return;
      }

      const activeNodeId = getActiveNodeIdForDetectedCard(detectedCardId);
      if (!activeNodeId) {
        scannerPendingCardId = "";
        scannerPendingNodeId = "";
        setScannerStatus(t("scanner.cardNotMatching", { card: detectedCardId }), "error");
        if (recognizerConfirmCard) {
          showScannerActionMode("retry");
        } else {
          setTimeout(() => resetScannerRecognition(), 2000);
        }
        return;
      }

      if (recognizerConfirmCard) {
        scannerPendingCardId = detectedCardId;
        scannerPendingNodeId = activeNodeId;
        setScannerStatus(t("scanner.cardFoundConfirm", { card: detectedCardId }), "found");
        showScannerActionMode("confirm");
        return;
      }

      handleCardDetected(detectedCardId, activeNodeId);
    };
    scannerCaptureBtnEl.addEventListener("click", scannerCaptureBtnEl._handler);
  }
}

function closeScanner() {
  if (!scannerOverlayEl) return;
  if (scannerCaptureBtnEl?._handler) {
    scannerCaptureBtnEl.removeEventListener("click", scannerCaptureBtnEl._handler);
    scannerCaptureBtnEl._handler = null;
    scannerCaptureBtnEl.disabled = false;
  }
  scannerPendingCardId = "";
  scannerPendingNodeId = "";
  showScannerActionMode("capture");

  // Restaurar viewport al estado inicial por si se cierra durante el análisis
  const analyzingEl = document.getElementById("scanner-analyzing");
  if (analyzingEl) {
    analyzingEl.hidden = true;
    analyzingEl.classList.remove("scanner-analyzing--frozen");
  }
  if (scannerVideoEl) scannerVideoEl.hidden = false;
  if (scannerGuideEl) scannerGuideEl.hidden = false;
  if (scannerPreviewEl) scannerPreviewEl.hidden = true;
  if (scannerStream) {
    scannerStream.getTracks().forEach((t) => t.stop());
    scannerStream = null;
  }
  if (scannerVideoEl) scannerVideoEl.srcObject = null;
  scannerOverlayEl.hidden = true;
}

function handleCardDetected(cardId, resolvedNodeId = null) {
  // Unlock audio autoplay on this user gesture before any async chain starts.
  // Android Chrome and iOS Safari both require play() to be called synchronously
  // within a user gesture. The async chain (loadedmetadata, setTimeout) breaks
  // that context. Playing a silent data-URI audio here unlocks audio for the session.
  const _audioUnlock = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
  _audioUnlock.play().catch(() => {});

  const normalizedCardId = normalizeDetectedCardId(cardId);
  const nodeId = resolvedNodeId || cardLabelMap.get(normalizedCardId);
  if (!nodeId) {
    setScannerStatus(t("scanner.cardNotFound", { card: normalizedCardId || cardId }), "error");
    return;
  }
  closeScanner();
  if (view !== "narraciones") { view = "narraciones"; }

  // Si no hay provincia seleccionada, derivarla de la carta detectada
  // para que render() muestre el árbol en lugar de la pantalla vacía.
  if (!selectedProvincia) {
    const detectedNode = findNodeById(contentTree, nodeId);
    const nodeProvincia = detectedNode?.tags?.provincia;
    if (nodeProvincia && nodeProvincia !== "all") {
      selectedProvincia = nodeProvincia;
    } else {
      // Carta genérica ("all") sin provincia propia → usar la primera disponible.
      selectedProvincia = FILTER_OPTIONS.provincias[0] ?? "";
    }
  }

  saveState();

  // Expandir toda la jerarquía de ancestros para que la hoja sea visible
  const ancestors = [];
  let parentId = accordionIndex.parentById.get(nodeId);
  while (parentId && parentId !== accordionIndex.rootId) {
    ancestors.unshift(parentId);
    parentId = accordionIndex.parentById.get(parentId);
  }
  ancestors.forEach((id) => expandedPanels.add(id));

  render();
  if (!expandedPanels.has(nodeId)) { togglePanel(nodeId); }
  // Doble rAF: el primero espera a que render() pinte el DOM,
  // el segundo espera a que togglePanel() expanda el panel y lo repinte.
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const panel = document.getElementById(`${nodeId}-content`) ||
                  document.getElementById(`${nodeId}-toggle`) ||
                  document.querySelector(`[data-panel-toggle="${nodeId}"]`);
    panel?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

scannerBtnEl?.addEventListener("click", openScanner);
document.getElementById("scanner-close")?.addEventListener("click", closeScanner);
scannerConfirmOkEl?.addEventListener("click", () => {
  if (!scannerPendingNodeId) return;
  handleCardDetected(scannerPendingCardId, scannerPendingNodeId);
});
scannerRetryEl?.addEventListener("click", () => {
  const hadPendingCard = Boolean(scannerPendingNodeId);
  resetScannerRecognition(hadPendingCard ? t("scanner.canceledMsg") : t("scanner.retryMsg"));
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && scannerOverlayEl && !scannerOverlayEl.hidden) closeScanner();
});

if (stEnabled) {
  setupSTPlayer();
  loadSTTrack(stCurrentTrack).then(() => {
    if (stRestoreTime > 0) {
      if (isFinite(stAudio.duration) && stAudio.duration > 0) {
        stAudio.currentTime = stRestoreTime;
        stRestoreTime = 0;
      } else {
        const seekOnce = () => {
          stAudio.currentTime = stRestoreTime;
          stRestoreTime = 0;
          stAudio.removeEventListener("loadedmetadata", seekOnce);
        };
        stAudio.addEventListener("loadedmetadata", seekOnce);
      }
    }
    stAudio?.play().catch(() => {});
    updateSTUI();
    updateSTMediaSession(true);
  });
  downloadSTIfNeeded();
}

window.addEventListener("pagehide", () => {
  saveState();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) saveState();
});

window.addEventListener("pagehide", (e) => {
  if (!e.persisted && activePlayer?.playing) pauseActivePlayerInternal();
});

function registerServiceWorker() {
  // En desarrollo NO usamos el service worker: provoca que se sirva un index.html
  // cacheado y obsoleto (recargas lentas, UI desincronizada). Además, si quedó
  // uno registrado de una sesión previa, lo eliminamos y limpiamos sus cachés.
  if (import.meta.env.DEV) {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => regs.forEach((reg) => reg.unregister()))
        .catch(() => {});
    }
    if (typeof caches !== "undefined") {
      caches.keys()
        .then((keys) => keys.filter((k) => k !== ST_CACHE_NAME).forEach((k) => caches.delete(k)))
        .catch(() => {});
    }
    return;
  }

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        const registration = await navigator.serviceWorker.register(
          `${import.meta.env.BASE_URL}sw.js`,
          { updateViaCache: "none" }
        );

        if (registration.waiting) {
          registration.waiting.postMessage({ type: "SKIP_WAITING" });
        }

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              newWorker.postMessage({ type: "SKIP_WAITING" });
            }
          });
        });

        navigator.serviceWorker.addEventListener("controllerchange", () => {
          window.location.reload();
        });

        swRegistration = registration;
        registration.update();

        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState === "visible" && swRegistration) {
            swRegistration.update().catch(() => {});
          }
        });

        console.log("Service worker registrado");
      } catch (error) {
        console.error("Error registrando service worker:", error);
      }
    });
  }
}

function render() {
  syncTopbarSearchAvailability();
  sidebarEl.innerHTML = renderSidebar();

  if (view === "inicio") {
    screenEl.setAttribute("aria-label", t("a11y.screenWelcome"));
    screenEl.innerHTML = renderWelcome();
    bindFilterEvents();
    bindConfigEvents();
    return;
  }

  screenEl.setAttribute("aria-label", t("a11y.screenNarrations"));

  let bodyHtml;
  if (!selectedProvincia) {
    bodyHtml = `<div class="empty-screen">${escapeHtml(t("content.selectProvince"))}</div>`;
  } else {
    const filteredRoots = contentTree
      .map(filterTree)
      .filter(Boolean);

    // Con busqueda activa, mantener abiertos los paneles raiz visibles
    // para exponer candidatos sin clics extra.
    if (cardSearchQuery && filteredRoots.length) {
      filteredRoots.forEach((node) => expandedPanels.add(node.id));
    }

    bodyHtml = filteredRoots.length
      ? filteredRoots.map((node) => renderPanel(node, 0)).join("")
      : `<div class="empty-screen">${escapeHtml(t("content.noMatches"))}</div>`;
  }

  const provLabel = selectedProvincia ? provinciaLabel(selectedProvincia) : null;
  const gremLabel = selectedGremio ? gremioLabel(selectedGremio) : null;
  const breadcrumb = provLabel
    ? `<p class="description breadcrumb">${escapeHtml(provLabel)}${gremLabel ? ` &mdash; ${escapeHtml(gremLabel)}` : ""}</p>`
    : "";

  screenEl.innerHTML = `
    <div class="single-screen-head">
      <h2>${escapeHtml(t("app.campaignTitle"))}</h2>
      ${breadcrumb}
    </div>
    <div class="accordion-root">
      ${bodyHtml}
    </div>
  `;

  bindFilterEvents();
  bindConfigEvents();
  bindPanelEvents();
  bindDescriptionRevealEvents();
}

function renderWelcome() {
  const features = t("welcome.features");
  const featuresHtml = (Array.isArray(features) ? features : [])
    .map((f) => `<li><strong>${escapeHtml(f.term)}</strong> ${escapeHtml(f.desc)}</li>`)
    .join("");

  const bannerHtml = WELCOME_BANNER_SRC
    ? `<img class="welcome-banner-img" src="${escapeAttribute(import.meta.env.BASE_URL + WELCOME_BANNER_SRC)}" alt="${escapeAttribute(t("welcome.bannerAlt"))}" decoding="async">`
    : `<div class="welcome-banner" role="img" aria-label="${escapeAttribute(t("welcome.bannerAria"))}">
        <span class="welcome-banner-label">${escapeHtml(t("welcome.bannerLabel"))}</span>
      </div>`;

  return `
    <div class="welcome">
      ${bannerHtml}
      <div class="welcome-intro">
        <h2>${escapeHtml(t("app.campaignTitle"))}</h2>
        <p class="welcome-lead">${escapeHtml(t("welcome.lead"))}</p>
        <p class="welcome-text">${escapeHtml(t("welcome.intro"))}</p>
        <h3 class="welcome-features-title">${escapeHtml(t("welcome.featuresTitle"))}</h3>
        <ul class="welcome-features">
          ${featuresHtml}
        </ul>
        <p class="welcome-text welcome-note">${escapeHtml(t("welcome.note"))}</p>
      </div>
      <footer class="welcome-footer">
        <p>${escapeHtml(t("welcome.footerCredits"))}</p>
        <p>${escapeHtml(t("welcome.footerDisclaimer"))}</p>
        <p>${escapeHtml(t("welcome.footerContact"))} <a href="mailto:${CONTACT_EMAIL}">${escapeHtml(CONTACT_EMAIL)}</a></p>
      </footer>
    </div>
  `;
}

function renderSidebar() {
  // Province/guild highlights only make sense once the user is browsing
  // narrations. On the welcome page nothing here should appear selected.
  const inNarr = view === "narraciones";

  // Provincia = entrar en una sección → fila con chevron (›).
  const provinciaItems = FILTER_OPTIONS.provincias.map((id) => {
    const active = inNarr && selectedProvincia === id;
    return `<button type="button" class="sidebar-nav-item sidebar-nav-item--section${active ? " sidebar-nav-item--active" : ""}" data-filter-type="provincia" data-filter-value="${escapeAttribute(id)}" aria-pressed="${active ? "true" : "false"}"><span class="sidebar-nav-dot" aria-hidden="true">${active ? ICONS.diamondFilled : ICONS.diamondEmpty}</span><span class="sidebar-nav-text">${escapeHtml(provinciaLabel(id))}</span><span class="sidebar-nav-chevron" aria-hidden="true">${ICONS.chevronRight}</span></button>`;
  }).join("");

  // Gremio = filtro/modificador del contenido → lista indentada con casillas (▣/▢).
  const gremioNoneActive = inNarr && !selectedGremio;
  const gremioBtn = (value, label, active) =>
    `<button type="button" class="sidebar-nav-item sidebar-nav-item--filter${active ? " sidebar-nav-item--active" : ""}" data-filter-type="gremio" data-filter-value="${escapeAttribute(value)}" aria-pressed="${active ? "true" : "false"}"><span class="sidebar-nav-dot sidebar-nav-dot--check" aria-hidden="true">${active ? ICONS.boxFilled : ICONS.boxEmpty}</span><span class="sidebar-nav-text">${escapeHtml(label)}</span></button>`;
  const gremioItems = [
    gremioBtn("", t("sidebar.allGuilds"), gremioNoneActive),
    ...FILTER_OPTIONS.gremios.map((id) => gremioBtn(id, gremioLabel(id), inNarr && selectedGremio === id)),
  ].join("");

  const speedChips = [1.00, 1.15, 1.25, 1.5].map((rate) => {
    const active = playbackRate === rate;
    return `<button type="button" class="checkable-chip${active ? " checkable-chip--active" : ""}" data-config-rate="${rate}" aria-pressed="${active ? "true" : "false"}"><span class="checkable-chip-mark" aria-hidden="true">${active ? ICONS.dotFilled : ICONS.dotEmpty}</span><span>${rate.toFixed(2)}x</span></button>`;
  }).join("");

  const inicioActive = view === "inicio";

  return `
    <nav class="sidebar-nav" aria-label="${escapeAttribute(t("a11y.sidebarNav"))}">
      <button type="button" class="sidebar-close" data-sidebar-close aria-label="${escapeAttribute(t("a11y.closeSidebar"))}">${ICONS.close}</button>
      <div class="sidebar-section">
        <div class="sidebar-nav-list">
          <button type="button" class="sidebar-nav-item${inicioActive ? " sidebar-nav-item--active" : ""}" data-nav-view="inicio" aria-current="${inicioActive ? "page" : "false"}"><span class="sidebar-nav-dot" aria-hidden="true">${inicioActive ? ICONS.diamondFilled : ICONS.diamondEmpty}</span>${escapeHtml(t("sidebar.home"))}</button>
        </div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.provincia"))}</h3>
        <p class="sidebar-section-hint">${escapeHtml(t("sidebar.provinciaHint"))}</p>
        <div class="sidebar-nav-list">${provinciaItems}</div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section sidebar-section--filter">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.gremio"))}</h3>
        <p class="sidebar-section-hint">${escapeHtml(t("sidebar.gremioHint"))}</p>
        <div class="sidebar-nav-list sidebar-nav-list--filter">${gremioItems}</div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.playback"))}</h3>
        <div class="sidebar-controls">
          <label class="sidebar-ctrl-label">
            <input type="checkbox" id="autoplay-checkbox" class="autoplay-checkbox"${autoPlay ? " checked" : ""}>
            <span>${escapeHtml(t("sidebar.autoplay"))}</span>
          </label>
          <div class="sidebar-speed">${speedChips}</div>
        </div>
      </div>
      <div class="sidebar-divider"></div>
      <div class="sidebar-section">
        <h3 class="sidebar-heading">${escapeHtml(t("sidebar.recognizer"))}</h3>
        <div class="sidebar-controls">
          <label class="sidebar-ctrl-label">
            <input type="checkbox" id="recognizer-confirm-card-checkbox" class="autoplay-checkbox"${recognizerConfirmCard ? " checked" : ""}>
            <span>${escapeHtml(t("sidebar.confirmRecognizedCard"))}</span>
          </label>
        </div>
      </div>
    </nav>
  `;
}

function renderCheckable(type, value, label, checked) {
  const pressed = checked ? "true" : "false";
  const activeClass = checked ? " checkable-chip--active" : "";

  return `
    <button
      type="button"
      class="checkable-chip${activeClass}"
      data-filter-type="${escapeAttribute(type)}"
      data-filter-value="${escapeAttribute(value)}"
      aria-pressed="${pressed}"
    >
      <span class="checkable-chip-mark" aria-hidden="true">${checked ? ICONS.dotFilled : ICONS.dotEmpty}</span>
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function bindConfigEvents() {
  const checkbox = document.getElementById("autoplay-checkbox");
  if (checkbox) {
    checkbox.addEventListener("change", () => {
      autoPlay = checkbox.checked;
      saveState();
    });
  }

  const recognizerConfirmCheckbox = document.getElementById("recognizer-confirm-card-checkbox");
  if (recognizerConfirmCheckbox) {
    recognizerConfirmCheckbox.addEventListener("change", () => {
      recognizerConfirmCard = recognizerConfirmCheckbox.checked;
      saveState();
    });
  }

  document.querySelectorAll("[data-config-rate]").forEach((button) => {
    button.addEventListener("click", () => {
      const rate = parseFloat(button.dataset.configRate);
      playbackRate = rate;
      saveState();

      screenEl.querySelectorAll("audio").forEach((audioEl) => {
        audioEl.playbackRate = rate;
      });
      if (activePlayer) {
        activePlayer.panelEl.playbackRate = rate;
        if (activePlayer.ambientEl) activePlayer.ambientEl.playbackRate = rate;
      }

      document.querySelectorAll("[data-config-rate]").forEach((btn) => {
        const btnRate = parseFloat(btn.dataset.configRate);
        const active = playbackRate === btnRate;
        btn.classList.toggle("checkable-chip--active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        btn.querySelector(".checkable-chip-mark").innerHTML = active ? ICONS.dotFilled : ICONS.dotEmpty;
      });
    });
  });

  if (stEnabled) updateSTUI();
}

function bindFilterEvents() {
  // data-filter-collapse buttons no longer exist in sidebar (sections are always visible)
  // kept for backward-compat in case any collapse buttons remain in screenEl
  document.querySelectorAll("[data-filter-collapse]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.filterCollapse;
      if (target === "provincia") provinciaCollapsed = !provinciaCollapsed;
      if (target === "gremio") gremioCollapsed = !gremioCollapsed;
      if (target === "narraciones") narrationsCollapsed = !narrationsCollapsed;
      if (target === "banda") bandaCollapsed = !bandaCollapsed;
      saveState();
      render();
    });
  });

  // Botón "X" para cerrar el menú lateral en móvil
  document.querySelector("[data-sidebar-close]")?.addEventListener("click", () => {
    setSidebarOpen(false);
    sidebarToggleEl?.focus();
  });

  // "Inicio" navigation → welcome view
  document.querySelectorAll("[data-nav-view]").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.navView === "inicio") {
        goToInicio();
        return;
      }
      view = "narraciones";
      stopActivePlayer();
      saveState();
      render();
    });
  });

  document.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.filterType;
      const value = button.dataset.filterValue;
      if (!type) return;  // value="" is valid (clear guild selection)

      if (type === "provincia") {
        // Always select the province (no toggle-off) and reset the guild
        // filter to "Todos" by default, then enter the narrations view.
        selectedProvincia = value;
        selectedGremio = "";
        view = "narraciones";
      }

      if (type === "gremio") {
        selectedGremio = selectedGremio === value ? "" : value;
      }

      // En móvil NO cerramos el menú al elegir provincia/gremio: el usuario lo
      // cierra a mano (con el botón ☰ o tocando fuera), igual que los ajustes.
      saveState();
      render();
    });
  });

  const cardSearchInput = document.getElementById("card-search-input");
  if (cardSearchInput && cardSearchInput.dataset.bound !== "true") {
    cardSearchInput.dataset.bound = "true";

    cardSearchInput.addEventListener("input", () => {
      const changed = applyCardSearchQuery(cardSearchInput.value);
      if (!changed) return;
      if (view === "narraciones") render();
    });

    cardSearchInput.addEventListener("keydown", (event) => {
      if (event.key !== "Escape") return;
      if (!cardSearchInput.value && !cardSearchQuery) return;
      cardSearchInput.value = "";
      applyCardSearchQuery("");
      if (view === "narraciones") render();
    });
  }

  if (cardSearchInput && cardSearchInput.value !== cardSearchQuery) {
    cardSearchInput.value = cardSearchQuery;
  }
}

function bindPanelEvents() {
  screenEl.querySelectorAll("[data-panel-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      togglePanel(button.dataset.panelToggle || "");
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      togglePanel(button.dataset.panelToggle || "");
    });
  });
}

function resolveAmbientSrc(nodeId) {
  let id = nodeId;
  let parentId = accordionIndex.parentById.get(id);
  while (parentId && parentId !== accordionIndex.rootId) {
    id = parentId;
    parentId = accordionIndex.parentById.get(id);
  }
  // id is now the root group node id, e.g. "group-ciudades"
  const categoryKey = id.replace(/^group-/, "");
  const planAmbient = appData[categoryKey]?.ambient;
  if (planAmbient) return planAmbient;

  const provinciaAmbient = appData.ambientConfig?.provincias?.[selectedProvincia];
  if (provinciaAmbient) return provinciaAmbient;

  const generalAmbient = appData.ambientConfig?.general;
  if (generalAmbient) return generalAmbient;

  return null;
}


function fadeOutAmbient(audioEl, duration = 1000) {
  if (!audioEl) return;
  const step = 50 / duration;
  const interval = setInterval(() => {
    if (audioEl.volume <= step) {
      audioEl.volume = 0;
      audioEl.pause();
      clearInterval(interval);
    } else {
      audioEl.volume -= step;
    }
  }, 50);
}

function formatTime(secs) {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatTimeLong(secs) {
  if (!isFinite(secs) || secs < 0) return "0:00";
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function stopActivePlayer() {
  if (!activePlayer) return;
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  }
  restoreSTFade();
  cancelAnimationFrame(activePlayer.rafId);
  activePlayer.rafId = 0;
  activePlayer.playing = false;
  activePlayer.panelEl.pause();
  if (activePlayer.ambientEl) activePlayer.ambientEl.pause();
  activePlayer = null;
}

function playerRaf() {
  if (!activePlayer) return;
  const p = activePlayer;

  let vt;
  if (p.hasAmbient) {
    if (p.phase === "pre-roll") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / p.panelEl.playbackRate;
      const pos = p.preRollPosAtStart + elapsed;
      vt = Math.min(1, pos);
      if (pos >= 1) {
        p.phase = "playing";
        p.preRollPosAtStart = 0;
        p.phaseStartMs = null;
        p.panelEl.play().catch(() => {});
      }
    } else if (p.phase === "playing") {
      vt = p.panelEl.currentTime + 1;
      // Guard: panel ended before event fired
      if (p.panelEl.ended) {
        p.phase = "fade-out";
        p.fadeOutPosAtStart = 0;
        p.phaseStartMs = performance.now();
        if (p.ambientEl) p.ambientEl.volume = 0.25;
      }
    } else if (p.phase === "fade-out") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / (p.ambientEl?.playbackRate || 1);
      const pos = p.fadeOutPosAtStart + elapsed;
      vt = p.panelDuration + 1 + pos;
      // Fade ambient volume: 0.3 → 0 over 1 second
      if (p.ambientEl) p.ambientEl.volume = Math.max(0, 0.25 * (1 - pos));
      if (pos >= 1) {
        vt = p.totalDuration;
        if (p.ambientEl) { p.ambientEl.volume = 0; p.ambientEl.pause(); }
        updatePlayerUI(p, vt);
        setPlayerBtnState(p.playerEl, false);
        p.playing = false;
        updateMediaSession(false);
        restoreSTFade();
        cancelAnimationFrame(p.rafId);
        p.rafId = 0;
        p.phase = "ended";
        return;
      }
    } else {
      // ended — rAF should not be running
      return;
    }
  } else {
    vt = p.panelEl.currentTime;
    if (p.panelEl.ended) {
      vt = p.totalDuration;
      updatePlayerUI(p, vt);
      setPlayerBtnState(p.playerEl, false);
      p.playing = false;
      updateMediaSession(false);
      restoreSTFade();
      cancelAnimationFrame(p.rafId);
      p.rafId = 0;
      p.phase = "ended";
      return;
    }
  }

  updatePlayerUI(p, vt);
  p.rafId = requestAnimationFrame(playerRaf);
}

function updatePlayerUI(p, vt) {
  const seekbar = p.playerEl.querySelector("[data-player-seek]");
  const currentEl = p.playerEl.querySelector("[data-player-current]");
  if (!p.isSeeking && seekbar) {
    seekbar.value = p.totalDuration > 0 ? Math.round((vt / p.totalDuration) * 1000) : 0;
  }
  if (currentEl) currentEl.textContent = formatTime(vt);
}

function setPlayerBtnState(playerEl, isPlaying) {
  const btn = playerEl.querySelector("[data-player-play]");
  if (!btn) return;
  btn.innerHTML = isPlaying ? ICONS.pause : ICONS.play;
  btn.classList.toggle("player-btn--playing", isPlaying);
  btn.setAttribute("aria-label", isPlaying ? t("player.pause") : t("player.play"));
}

function seekPlayer(vt) {
  if (!activePlayer) return;
  const p = activePlayer;
  const clamped = Math.max(0, Math.min(vt, p.totalDuration));

  cancelAnimationFrame(p.rafId);
  p.rafId = 0;

  const wasPlaying = p.hasAmbient
    ? !(p.ambientEl?.paused ?? true)
    : !p.panelEl.paused;

  if (p.hasAmbient) {
    if (clamped < 1) {
      // pre-roll zone
      p.panelEl.pause();
      p.panelEl.currentTime = 0;
      if (p.ambientEl) p.ambientEl.volume = 0.25;
      p.phase = "pre-roll";
      p.preRollPosAtStart = clamped;
      p.phaseStartMs = wasPlaying ? performance.now() : null;
      if (wasPlaying && p.ambientEl?.paused) p.ambientEl.play().catch(() => {});
    } else if (clamped <= p.panelDuration + 1) {
      // playing zone
      p.panelEl.currentTime = clamped - 1;
      if (p.ambientEl) p.ambientEl.volume = 0.25;
      p.phase = "playing";
      p.phaseStartMs = null;
      if (wasPlaying) {
        if (p.ambientEl?.paused) p.ambientEl.play().catch(() => {});
        if (p.panelEl.paused) p.panelEl.play().catch(() => {});
      }
    } else {
      // fade-out zone
      const fadeOutPos = clamped - (p.panelDuration + 1);
      p.panelEl.pause();
      p.phase = "fade-out";
      p.fadeOutPosAtStart = fadeOutPos;
      p.phaseStartMs = wasPlaying ? performance.now() : null;
      if (p.ambientEl) p.ambientEl.volume = Math.max(0, 0.25 * (1 - fadeOutPos));
      if (wasPlaying && p.ambientEl?.paused) p.ambientEl.play().catch(() => {});
    }
  } else {
    p.panelEl.currentTime = clamped;
    p.phase = clamped < p.totalDuration ? "playing" : "ended";
    if (wasPlaying && p.panelEl.paused) p.panelEl.play().catch(() => {});
  }

  if (wasPlaying) {
    p.rafId = requestAnimationFrame(playerRaf);
  } else {
    updatePlayerUI(p, clamped);
  }
}

function updateMediaSession(playing) {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.playbackState = playing ? "playing" : "paused";
}

function pauseActivePlayerInternal() {
  if (!activePlayer) return;
  const p = activePlayer;
  cancelAnimationFrame(p.rafId);
  p.rafId = 0;
  if (p.hasAmbient) {
    if (p.phase === "pre-roll") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / p.panelEl.playbackRate;
      p.preRollPosAtStart = Math.min(1, p.preRollPosAtStart + elapsed);
      p.phaseStartMs = null;
    } else if (p.phase === "fade-out") {
      const elapsed = (performance.now() - p.phaseStartMs) / 1000 / (p.ambientEl?.playbackRate || 1);
      p.fadeOutPosAtStart = Math.min(1, p.fadeOutPosAtStart + elapsed);
      p.phaseStartMs = null;
    }
    p.ambientEl?.pause();
  }
  p.playing = false;
  p.panelEl.pause();
  setPlayerBtnState(p.playerEl, false);
  updateMediaSession(false);
  restoreSTFade();
}

function resumeActivePlayerInternal() {
  if (!activePlayer) return;
  const p = activePlayer;
  if (p.hasAmbient) {
    if (p.phase === "pre-roll") {
      p.phaseStartMs = performance.now();
      p.ambientEl?.play().catch(() => {});
    } else if (p.phase === "playing") {
      p.ambientEl?.play().catch(() => {});
      p.panelEl.play().catch(() => {});
    } else if (p.phase === "fade-out") {
      p.phaseStartMs = performance.now();
      if (p.ambientEl) {
        p.ambientEl.volume = Math.max(0, 0.25 * (1 - p.fadeOutPosAtStart));
        p.ambientEl.play().catch(() => {});
      }
    }
  } else {
    if (!p.panelEl.ended) p.panelEl.play().catch(() => {});
  }
  p.playing = true;
  p.rafId = requestAnimationFrame(playerRaf);
  setPlayerBtnState(p.playerEl, true);
  updateMediaSession(true);
  duckST();
}

function initPlayer(contentEl, panelEl, ambientEl, totalDuration, panelDuration) {
  const playerEl = contentEl.querySelector(".custom-player");
  if (!playerEl) return;

  const hasAmbient = !!ambientEl;

  activePlayer = {
    rafId: 0,
    playerEl,
    panelEl,
    ambientEl: ambientEl || null,
    hasAmbient,
    totalDuration,
    panelDuration,
    phase: hasAmbient ? "pre-roll" : "playing",
    phaseStartMs: null,      // null = not yet started / paused
    preRollPosAtStart: 0,    // accumulated pre-roll seconds (0..1) at last pause
    fadeOutPosAtStart: 0,    // accumulated fade-out seconds (0..1) at last pause
    isSeeking: false,
    playing: false,
  };

  // Set up audio volumes and rates
  panelEl.volume = 1;
  panelEl.playbackRate = playbackRate;
  if (ambientEl) {
    ambientEl.volume = 0.25;
    ambientEl.playbackRate = playbackRate;
  }

  // Update total time display
  const totalEl = playerEl.querySelector("[data-player-total]");
  if (totalEl) totalEl.textContent = formatTime(totalDuration);

  // Enable seekbar
  const seekbar = playerEl.querySelector("[data-player-seek]");
  if (seekbar) seekbar.removeAttribute("disabled");

  // Panel ended → enter fade-out phase (Modo A). No { once } so replays also trigger it.
  if (hasAmbient) {
    panelEl.addEventListener("ended", () => {
      if (!activePlayer || activePlayer.panelEl !== panelEl) return;
      if (activePlayer.phase !== "playing") return;
      activePlayer.phase = "fade-out";
      activePlayer.fadeOutPosAtStart = 0;
      activePlayer.phaseStartMs = performance.now();
      if (activePlayer.ambientEl) activePlayer.ambientEl.volume = 0.25;
      if (!activePlayer.rafId) activePlayer.rafId = requestAnimationFrame(playerRaf);
    });
  }

  // Recover from unexpected OS-level pause (volume buttons, audio focus loss, Bluetooth, etc.)
  panelEl.addEventListener("pause", () => {
    if (!activePlayer || activePlayer.panelEl !== panelEl) return;
    if (!activePlayer.playing || panelEl.ended) return;
    panelEl.play().catch(() => {});
  });

  // Register MediaSession metadata and action handlers for OS media controls
  if ("mediaSession" in navigator) {
    const title = contentEl.closest(".panel")?.querySelector(".panel-title")?.textContent?.trim() || t("app.mediaFallbackTitle");
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: t("app.mediaArtist") });
    navigator.mediaSession.setActionHandler("play", () => playerEl.querySelector("[data-player-play]")?.click());
    navigator.mediaSession.setActionHandler("pause", () => playerEl.querySelector("[data-player-play]")?.click());
    navigator.mediaSession.setActionHandler("stop", () => stopActivePlayer());
  }

  // Play/pause button
  playerEl.querySelector("[data-player-play]")?.addEventListener("click", () => {
    if (!activePlayer) return;
    const p = activePlayer;

    if (p.hasAmbient) {
      // ── Restart after end ──
      if (p.phase === "ended") {
        if (p.ambientEl) { p.ambientEl.volume = 0.25; p.ambientEl.currentTime = 0; }
        p.panelEl.currentTime = 0;
        p.phase = "pre-roll";
        p.preRollPosAtStart = 0;
        p.fadeOutPosAtStart = 0;
        p.phaseStartMs = performance.now();
        p.ambientEl?.play().catch(() => {});
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
        return;
      }

      const isPlaying = !(p.ambientEl?.paused ?? true);

      if (isPlaying) {
        // Pause — accumulate progress in current phase
        cancelAnimationFrame(p.rafId);
        p.rafId = 0;
        if (p.phase === "pre-roll") {
          const elapsed = (performance.now() - p.phaseStartMs) / 1000 / p.panelEl.playbackRate;
          p.preRollPosAtStart = Math.min(1, p.preRollPosAtStart + elapsed);
          p.phaseStartMs = null;
        } else if (p.phase === "fade-out") {
          const elapsed = (performance.now() - p.phaseStartMs) / 1000 / (p.ambientEl?.playbackRate || 1);
          p.fadeOutPosAtStart = Math.min(1, p.fadeOutPosAtStart + elapsed);
          p.phaseStartMs = null;
        }
        p.playing = false;
        p.ambientEl?.pause();
        p.panelEl.pause();
        setPlayerBtnState(playerEl, false);
        updateMediaSession(false);
        restoreSTFade();
      } else {
        // Resume — phaseStartMs restarts from accumulated pos
        if (p.phase === "pre-roll") {
          p.phaseStartMs = performance.now();
          p.ambientEl?.play().catch(() => {});
        } else if (p.phase === "playing") {
          p.ambientEl?.play().catch(() => {});
          p.panelEl.play().catch(() => {});
        } else if (p.phase === "fade-out") {
          p.phaseStartMs = performance.now();
          if (p.ambientEl) {
            p.ambientEl.volume = Math.max(0, 0.25 * (1 - p.fadeOutPosAtStart));
            p.ambientEl.play().catch(() => {});
          }
        }
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
      }
    } else {
      // ── Modo B ──
      if (p.phase === "ended" || p.panelEl.ended) {
        p.panelEl.currentTime = 0;
        p.phase = "playing";
        p.panelEl.play().catch(() => {});
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
        return;
      }
      if (p.panelEl.paused) {
        p.panelEl.play().catch(() => {});
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
        duckST();
      } else {
        p.playing = false;
        p.panelEl.pause();
        cancelAnimationFrame(p.rafId);
        p.rafId = 0;
        setPlayerBtnState(playerEl, false);
        updateMediaSession(false);
        restoreSTFade();
      }
    }
  });

  // Seekbar interaction
  if (seekbar) {
    seekbar.addEventListener("mousedown", () => { if (activePlayer) activePlayer.isSeeking = true; });
    seekbar.addEventListener("touchstart", () => { if (activePlayer) activePlayer.isSeeking = true; }, { passive: true });
    seekbar.addEventListener("input", () => {
      if (!activePlayer) return;
      const vt = (parseInt(seekbar.value, 10) / 1000) * activePlayer.totalDuration;
      updatePlayerUI(activePlayer, vt);
    });
    seekbar.addEventListener("change", () => {
      if (!activePlayer) return;
      activePlayer.isSeeking = false;
      const vt = (parseInt(seekbar.value, 10) / 1000) * activePlayer.totalDuration;
      seekPlayer(vt);
    });
  }
}

function togglePanel(panelId) {
  if (!panelId) return;

  let isOpening = false;

  if (expandedPanels.has(panelId)) {
    collapseBranch(panelId);
  } else {
    const parentId = accordionIndex.parentById.get(panelId) || accordionIndex.rootId;
    const siblings = accordionIndex.childrenByParent.get(parentId) || [];

    siblings.forEach((siblingId) => {
      if (siblingId !== panelId) {
        collapseBranch(siblingId);
      }
    });

    expandedPanels.add(panelId);
    isOpening = true;
  }

  saveState();
  render();

  if (isOpening) {
    const node = findNodeById(contentTree, panelId);
    if (node?.type === "leaf") {
      const contentEl = document.getElementById(`${panelId}-content`);
      if (contentEl) {
        const panelEl = contentEl.querySelector('audio[data-role="panel"]');
        const ambientEl = contentEl.querySelector('audio[data-role="ambient"]');
        if (!panelEl) return;

        const setupAndStart = () => {
          const panelDuration = panelEl.duration;
          const totalDuration = ambientEl ? panelDuration + 2 : panelDuration;
          initPlayer(contentEl, panelEl, ambientEl || null, totalDuration, panelDuration);
          if (autoPlay) {
            duckSTFade(() => {
              const p = activePlayer;
              if (!p) return;
              if (p.hasAmbient) {
                p.phaseStartMs = performance.now();
                ambientEl.play().catch(() => {});
              } else {
                panelEl.play().catch(() => {});
              }
              p.rafId = requestAnimationFrame(playerRaf);
              setPlayerBtnState(p.playerEl, true);
              p.playing = true;
              updateMediaSession(true);
            });
          }
        };

        if (isFinite(panelEl.duration) && panelEl.duration > 0) {
          setupAndStart();
        } else {
          panelEl.addEventListener("loadedmetadata", setupAndStart, { once: true });
        }
      }
    }
  }
}

function collapseBranch(panelId) {
  stopActivePlayer();
  const contentEl = document.getElementById(`${panelId}-content`);
  contentEl?.querySelectorAll("audio").forEach((a) => a.pause());
  expandedPanels.delete(panelId);
  revealedDescriptions.delete(panelId);
  const children = accordionIndex.childrenByParent.get(panelId) || [];
  children.forEach((childId) => collapseBranch(childId));
}

function buildAccordionIndex(roots) {
  const rootId = "__root__";
  const parentById = new Map();
  const childrenByParent = new Map();

  function ensureParent(parentId) {
    if (!childrenByParent.has(parentId)) {
      childrenByParent.set(parentId, []);
    }
  }

  function link(parentId, childId) {
    ensureParent(parentId);
    childrenByParent.get(parentId).push(childId);
  }

  function walk(node, parentId) {
    parentById.set(node.id, parentId);
    link(parentId, node.id);

    node.children.forEach((child) => {
      walk(child, node.id);
    });
  }

  ensureParent(rootId);
  roots.forEach((node) => walk(node, rootId));

  return {
    rootId,
    parentById,
    childrenByParent
  };
}

function renderPanel(node, level) {
  const isOpen = expandedPanels.has(node.id);
  const icon = isOpen ? ICONS.minus : ICONS.plus;
  const levelClass = `panel level-${Math.min(level, 3)}`;
  const childrenHtml = node.children.map((child) => renderPanel(child, level + 1)).join("");

  return `
    <section class="${levelClass}">
      <button
        type="button"
        class="panel-toggle"
        data-panel-toggle="${escapeAttribute(node.id)}"
        aria-expanded="${isOpen ? "true" : "false"}"
        aria-controls="${escapeAttribute(`${node.id}-content`)}"
      >
        <span class="panel-main">
          <strong class="panel-title">${escapeHtml(node.title)}</strong>
          ${node.summary ? `<span class="panel-summary">${escapeHtml(node.summary)}</span>` : ""}
        </span>
        <span class="panel-icon" aria-hidden="true">${icon}</span>
      </button>
      <div id="${escapeAttribute(`${node.id}-content`)}" class="panel-content${isOpen ? " is-open" : ""}">
        ${node.type === "leaf" ? renderLeafContent(node) : `<div class="panel-children">${childrenHtml}</div>`}
      </div>
    </section>
  `;
}

// Construye la URL de un audio insertando el idioma activo justo tras "audios/":
//   "audios/ciudades/x.mp3"  →  <BASE>audios/<lang>/ciudades/x.mp3
// Así los datos no necesitan saber el idioma: basta con tener los mp3 en
// public/audios/<lang>/… (p. ej. public/audios/es/…). Devuelve "" si no hay ruta.
function audioUrl(src) {
  if (!src) return "";
  const path = src.replace(/^\/+/, "").replace(/^audios\//, `audios/${getLang()}/`);
  return `${import.meta.env.BASE_URL}${path}`;
}

function renderLeafContent(node) {
  const tagsHtml = "";
  const isOpen = expandedPanels.has(node.id);

  const panelSrc = audioUrl(node.audioSrc);

  // Only resolve ambient when open — avoids creating WebMediaPlayers for closed panels.
  // Use ambient when ST is not currently playing; duck ST instead when it is.
  const rawAmbientSrc = (isOpen && !(stAudio && !stAudio.paused)) ? resolveAmbientSrc(node.id) : null;
  const ambientSrc = audioUrl(rawAmbientSrc);

  const descriptionHtml = renderLeafDescription(node);

  let audioHtml;
  if (!panelSrc) {
    audioHtml = `<p class="empty">${escapeHtml(t("player.missingAudio"))}</p>`;
  } else {
    // Only inject <audio> elements when open to stay within the browser's
    // WebMediaPlayer limit (crbug.com/1144736).
    const hiddenAudios = isOpen
      ? (ambientSrc
          ? `<audio preload="metadata" src="${escapeAttribute(ambientSrc)}" data-role="ambient" loop hidden></audio>
         <audio preload="metadata" src="${escapeAttribute(panelSrc)}" data-role="panel" hidden></audio>`
          : `<audio preload="metadata" src="${escapeAttribute(panelSrc)}" data-role="panel" hidden></audio>`)
      : "";

    audioHtml = `
      <div class="custom-player" data-player-id="${escapeAttribute(node.id)}">
        <button type="button" class="player-btn" data-player-play aria-label="${escapeAttribute(t("player.play"))}">${ICONS.play}</button>
        <div class="player-track">
          <input type="range" class="player-seekbar" data-player-seek min="0" max="1000" value="0" step="1" aria-label="${escapeAttribute(t("player.seek"))}" disabled>
          <div class="player-time">
            <span data-player-current>0:00</span>
            <span data-player-total>-:--</span>
          </div>
        </div>
      </div>
      ${hiddenAudios}
    `;
  }

  return `
    <article class="leaf-content">
      ${audioHtml}
      <div class="leaf-description-block">
        ${descriptionHtml}
      </div>
      ${tagsHtml}
    </article>
  `;
}

function renderLeafDescription(node) {
  const hasDescription = Boolean(node.description);
  const isDescriptionRevealed = revealedDescriptions.has(node.id);

  if (!hasDescription) {
    return "";
  }

  const id = escapeAttribute(node.id);

  // Revelado: mantenemos el contenedor; el texto se muestra dentro y un botón
  // superior permite volver a ocultarlo.
  if (isDescriptionRevealed) {
    return `
      <div class="spoiler spoiler--revealed">
        <button
          type="button"
          class="spoiler-toggle-btn"
          data-reveal-description="${id}"
          aria-expanded="true"
        >
          <span class="spoiler-preview-label">${escapeHtml(t("spoiler.hideLabel"))}</span>
          <span class="spoiler-caret" aria-hidden="true">${ICONS.caretUp}</span>
        </button>
        <p class="description leaf-description">${escapeHtml(node.description)}</p>
      </div>
    `;
  }

  // Oculto: toda la caja es pulsable para revelar.
  return `
    <button
      type="button"
      class="spoiler spoiler-preview"
      data-reveal-description="${id}"
      aria-expanded="false"
    >
      <span class="spoiler-preview-label">${escapeHtml(t("spoiler.label"))}</span>
      <span class="spoiler-lines" aria-hidden="true">
        <span class="spoiler-line"></span>
        <span class="spoiler-line"></span>
        <span class="spoiler-line"></span>
      </span>
    </button>
  `;
}

function bindDescriptionRevealEvents() {
  screenEl.querySelectorAll("[data-reveal-description]").forEach((button) => {
    if (button.dataset.bound === "true") return;
    button.dataset.bound = "true";

    button.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      toggleDescription(button.dataset.revealDescription || "");
    });

    button.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      event.stopPropagation();
      toggleDescription(button.dataset.revealDescription || "");
    });
  });
}

function toggleDescription(panelId) {
  if (!panelId) return;

  if (revealedDescriptions.has(panelId)) {
    revealedDescriptions.delete(panelId);
  } else {
    revealedDescriptions.add(panelId);
  }

  saveState();
  updateDescriptionDisplay(panelId);
}

function updateDescriptionDisplay(panelId) {
  const contentEl = document.getElementById(`${panelId}-content`);
  if (!contentEl) return;

  const descriptionBlockEl = contentEl.querySelector(".leaf-description-block");
  if (!descriptionBlockEl) return;

  const node = findNodeById(contentTree, panelId);
  if (!node || node.type !== "leaf") return;

  descriptionBlockEl.innerHTML = renderLeafDescription(node);
  bindDescriptionRevealEvents();
}

function findNodeById(nodes, id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (!node.children.length) continue;

    const found = findNodeById(node.children, id);
    if (found) return found;
  }

  return null;
}

function filterTree(node) {
  if (node.type === "leaf") {
    return matchesFilters(node) ? node : null;
  }

  const visibleChildren = node.children
    .map(filterTree)
    .filter(Boolean);

  if (!visibleChildren.length) {
    return null;
  }

  return {
    ...node,
    children: visibleChildren
  };
}

function matchesFilters(node) {
  const provinciaMatch =
    !selectedProvincia ||
    node.tags.provincia === "all" ||
    node.tags.provincia === selectedProvincia;

  const gremioMatch =
    !selectedGremio ||
    node.tags.gremio === "all" ||
    node.tags.gremio === selectedGremio;

  const searchMatch =
    !cardSearchQuery ||
    nodeMatchesSearch(node, cardSearchQuery);

  return provinciaMatch && gremioMatch && searchMatch;
}

function buildTreeFromStart() {
  const root = appData.start;
  if (!root || !Array.isArray(root.options)) {
    return [];
  }

  return root.options
    .map((option, index) => buildNodeFromOption(option, [], `root-${index}`))
    .filter(Boolean);
}

function buildNodeFromOption(option, parentTags, fallbackId) {
  const inlineAudio = option?.audio || (Array.isArray(option?.audios) && option.audios.length ? option.audios[0] : null);
  const hasInlineLeaf = !!(inlineAudio || option?.leafDescription);
  const nextId = option?.next;
  const nextNode = nextId ? appData[nextId] : null;
  const derivedTags = mergeTags(parentTags, extractTags(option, nextId, nextNode));

  if (hasInlineLeaf) {
    return {
      id: `leaf-${nextId || fallbackId}`,
      type: "leaf",
      title: option.label || nextId || fallbackId,
      summary: option.description || "",
      contentTitle: "",
      description: option.leafDescription || option.description || "",
      audioSrc: inlineAudio?.src || "",
      tags: derivedTags,
      children: []
    };
  }

  if (!nextId || !nextNode) {
    return {
      id: `leaf-${fallbackId}`,
      type: "leaf",
      title: option?.label || fallbackId,
      summary: option?.description || "",
      contentTitle: "",
      description: "",
      audioSrc: "",
      tags: derivedTags,
      children: []
    };
  }

  if (Array.isArray(nextNode.options) && nextNode.options.length) {
    const children = nextNode.options
      .map((childOption, index) => buildNodeFromOption(childOption, derivedTags, `${nextId}-${index}`))
      .filter(Boolean);

    return {
      id: `group-${nextId}`,
      type: "group",
      title: option.label || nextNode.title || nextId,
      summary: option.description || nextNode.description || "",
      children,
      tags: derivedTags
    };
  }

  const audioData = nextNode.audio || (Array.isArray(nextNode.audios) && nextNode.audios[0]) || null;

  return {
    id: `leaf-${nextId || fallbackId}`,
    type: "leaf",
    title: option.label || nextNode.title || nextId,
    summary: option.description || "",
    contentTitle: nextNode.title || "",
    description: nextNode.description || "",
    audioSrc: audioData?.src || "",
    tags: derivedTags,
    children: []
  };
}

function mergeTags(parentTags, ownTags) {
  return {
    provincia: ownTags.provincia || parentTags.provincia || "",
    gremio: ownTags.gremio || parentTags.gremio || ""
  };
}

function extractTags(option, nextId, nextNode) {
  const text = [
    option?.label || "",
    option?.description || "",
    option?.leafDescription || "",
    nextNode?.title || "",
    nextNode?.description || "",
    nextId || ""
  ].join(" ").toLowerCase();

  const explicitProvincia = normalizeProvinciaTag(option?.provinciaTag || option?.provincia || "");
  const explicitGremio = normalizeGremioTag(option?.gremioTag || option?.gremio || "");

  return {
    provincia: explicitProvincia || inferProvinciaFromText(text),
    gremio: explicitGremio || inferGremioFromText(text)
  };
}

function normalizeProvinciaTag(value) {
  const v = String(value || "").trim().toLowerCase();
  if (
    v === "all" ||
    v === "cienaga_negra" ||
    v === "skyrim" ||
    v === "roca_alta" ||
    v === "morrowind" ||
    v === "cyrodiil"
  ) {
    return v;
  }
  return "";
}

function normalizeGremioTag(value) {
  const v = String(value || "").trim().toLowerCase();
  if (
    v === "all" ||
    v === "ladrones" ||
    v === "magos" ||
    v === "luchadores" ||
    v === "hermandad_oscura" ||
    v === "intrepidos" ||
    v === "guardia_exterior" ||
    v === "ojos_reina" ||
    v === "orden_psijic" || 
    v === "circulo_campeones"
  ) {
    return v;
  }
  return "";
}

function inferProvinciaFromText(text) {
  if (!text) return "";
  if (text.includes("cn-") || text.includes("_cn_") || text.includes("cienaga negra") || text.includes("ciénaga negra")) return "cienaga_negra";
  if (text.includes("sk-") || text.includes("_sk_") || text.includes("skyrim")) return "skyrim";
  if (text.includes("ra-") || text.includes("_ra_") || text.includes("roca alta") || text.includes("wrothgar")) return "roca_alta";
  if (text.includes("morrowind")) return "morrowind";
  if (text.includes("cyrodiil") || text.includes("leyawiin")) return "cyrodiil";
  return "";
}

function inferGremioFromText(text) {
  if (!text) return "";
  if (text.includes("gremio de ladrones")) return "ladrones";
  if (text.includes("gremio de magos")) return "magos";
  if (text.includes("gremio de luchadores")) return "luchadores";
  if (text.includes("hermandad oscura")) return "hermandad_oscura";
  if (text.includes("intrépidos") || text.includes("intrepidos")) return "intrepidos";
  if (text.includes("guardia exterior")) return "guardia_exterior";
  return "";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}