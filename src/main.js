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
    const saved = sessionStorage.getItem("navState");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    selectedProvincia: "",
    selectedGremio: "",
    revealedDescriptions: []
  };
}

function saveState() {
  sessionStorage.setItem(
    "navState",
    JSON.stringify({
      selectedProvincia,
      selectedGremio,
      expandedPanels: [...expandedPanels],
      revealedDescriptions: [...revealedDescriptions]
    })
  );
}

const state = loadState();
let selectedProvincia = typeof state.selectedProvincia === "string" ? state.selectedProvincia : "";
let selectedGremio = typeof state.selectedGremio === "string" ? state.selectedGremio : "";
let expandedPanels = new Set(Array.isArray(state.expandedPanels) ? state.expandedPanels : []);
let revealedDescriptions = new Set(Array.isArray(state.revealedDescriptions) ? state.revealedDescriptions : []);

const contentTree = buildTreeFromStart();
const accordionIndex = buildAccordionIndex(contentTree);

let swRegistration = null;

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
  bindPanelEvents();
  bindDescriptionRevealEvents();
}

function renderFilters() {
  return `
    <div class="filters-panel">
      <div class="filter-group" role="group" aria-label="Provincia seleccionada">
        <p class="filter-group-title">Provincia seleccionada</p>
        <div class="filter-options">
          ${FILTER_OPTIONS.provincias.map((item) => renderCheckable("provincia", item.id, item.label, selectedProvincia === item.id)).join("")}
        </div>
      </div>
      <div class="filter-group" role="group" aria-label="Gremio seleccionado">
        <p class="filter-group-title">Gremio seleccionado</p>
        <div class="filter-options">
          ${FILTER_OPTIONS.gremios.map((item) => renderCheckable("gremio", item.id, item.label, selectedGremio === item.id)).join("")}
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

function bindFilterEvents() {
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
      const audioEl = contentEl?.querySelector("audio");
      if (audioEl) audioEl.play().catch(() => {});
    }
  }
}

function collapseBranch(panelId) {
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

  const audioSrc = node.audioSrc
    ? `${import.meta.env.BASE_URL}${node.audioSrc.replace(/^\/+/, "")}`
    : "";

  const descriptionHtml = renderLeafDescription(node);

  return `
    <article class="leaf-content">
      ${audioSrc
        ? `<audio controls preload="none" src="${escapeAttribute(audioSrc)}"></audio>`
        : '<p class="empty">Falta definir la ruta del audio.</p>'}
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