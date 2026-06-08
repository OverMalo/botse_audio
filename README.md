# The Elder Scrolls — Voice Over (BOTSE Audio)

Aplicación de acompañamiento para el juego de mesa **The Elder Scrolls: La traición de la segunda era** · A companion app for the **The Elder Scrolls: Betrayal of the Second Era** board game.

## Índice · Table of contents

**Español** — [Qué es](#qué-es) · [Características](#características) · [Cómo instalar la app](#cómo-instalar-la-app) · [Añadir un idioma nuevo](#cómo-añadir-un-idioma-nuevo) · [Añadir contenido nuevo](#cómo-añadir-contenido-nuevo) · [Desarrollo](#desarrollo) · [Estructura del proyecto](#estructura-del-proyecto)

**English** — [What it is](#what-it-is) · [Features](#features) · [Installing the app](#installing-the-app) · [Adding a new language](#adding-a-new-language) · [Adding new content](#adding-new-content) · [Development](#development) · [Project structure](#project-structure)

---

# Español

## Qué es

Narra en voz alta los textos de ciudades, misiones y encuentros de cada provincia de Tamriel, para que el grupo se sumerja en la historia sin tener que leer en voz alta.

Es una aplicación web instalable (PWA): funciona en el navegador y también puede instalarse como una app que funciona **sin conexión**.

## Características

- 🔊 Narración por voz de ciudades, misiones y encuentros, organizada por provincia.
- 🧭 Filtros por provincia y por gremio.
- ▶️ Reproducción automática (auto-play) al abrir cada texto.
- ⏩ Velocidad de narración ajustable (de 1x a 1,5x).
- 🎵 Banda sonora original con reproductor integrado, siempre disponible en la barra superior.
- 🔒 Controles multimedia del sistema (pantalla de bloqueo / auriculares).
- 🌐 Multi-idioma (de momento, Español).
- 📥 Funciona sin conexión una vez instalada (PWA).
- ♿ Accesible (objetivo WCAG 2.1 AA): foco visible, contraste, etiquetas, etc.

## Cómo instalar la app

No hace falta ninguna tienda de aplicaciones. Se instala desde el propio navegador.

### En ordenador (Chrome o Edge)

1. Abre la página de la app en el navegador.
2. En la barra de direcciones, a la derecha, aparece un icono de **instalar** (un monitor con una flecha ⤓, o un icono ⊕).
3. Haz clic en él y confirma **«Instalar»**.
4. La app se abre en su propia ventana y queda como un programa más (menú Inicio / escritorio).

> Si no ves el icono: abre el menú **⋮** (arriba a la derecha) → **«Instalar [nombre de la app]…»** o **«Aplicaciones» → «Instalar este sitio como aplicación»**.

### En Android (Chrome)

1. Abre la página en Chrome.
2. Toca el menú **⋮** (arriba a la derecha).
3. Toca **«Instalar aplicación»** o **«Añadir a la pantalla de inicio»** y confirma.

### En iPhone / iPad (Safari)

1. Abre la página en **Safari** (en iOS la instalación solo funciona desde Safari).
2. Toca el botón **Compartir** (el cuadrado con la flecha hacia arriba).
3. Desplázate y toca **«Añadir a pantalla de inicio»** y confirma.

### Uso sin conexión

Tras instalarla y abrirla una vez con internet, la app guarda lo necesario para funcionar offline. La **banda sonora** se descarga la primera vez que la activas (verás una barra de progreso); a partir de ahí suena sin conexión.

## Cómo añadir un idioma nuevo

La app está preparada para tener varios idiomas. Cada idioma vive en **su propia carpeta** y es independiente. Esta guía está pensada para que cualquiera pueda hacerlo, sin ser programador/a. Usaremos el **inglés** como ejemplo (código `en`).

> 💡 **Idea clave:** un idioma = una carpeta dentro de `src/i18n/` + una carpeta de audios dentro de `public/audios/`. Copias las del español, traduces los textos y pones los audios. Nada más.

### Paso 1 — Copia la carpeta del español

Dentro de `src/i18n/` verás la carpeta `es`. **Cópiala y pega la copia con el nuevo código de idioma** (en minúsculas):

```
src/i18n/es   →   copiar y renombrar a   →   src/i18n/en
```

Dentro encontrarás estos archivos (los mismos que tendrás que adaptar):

| Archivo | Qué contiene |
|---|---|
| `ui.json` | Los textos de los **botones y menús** (Inicio, Provincia, Reproducción…). |
| `manifest.json` | El **nombre y la descripción** de la app cuando se instala. |
| `soundtrack.json` | Los **títulos** de las pistas de música. |
| `data/` | Todo el **contenido narrado**: nombres y textos de ciudades, misiones, encuentros… |
| `index.js` | Un archivo técnico. **No hay que tocarlo** (ya viene listo en la copia). |

### Paso 2 — Traduce los textos

Abre los archivos `.json` con un editor de texto (el Bloc de notas vale) y **traduce solo lo que va entre comillas** después de los dos puntos.

Ejemplo en `ui.json`:

```json
"home": "Inicio",        →   "home": "Home",
"provincia": "Provincia" →   "provincia": "Province"
```

En la carpeta `data/`, traduce los campos de texto: `label`, `description`, `leafDescription` y `title`.

> ⚠️ **Muy importante: NO cambies estas cosas** (son “tuercas y tornillos” internos; si las tocas, la app deja de funcionar):
> - Las **palabras a la izquierda** de los dos puntos (`"home":`, `"label":`…).
> - Los campos `next`, `id`, `provinciaTag`, `gremioTag`.
> - El campo `src` dentro de `audio` (la ruta del sonido).
> - Los símbolos `{ } [ ] , "`.

### Paso 3 — Pon los audios del nuevo idioma

Los audios se guardan por idioma en `public/audios/`. Verás que ya existe `public/audios/es/`.

**Crea una carpeta con el código del idioma** y copia dentro los audios traducidos, **respetando exactamente la misma estructura de carpetas y los mismos nombres de archivo** que en español:

```
public/audios/es/ciudades/cienaga_negra/caravana_viajera.mp3
public/audios/en/ciudades/cienaga_negra/caravana_viajera.mp3   ← mismo nombre, voz en inglés
```

> No hace falta cambiar nada en los textos para los audios: la app busca automáticamente el audio en la carpeta del idioma activo.

### Paso 4 — Activa el idioma en el selector

Abre el archivo `src/i18n.js`. Busca estas dos listas y **añade el nuevo idioma** (verás que el inglés ya está de ejemplo, comentado con `//`; basta con quitar las `//`):

```js
export const LANGUAGES = [
  { code: "es", label: "ESP", name: "Español" },
  { code: "en", label: "ENG", name: "English" },   // ← añade esta línea
];

import en from "./i18n/en/index.js";   // ← añade este import arriba, junto al de "es"

const LOCALES = {
  es,
  en,   // ← añade esta línea
};
```

- `code`: el código corto del idioma (`en`, `fr`, `de`…). Debe coincidir con el nombre de la carpeta.
- `label`: las 3 letras que se ven en el botón (ESP, ENG…).
- `name`: el nombre del idioma en su propio idioma (English, Français…).

### Paso 5 — Comprueba que todo está bien

En una terminal, dentro del proyecto, ejecuta:

```bash
npm test
```

La prueba revisará automáticamente que el idioma nuevo no tenga textos sin traducir ni archivos que falten, y te avisará si algo está mal. Cuando salga **«todas las comprobaciones han pasado»**, ya está. ✅

## Cómo añadir contenido nuevo

Cada texto narrado tiene **dos piezas**: la **entrada** (el título y el texto, en un archivo `.json`) y el **audio** (un `.mp3`). Esta guía explica cómo añadir uno nuevo. Usaremos el español (`es`) como ejemplo.

### Paso 1 — Elige el archivo de la entrada

El contenido vive en `src/i18n/es/data/`. Según el tipo, edita el archivo correspondiente:

| Tipo de contenido | Archivo |
|---|---|
| Ciudades | `ciudades/<provincia>.json` |
| Misiones | `misiones/<provincia>.json` |
| Encuentros generales | `encuentros_generales.json` |
| Encuentros provinciales | `encuentros_provinciales.json` |
| Sesión final | `sesion_final/<provincia>.json` |

(`<provincia>` es `cienaga_negra`, `skyrim`, `roca_alta`, `morrowind` o `cyrodiil`.)

### Paso 2 — Añade la entrada

Abre el archivo y **copia una entrada que ya exista**, pégala como una más en la lista (separada por una coma) y cambia sus valores. Una entrada es así:

```json
{
  "label": "Caravana viajera",
  "description": "",
  "leafDescription": "El clima hostil de Ciénaga Negra y su entorno aún más hostil hacen que sea muy difícil viajar por ella...",
  "audio": { "src": "audios/ciudades/cienaga_negra/caravana_viajera.mp3", "title": "" },
  "provinciaTag": "cienaga_negra",
  "gremioTag": "all"
}
```

Qué significa cada campo:

| Campo | Para qué sirve |
|---|---|
| `label` | Título corto que se ve en el panel. |
| `description` | Subtítulo o pista bajo el título (puede dejarse vacío: `""`). |
| `leafDescription` | El **texto de la narración** (lo que se muestra al pulsar «mostrar el texto»). |
| `audio.src` | Ruta del audio **sin el idioma** (empieza por `audios/…`). La app le añade el idioma sola. |
| `audio.title` | Normalmente vacío (`""`). |
| `provinciaTag` | Provincia para el filtro lateral. |
| `gremioTag` | Gremio para el filtro. Usa `"all"` si debe salir con cualquier gremio. |

> ⚠️ Cuida la sintaxis: cada campo entre comillas, separados por comas, y la entrada anterior debe terminar en `,` antes de la nueva. Si algo se rompe, suele ser una coma o una comilla de más o de menos.
>
> Valores de `gremioTag`: `circulo_campeones`, `ladrones`, `luchadores`, `magos`, `guardia_exterior`, `hermandad_oscura`, `intrepidos`, `ojos_reina`, `orden_psijic` o `all`.

### Paso 3 — Pon el archivo de audio

El audio va en `public/audios/<idioma>/…`, en **la misma ruta que pusiste en `audio.src`**, pero dentro de la carpeta del idioma. Es decir: quita `audios/` del principio y mételo en `public/audios/es/`:

```
audio.src:  "audios/misiones/skyrim/a37.mp3"
archivo:     public/audios/es/misiones/skyrim/a37.mp3
```

Crea las carpetas que falten respetando los nombres. (Si la app tiene varios idiomas, pon el audio correspondiente en la carpeta de cada uno: `public/audios/en/…`, etc.)

### Paso 4 — Compruébalo

```bash
npm run dev
```

Abre la app, ve a la provincia/sección correspondiente y verás tu nueva entrada. Pulsa play para oír el audio y «mostrar el texto» para leer la narración. Ejecuta también `npm test` para verificar que la estructura sigue siendo correcta.

> Si la entrada aparece pero al dar a play dice «Falta definir la ruta del audio» o no suena, revisa que la ruta de `audio.src` y la ubicación real del `.mp3` coincidan exactamente (mismas carpetas y mismo nombre, sin mayúsculas/espacios de más).

## Desarrollo

Requiere [Node.js](https://nodejs.org/).

```bash
npm install     # instalar dependencias (solo la primera vez)
npm run dev     # arrancar en modo desarrollo (http://localhost:5174/botse_audio/)
npm run build   # generar la versión de producción en dist/
npm run preview # previsualizar la versión de producción
npm test        # comprobaciones de i18n (idiomas, claves, estructura)
```

> Todos los textos de la interfaz viven en los `.json` de i18n. El HTML (`index.html`) solo contiene los textos de **arranque** en español (primer pintado / sin JS); `main.js` los reemplaza por los de i18n en cuanto carga y al cambiar de idioma.

## Estructura del proyecto

```
public/
  audios/<idioma>/…      audios narrados, una carpeta por idioma (es, en…)
  icons/                 iconos de la PWA
  manifest.webmanifest   manifest por defecto (español, instalable)
  sw.js                  service worker (offline; solo activo en producción)
src/
  main.js                lógica de la app
  styles.css             estilos
  i18n.js                registro de idiomas (t(), getContent(), LANGUAGES)
  i18n/
    compose.js           compone el contenido (orden de provincias)
    es/                  ← un idioma = una carpeta
      index.js           junta todo el idioma
      ui.json            textos de interfaz
      manifest.json      metadatos de la PWA
      soundtrack.json    títulos de la banda sonora
      data/              contenido narrado (ciudades, misiones, encuentros…)
scripts/
  i18n-check.cjs         prueba que valida los idiomas (npm test)
```

---

# English

## What it is

It reads aloud the texts of cities, quests and encounters of every province of Tamriel, so the group can immerse themselves in the story without having to read out loud.

It is an installable web app (PWA): it runs in the browser and can also be installed as an app that works **offline**.

## Features

- 🔊 Voice narration of cities, quests and encounters, organised by province.
- 🧭 Filters by province and by guild.
- ▶️ Automatic playback (auto-play) when you open each text.
- ⏩ Adjustable narration speed (from 1x to 1.5x).
- 🌲 Immersive ambient audio per scenario.
- 🎵 Original soundtrack with a built-in player, always available in the top bar.
- 🔒 System media controls (lock screen / headphones).
- 🌐 Multi-language (Spanish for now).
- 📥 Works offline once installed (PWA).
- ♿ Accessible (WCAG 2.1 AA goal): visible focus, contrast, labels, etc.

## Installing the app

No app store needed. You install it straight from the browser.

### On desktop (Chrome or Edge)

1. Open the app's page in the browser.
2. On the right of the address bar an **install** icon appears (a monitor with an arrow ⤓, or a ⊕ icon).
3. Click it and confirm **“Install”**.
4. The app opens in its own window and behaves like any other program (Start menu / desktop).

> If you don't see the icon: open the **⋮** menu (top right) → **“Install [app name]…”** or **“Apps” → “Install this site as an app”**.

### On Android (Chrome)

1. Open the page in Chrome.
2. Tap the **⋮** menu (top right).
3. Tap **“Install app”** or **“Add to Home screen”** and confirm.

### On iPhone / iPad (Safari)

1. Open the page in **Safari** (on iOS, install only works from Safari).
2. Tap the **Share** button (the square with an upward arrow).
3. Scroll down and tap **“Add to Home Screen”** and confirm.

### Offline use

After installing it and opening it once with internet, the app stores what it needs to work offline. The **soundtrack** is downloaded the first time you turn it on (you'll see a progress bar); from then on it plays offline.

## Adding a new language

The app is ready to support several languages. Each language lives in **its own folder** and is independent. This guide is meant for anyone, no coding required. We'll use **English** as the example (code `en`).

> 💡 **Key idea:** a language = one folder inside `src/i18n/` + one audio folder inside `public/audios/`. You copy the Spanish ones, translate the texts and drop in the audio. That's it.

### Step 1 — Copy the Spanish folder

Inside `src/i18n/` you'll see the `es` folder. **Copy it and rename the copy with the new language code** (lowercase):

```
src/i18n/es   →   copy and rename to   →   src/i18n/en
```

Inside you'll find these files (the ones you'll adapt):

| File | What it holds |
|---|---|
| `ui.json` | The **buttons and menu** texts (Home, Province, Playback…). |
| `manifest.json` | The app's **name and description** when installed. |
| `soundtrack.json` | The **titles** of the music tracks. |
| `data/` | All the **narrated content**: names and texts of cities, quests, encounters… |
| `index.js` | A technical file. **Don't touch it** (it already works in the copy). |

### Step 2 — Translate the texts

Open the `.json` files with a text editor (Notepad is fine) and **translate only what is between quotes** after the colon.

Example in `ui.json`:

```json
"home": "Inicio",        →   "home": "Home",
"provincia": "Provincia" →   "provincia": "Province"
```

In the `data/` folder, translate the text fields: `label`, `description`, `leafDescription` and `title`.

> ⚠️ **Important: do NOT change these** (they are internal “nuts and bolts”; touching them breaks the app):
> - The **words to the left** of the colon (`"home":`, `"label":`…).
> - The `next`, `id`, `provinciaTag`, `gremioTag` fields.
> - The `src` field inside `audio` (the sound path).
> - The symbols `{ } [ ] , "`.

### Step 3 — Add the new language's audio

Audio is stored per language under `public/audios/`. You'll see `public/audios/es/` already exists.

**Create a folder with the language code** and copy the translated audio inside, **keeping exactly the same folder structure and file names** as in Spanish:

```
public/audios/es/ciudades/cienaga_negra/caravana_viajera.mp3
public/audios/en/ciudades/cienaga_negra/caravana_viajera.mp3   ← same name, English voice
```

> You don't need to change anything in the texts for the audio: the app automatically looks for the audio in the active language's folder.

### Step 4 — Enable the language in the switcher

Open `src/i18n.js`. Find these two lists and **add the new language** (English is already there as an example, commented out with `//`; just remove the `//`):

```js
export const LANGUAGES = [
  { code: "es", label: "ESP", name: "Español" },
  { code: "en", label: "ENG", name: "English" },   // ← add this line
];

import en from "./i18n/en/index.js";   // ← add this import at the top, next to "es"

const LOCALES = {
  es,
  en,   // ← add this line
};
```

- `code`: the short language code (`en`, `fr`, `de`…). Must match the folder name.
- `label`: the 3 letters shown on the button (ESP, ENG…).
- `name`: the language name in its own language (English, Français…).

### Step 5 — Check everything is fine

In a terminal, inside the project, run:

```bash
npm test
```

The test automatically checks that the new language has no untranslated texts or missing files, and warns you if something is wrong. When it says **“todas las comprobaciones han pasado”** (all checks passed), you're done. ✅

## Adding new content

Each narrated text has **two pieces**: the **entry** (the title and the text, in a `.json` file) and the **audio** (an `.mp3`). This guide shows how to add a new one. We'll use Spanish (`es`) as the example.

### Step 1 — Choose the entry's file

Content lives in `src/i18n/es/data/`. Depending on the type, edit the matching file:

| Content type | File |
|---|---|
| Cities | `ciudades/<province>.json` |
| Quests | `misiones/<province>.json` |
| General encounters | `encuentros_generales.json` |
| Provincial encounters | `encuentros_provinciales.json` |
| Final session | `sesion_final/<province>.json` |

(`<province>` is `cienaga_negra`, `skyrim`, `roca_alta`, `morrowind` or `cyrodiil`.)

### Step 2 — Add the entry

Open the file and **copy an existing entry**, paste it as one more in the list (separated by a comma) and change its values. An entry looks like this:

```json
{
  "label": "Caravana viajera",
  "description": "",
  "leafDescription": "El clima hostil de Ciénaga Negra y su entorno aún más hostil hacen que sea muy difícil viajar por ella...",
  "audio": { "src": "audios/ciudades/cienaga_negra/caravana_viajera.mp3", "title": "" },
  "provinciaTag": "cienaga_negra",
  "gremioTag": "all"
}
```

What each field means:

| Field | What it's for |
|---|---|
| `label` | Short title shown in the panel. |
| `description` | Subtitle or hint under the title (can be left empty: `""`). |
| `leafDescription` | The **narration text** (shown when you press “show the text”). |
| `audio.src` | Audio path **without the language** (starts with `audios/…`). The app adds the language itself. |
| `audio.title` | Usually empty (`""`). |
| `provinciaTag` | Province for the sidebar filter. |
| `gremioTag` | Guild for the filter. Use `"all"` if it should appear with any guild. |

> ⚠️ Mind the syntax: each field in quotes, separated by commas, and the previous entry must end with `,` before the new one. If something breaks, it's usually a missing or extra comma or quote.
>
> `gremioTag` values: `circulo_campeones`, `ladrones`, `luchadores`, `magos`, `guardia_exterior`, `hermandad_oscura`, `intrepidos`, `ojos_reina`, `orden_psijic` or `all`.

### Step 3 — Add the audio file

The audio goes in `public/audios/<language>/…`, at **the same path you put in `audio.src`**, but inside the language folder. That is: drop the leading `audios/` and put it under `public/audios/es/`:

```
audio.src:  "audios/misiones/skyrim/a37.mp3"
file:        public/audios/es/misiones/skyrim/a37.mp3
```

Create any missing folders, keeping the names. (If the app has several languages, put the matching audio in each one's folder: `public/audios/en/…`, etc.)

### Step 4 — Check it

```bash
npm run dev
```

Open the app, go to the matching province/section and you'll see your new entry. Press play to hear the audio and “show the text” to read the narration. Also run `npm test` to verify the structure is still correct.

> If the entry shows up but pressing play says “Falta definir la ruta del audio” (audio path missing) or there's no sound, check that the `audio.src` path and the real location of the `.mp3` match exactly (same folders and same name, no extra capitals/spaces).

## Development

Requires [Node.js](https://nodejs.org/).

```bash
npm install     # install dependencies (first time only)
npm run dev     # start in development mode (http://localhost:5174/botse_audio/)
npm run build   # build the production version into dist/
npm run preview # preview the production build
npm test        # i18n checks (languages, keys, structure)
```

> All interface texts live in the i18n `.json` files. The HTML (`index.html`) only contains the Spanish **bootstrap** texts (first paint / no-JS); `main.js` replaces them with the i18n ones as soon as it loads and whenever the language changes.

## Project structure

```
public/
  audios/<language>/…    narrated audio, one folder per language (es, en…)
  icons/                 PWA icons
  manifest.webmanifest   default manifest (Spanish, installable)
  sw.js                  service worker (offline; only active in production)
src/
  main.js                app logic
  styles.css             styles
  i18n.js                language registry (t(), getContent(), LANGUAGES)
  i18n/
    compose.js           composes the content (province order)
    es/                  ← one language = one folder
      index.js           bundles the whole language
      ui.json            interface texts
      manifest.json      PWA metadata
      soundtrack.json    soundtrack titles
      data/              narrated content (cities, quests, encounters…)
scripts/
  i18n-check.cjs         test that validates the languages (npm test)
```
