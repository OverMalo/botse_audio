import "./styles.css";
import appData from "./data.json";

const screenEl = document.getElementById("screen");
const backBtn = document.getElementById("backBtn");
const homeBtn = document.getElementById("homeBtn");

function loadState() {
  try {
    const saved = sessionStorage.getItem("navState");
    if (saved) return JSON.parse(saved);
  } catch {}
  return { currentScreenId: "start", historyStack: [], pathLabels: [] };
}

function saveState() {
  sessionStorage.setItem("navState", JSON.stringify({ currentScreenId, historyStack, pathLabels }));
}

const state = loadState();
let currentScreenId = state.currentScreenId;
let historyStack = state.historyStack;
let pathLabels = state.pathLabels;

registerServiceWorker();
render();

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

        registration.update();
        console.log("Service worker registrado");
      } catch (error) {
        console.error("Error registrando service worker:", error);
      }
    });
  }
}

function render() {
  const node = appData[currentScreenId];
  backBtn.disabled = historyStack.length === 0;

  if (!node) {
    screenEl.innerHTML = `
      <h2>Pantalla no encontrada</h2>
      <p class="description">El identificador <strong>${escapeHtml(currentScreenId)}</strong> no existe.</p>
    `;
    return;
  }

  if (node.audio || (Array.isArray(node.audios) && node.audios.length > 0)) {
    renderFinal(node);
    return;
  }

  renderOptions(node);
}

function renderOptions(node) {
  const hasOptions = Array.isArray(node.options) && node.options.length > 0;

  const optionsHtml = hasOptions
    ? node.options
        .map(
          (option) => `
            <button
              class="option-card${option.color ? ` option-card--${escapeAttribute(option.color)}` : ''}"
              data-next="${escapeAttribute(option.next)}"
              data-label="${escapeAttribute(option.label)}"
            >
              <div>
                <strong>${escapeHtml(option.label)}</strong>
                <span>${escapeHtml(option.description || "")}</span>
              </div>
            </button>
          `
        )
        .join("")
    : `<div class="empty-screen">Esta pantalla todavía no tiene opciones definidas.</div>`;

  screenEl.innerHTML = `
    <h2>${escapeHtml(node.title)}</h2>
    <p class="description">${escapeHtml(node.description || "")}</p>
    <div class="grid">${optionsHtml}</div>
  `;

  screenEl.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      historyStack.push(currentScreenId);
      pathLabels.push(button.dataset.label || "");
      currentScreenId = button.dataset.next;
      saveState();
      render();
    });
  });
}

function renderFinal(node) {
  const breadcrumb = pathLabels.length ? pathLabels.join(" → ") : "Acceso directo";

  const audioList = Array.isArray(node.audios) && node.audios.length > 0
    ? node.audios
    : node.audio
      ? [
          {
            ...node.audio,
            description: node.description || "",
            itemTitle: node.title || ""
          }
        ]
      : [];

  const audioPanelsHtml = audioList.length
    ? audioList
        .map((audioItem, index) => {
          const audioSrc = audioItem?.src
            ? `${import.meta.env.BASE_URL}${audioItem.src.replace(/^\/+/, "")}`
            : "";

          const audioTitle =
            audioItem?.title?.trim() ||
            audioItem?.itemTitle?.trim() ||
            node.title ||
            ``;

          return `
            <div class="audio-entry">
              <div class="audio-panel">
                <strong class="audio-title">${audioTitle}</strong>
                <audio controls preload="none" src="${escapeAttribute(audioSrc)}"></audio>
                ${audioItem.description
                  ? `<p class="description audio-description">${escapeHtml(audioItem.description)}</p>`
                  : ""}
                ${audioSrc ? "" : '<p class="empty">Falta definir la ruta del audio.</p>'}
              </div>
            </div>
          `;
        })
        .join("")
    : `<p class="empty">No hay audios definidos para esta pantalla.</p>`;

  screenEl.innerHTML = `
    <div class="final-box">
      <div class="path">${escapeHtml(breadcrumb)}</div>
      <div class="audio-list">
        ${audioPanelsHtml}
      </div>
    </div>
  `;
}

function goBack() {
  if (!historyStack.length) return;
  currentScreenId = historyStack.pop();
  pathLabels.pop();
  saveState();
  render();
}

function goHome() {
  currentScreenId = "start";
  historyStack = [];
  pathLabels = [];
  saveState();
  render();
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

backBtn.addEventListener("click", goBack);
homeBtn.addEventListener("click", goHome);