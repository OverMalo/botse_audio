import "./styles.css";
import appData from "./data.json";

const screenEl = document.getElementById("screen");

const FILTER_OPTIONS = {
  provincias: [
    { id: "cienaga_negra", label: "Ciénaga Negra" },
    { id: "skyrim", label: "Skyrim" },
    { id: "roca_alta", label: "Roca Alta" },
    { id: "morrowind", label: "Morrowind" },
    { id: "cyrodiil", label: "Cyrodiil" }
  ],
  gremios: [
    { id: "circulo_campeones", label: "Círculo de Campeones" },
    { id: "ladrones", label: "Gremio de ladrones" },
    { id: "luchadores", label: "Gremio de luchadores" },
    { id: "magos", label: "Gremio de magos" },
    { id: "guardia_exterior", label: "Guardia exterior" },
    { id: "hermandad_oscura", label: "Hermandad Oscura" },
    { id: "intrepidos", label: "Intrépidos" },
    { id: "ojos_reina", label: "Ojos de la Reina" },
    { id: "orden_psijic", label: "Orden Psijic" }
  ]
};

const PROVINCIA_LABELS = Object.fromEntries(
  FILTER_OPTIONS.provincias.map((item) => [item.id, item.label])
);

const GREMIO_LABELS = Object.fromEntries(
  FILTER_OPTIONS.gremios.map((item) => [item.id, item.label])
);

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
    playbackRate: 1,
    ambientEnabled: true,
    provinciaCollapsed: false,
    gremioCollapsed: false
  };
}

function saveState() {
  localStorage.setItem(
    "navState",
    JSON.stringify({
      selectedProvincia,
      selectedGremio,
      expandedPanels: [...expandedPanels],
      revealedDescriptions: [...revealedDescriptions],
      autoPlay,
      playbackRate,
      ambientEnabled,
      provinciaCollapsed,
      gremioCollapsed
    })
  );
}

const state = loadState();
let selectedProvincia = typeof state.selectedProvincia === "string" ? state.selectedProvincia : "";
let selectedGremio = typeof state.selectedGremio === "string" ? state.selectedGremio : "";
let expandedPanels = new Set(Array.isArray(state.expandedPanels) ? state.expandedPanels : []);
let revealedDescriptions = new Set(Array.isArray(state.revealedDescriptions) ? state.revealedDescriptions : []);
let autoPlay = typeof state.autoPlay === "boolean" ? state.autoPlay : true;
let playbackRate = [1, 1.15, 1.25, 1.5].includes(state.playbackRate) ? state.playbackRate : 1;
let ambientEnabled = typeof state.ambientEnabled === "boolean" ? state.ambientEnabled : true;
let provinciaCollapsed = typeof state.provinciaCollapsed === "boolean" ? state.provinciaCollapsed : false;
let gremioCollapsed = typeof state.gremioCollapsed === "boolean" ? state.gremioCollapsed : false;

/** @type {null | { rafId: number, panelEl: HTMLAudioElement, ambientEl: HTMLAudioElement|null, hasAmbient: boolean, totalDuration: number, playerEl: HTMLElement, isSeeking: boolean }} */
let activePlayer = null;

const contentTree = buildTreeFromStart();
const accordionIndex = buildAccordionIndex(contentTree);

let swRegistration = null;

registerServiceWorker();
render();

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    if (activePlayer?.playing) {
      activePlayer.pausedByVisibility = true;
      pauseActivePlayerInternal();
    }
  } else if (document.visibilityState === "visible") {
    if (activePlayer?.pausedByVisibility) {
      activePlayer.pausedByVisibility = false;
      resumeActivePlayerInternal();
    }
  }
});

window.addEventListener("pagehide", () => {
  if (activePlayer?.playing) pauseActivePlayerInternal();
});

function registerServiceWorker() {
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
  let bodyHtml;
  if (!selectedProvincia) {
    bodyHtml = '<div class="empty-screen">Selecciona una provincia para ver el contenido.</div>';
  } else {
    const filteredRoots = contentTree
      .map(filterTree)
      .filter(Boolean);

    bodyHtml = filteredRoots.length
      ? filteredRoots.map((node) => renderPanel(node, 0)).join("")
      : '<div class="empty-screen">No hay paneles que coincidan con los filtros seleccionados.</div>';
  }

  screenEl.innerHTML = `
    <div class="single-screen-head">
      <h2>The Elders Scroll: La traición de la segunda era</h2>
      <p class="description">Explora categorías y despliega cada panel para ver su contenido.</p>
      ${renderFilters()}
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

function renderFilters() {
  const provinciaLabel = selectedProvincia
    ? PROVINCIA_LABELS[selectedProvincia]
    : null;
  const gremioLabel = selectedGremio
    ? GREMIO_LABELS[selectedGremio]
    : null;

  return `
    <div class="filters-panel">
      <div class="filter-group filter-group--collapsible${provinciaCollapsed ? " filter-group--collapsed" : ""}" role="group" aria-label="">
        <button
          type="button"
          class="filter-group-toggle"
          data-filter-collapse="provincia"
          aria-expanded="${provinciaCollapsed ? "false" : "true"}"
        >
          <span class="filter-group-main">
            <span class="filter-group-selected">${provinciaLabel ? escapeHtml(provinciaLabel) : "Selecciona una provincia"}</span>
            ${provinciaLabel ? "<span class=\"filter-group-label\"></span>" : ""}
          </span>
          <span class="panel-icon" aria-hidden="true">${provinciaCollapsed ? "+" : "−"}</span>
        </button>
        <div class="filter-group-body${provinciaCollapsed ? " is-hidden" : ""}">
          <div class="filter-options">
            ${FILTER_OPTIONS.provincias.map((item) => renderCheckable("provincia", item.id, item.label, selectedProvincia === item.id)).join("")}
          </div>
        </div>
      </div>
      <div class="filter-group filter-group--collapsible${gremioCollapsed ? " filter-group--collapsed" : ""}" role="group" aria-label="">
        <button
          type="button"
          class="filter-group-toggle"
          data-filter-collapse="gremio"
          aria-expanded="${gremioCollapsed ? "false" : "true"}"
        >
          <span class="filter-group-main">
            <span class="filter-group-selected">${gremioLabel ? escapeHtml(gremioLabel) : "Selecciona un gremio"}</span>
            ${gremioLabel ? "<span class=\"filter-group-label\"></span>" : ""}
          </span>
          <span class="panel-icon" aria-hidden="true">${gremioCollapsed ? "+" : "−"}</span>
        </button>
        <div class="filter-group-body${gremioCollapsed ? " is-hidden" : ""}">
          <div class="filter-options">
            ${FILTER_OPTIONS.gremios.map((item) => renderCheckable("gremio", item.id, item.label, selectedGremio === item.id)).join("")}
          </div>
        </div>
      </div>
    </div>
    <div class="config-panel">
      <div class="filter-group config-group" role="group" aria-label="Configuración de reproducción">
        <p class="filter-group-title">Reproducción</p>
        <div class="config-group-body">
          <label class="autoplay-label">
            <input
              type="checkbox"
              id="autoplay-checkbox"
              class="autoplay-checkbox"
              ${autoPlay ? "checked" : ""}
            />
            <span>Auto-play</span>
          </label>
          <label class="autoplay-label">
            <input
              type="checkbox"
              id="ambient-checkbox"
              class="autoplay-checkbox"
              ${ambientEnabled ? "checked" : ""}
            />
            <span>Audio ambiente</span>
          </label>
          <div class="filter-options">
            ${[1, 1.15, 1.25, 1.5].map((rate) => {
              const active = playbackRate === rate;
              const label = rate === 1 ? "1x" : `${rate.toFixed(2)}x`;
              return `<button
                type="button"
                class="checkable-chip${active ? " checkable-chip--active" : ""}"
                data-config-rate="${rate}"
                aria-pressed="${active ? "true" : "false"}"
              ><span class="checkable-chip-mark" aria-hidden="true">${active ? "●" : "○"}</span><span>${label}</span></button>`;
            }).join("")}
          </div>
        </div>
      </div>
    </div>
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
      <span class="checkable-chip-mark" aria-hidden="true">${checked ? "●" : "○"}</span>
      <span>${escapeHtml(label)}</span>
    </button>
  `;
}

function bindConfigEvents() {
  const checkbox = screenEl.querySelector("#autoplay-checkbox");
  if (checkbox) {
    checkbox.addEventListener("change", () => {
      autoPlay = checkbox.checked;
      saveState();
    });
  }

  const ambientCheckbox = screenEl.querySelector("#ambient-checkbox");
  if (ambientCheckbox) {
    ambientCheckbox.addEventListener("change", () => {
      ambientEnabled = ambientCheckbox.checked;
      stopActivePlayer();
      saveState();
      render();
    });
  }

  screenEl.querySelectorAll("[data-config-rate]").forEach((button) => {
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

      screenEl.querySelectorAll("[data-config-rate]").forEach((btn) => {
        const btnRate = parseFloat(btn.dataset.configRate);
        const active = playbackRate === btnRate;
        btn.classList.toggle("checkable-chip--active", active);
        btn.setAttribute("aria-pressed", active ? "true" : "false");
        btn.querySelector(".checkable-chip-mark").textContent = active ? "●" : "○";
      });
    });
  });
}

function bindFilterEvents() {
  screenEl.querySelectorAll("[data-filter-collapse]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = button.dataset.filterCollapse;
      if (target === "provincia") provinciaCollapsed = !provinciaCollapsed;
      if (target === "gremio") gremioCollapsed = !gremioCollapsed;
      saveState();
      render();
    });
  });

  screenEl.querySelectorAll("[data-filter-type]").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.filterType;
      const value = button.dataset.filterValue;
      if (!type || !value) return;

      if (type === "provincia") {
        selectedProvincia = selectedProvincia === value ? "" : value;
      }

      if (type === "gremio") {
        selectedGremio = selectedGremio === value ? "" : value;
      }

      saveState();
      render();
    });
  });
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

function stopActivePlayer() {
  if (!activePlayer) return;
  cancelAnimationFrame(activePlayer.rafId);
  activePlayer.rafId = 0;
  activePlayer.playing = false;
  activePlayer.panelEl.pause();
  if (activePlayer.ambientEl) activePlayer.ambientEl.pause();
  if ("mediaSession" in navigator) {
    navigator.mediaSession.metadata = null;
    navigator.mediaSession.playbackState = "none";
  }
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
  btn.innerHTML = isPlaying ? "&#9646;&#9646;" : "&#9654;";
  btn.classList.toggle("player-btn--playing", isPlaying);
  btn.setAttribute("aria-label", isPlaying ? "Pausar" : "Reproducir");
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
    pausedByVisibility: false,
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
    if (document.visibilityState !== "visible") return;
    panelEl.play().catch(() => {});
  });

  // Register MediaSession metadata and action handlers for OS media controls
  if ("mediaSession" in navigator) {
    const title = contentEl.closest(".panel")?.querySelector(".panel-title")?.textContent?.trim() || "BOTSE Audio";
    navigator.mediaSession.metadata = new MediaMetadata({ title, artist: "BOTSE" });
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
        return;
      }
      if (p.panelEl.paused) {
        p.panelEl.play().catch(() => {});
        p.rafId = requestAnimationFrame(playerRaf);
        setPlayerBtnState(playerEl, true);
        p.playing = true;
        updateMediaSession(true);
      } else {
        p.playing = false;
        p.panelEl.pause();
        cancelAnimationFrame(p.rafId);
        p.rafId = 0;
        setPlayerBtnState(playerEl, false);
        updateMediaSession(false);
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
  const icon = isOpen ? "−" : "+";
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

function renderLeafContent(node) {
  const tagsHtml = "";

  const panelSrc = node.audioSrc
    ? `${import.meta.env.BASE_URL}${node.audioSrc.replace(/^\/+/, "")}`
    : "";

  const rawAmbientSrc = ambientEnabled ? resolveAmbientSrc(node.id) : null;
  const ambientSrc = rawAmbientSrc
    ? `${import.meta.env.BASE_URL}${rawAmbientSrc.replace(/^\/+/, "")}`
    : null;

  const descriptionHtml = renderLeafDescription(node);

  let audioHtml;
  if (!panelSrc) {
    audioHtml = '<p class="empty">Falta definir la ruta del audio.</p>';
  } else {
    const hiddenAudios = ambientSrc
      ? `<audio preload="metadata" src="${escapeAttribute(ambientSrc)}" data-role="ambient" loop hidden></audio>
         <audio preload="metadata" src="${escapeAttribute(panelSrc)}" data-role="panel" hidden></audio>`
      : `<audio preload="metadata" src="${escapeAttribute(panelSrc)}" data-role="panel" hidden></audio>`;

    audioHtml = `
      <div class="custom-player" data-player-id="${escapeAttribute(node.id)}">
        <button type="button" class="player-btn" data-player-play aria-label="Reproducir">&#9654;</button>
        <div class="player-track">
          <input type="range" class="player-seekbar" data-player-seek min="0" max="1000" value="0" step="1" disabled>
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

  if (isDescriptionRevealed) {
    return `<p class="description leaf-description">${escapeHtml(node.description)}</p>`;
  }

  return `
    <button
      type="button"
      class="spoiler-preview"
      data-reveal-description="${escapeAttribute(node.id)}"
      aria-expanded="false"
    >
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

  return provinciaMatch && gremioMatch;
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