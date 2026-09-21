# Plan de Implementación — Markdown Space

## 1. Identidad del proyecto

**Nombre de la aplicación:** Markdown Space  
**Repositorio:** `markdown-space`

Markdown Space será una aplicación web **mobile-first** para crear, importar, editar, previsualizar, guardar localmente y descargar archivos Markdown (`.md`).

La V1 será de uso personal y priorizará:

- UX rápida y simple.
- Excelente uso desde móvil.
- Pocas dependencias.
- Tecnologías actuales y ligeras.
- Evitar APIs, paquetes o patrones deprecados u obsoletos; preferir siempre la alternativa vigente y mantenida (ej. `@codemirror/commands` en vez del paquete obsoleto `@codemirror/history`).
- Arquitectura preparada para evolucionar a sincronización entre dispositivos.

**Idioma:** la interfaz de la app, el código fuente y sus comentarios están en inglés. Este documento de plan es la única excepción y permanece en español.

---

## 2. Alcance de la V1

### Incluido

- Crear múltiples documentos Markdown.
- Crear documentos nuevos automáticamente como:
  - `untitled.md`
  - `untitled-2.md`
  - `untitled-3.md`
- Importar archivos `.md`.
- Editar Markdown estándar.
- Syntax highlighting.
- Undo / redo.
- Números de línea opcionales.
- Autoguardado.
- Estados visuales:
  - `Guardando…`
  - `Guardado`
  - `Error al guardar`
- Vista previa Markdown.
- Cambio entre:
  - Editor
  - Vista previa
- Sin split view.
- Renombrar tocando directamente el nombre del archivo.
- Agregar `.md` automáticamente si el usuario omite la extensión.
- Evitar nombres duplicados.
- Descargar el documento como `.md`.
- Eliminar documentos con confirmación.
- Búsqueda de documentos por nombre y contenido.
- Interfaz general exclusivamente oscura, inspirada en VS Code; tema del editor seleccionable entre 3 opciones (Dark Modern, Monokai, Dracula) con resaltado real por lenguaje en bloques de código reconocidos.
- Tamaño de fuente del editor ajustable.
- Persistencia local en el navegador.
- Instalabilidad como PWA mínima (manifest + iconos), para que el usuario pueda instalar la app en su dispositivo si lo desea. Sin service worker ni caché offline.

### Fuera de la V1

- Autenticación.
- Backend.
- Sincronización entre dispositivos.
- Cloudflare Workers con lógica de backend/API propia (la V1 usa Cloudflare Pages solo como hosting de archivos estáticos — ver sección 3).
- Cloudflare D1.
- PWA completa con service worker / funcionamiento offline (solo se incluye la instalabilidad mínima, ver sección "Incluido").
- Imágenes en Markdown.
- Barra de formato.
- Integraciones externas.
- Historial de versiones.
- GitHub Flavored Markdown, excepto tablas — ver sección 3, "Markdown".

---

## 3. Stack tecnológico

### Runtime y tooling

- Node.js 24
- npm
- Oxlint

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS 4 (vía `@tailwindcss/vite`, el plugin oficial).
- Lucide React

Sin router: navegación con estado local de React — ver justificación en sección 8.

### PWA

- `vite-plugin-pwa` — genera el manifest (`manifest.webmanifest`) e inyecta el `<link>` automáticamente, en vez de escribirlo a mano. Configurado sin service worker activo (`injectRegister: null`), solo para habilitar instalabilidad. La estrategia por defecto del plugin (`generateSW`) igual construye un `sw.js` con manifest de precache de todos los assets (~1 MB) aunque nunca se registre — inofensivo mientras siga sin registrarse, pero quedaría cacheando ~1 MB en el dispositivo si algún cambio futuro llegara a registrarlo por error. Se vació explícitamente (`workbox.globPatterns: []`) para que ese service worker dormido no pueda precachear nada.

### Editor

- CodeMirror 6, vía el wrapper `@uiw/react-codemirror` (simplifica la integración con refs/efectos de React).
- `@codemirror/lang-markdown` (sintaxis Markdown).
- `@codemirror/commands` (undo/redo — el historial vive aquí, no en el paquete obsoleto `@codemirror/history`).
- Tema VS Code Dark Modern custom vía `EditorView.theme()` + `HighlightStyle` (el paquete oficial `@codemirror/theme-one-dark` usa una paleta fija distinta a la definida en la sección 13, no sirve tal cual), combinado con `@uiw/codemirror-theme-monokai` y `@uiw/codemirror-theme-dracula` para los temas Monokai y Dracula seleccionables (sección 13) — paquetes individuales, no la umbrella `@uiw/codemirror-themes-all`, para poder cargarlos por separado bajo demanda.
- `@codemirror/lang-json`, `@codemirror/lang-java`, `@codemirror/lang-sql` — resaltado real dentro de bloques de código con lenguaje reconocido (sección 13), elegidos por uso real medido, no adivinado. Cargados bajo demanda, no empaquetados de entrada (sección 13).

### Markdown

Estándar:

- CommonMark, con la excepción de tablas GFM (ver justificación abajo).

Responsabilidades:

- CodeMirror interpreta la sintaxis durante la edición.
- `react-markdown` + `remark-gfm` realizan el parsing/renderizado de la vista previa.

Decisión revisada tras analizar una muestra real de 43 documentos del usuario (`/Users/ajcm/Downloads/docs`): el 44% (19/43) usa tablas Markdown con contenido de negocio real, mientras que listas de tareas, HTML embebido, imágenes y diagramas Mermaid no aparecen en ningún archivo. Por eso se agrega `remark-gfm` (una sola dependencia, oficial y mantenida) únicamente para que las tablas se rendericen correctamente en la vista previa — el resto de las extensiones GFM (tachado, listas de tareas, autolinks) quedan habilitadas de forma incidental por venir en el mismo plugin, pero no fueron el motivo de la decisión.

### Preview

- `react-markdown` + `remark-gfm` (soporte de tablas).

### Persistencia

- IndexedDB

### Wrapper IndexedDB

- `idb`

### Testing

- `vitest` + `fake-indexeddb` (dev) — tests unitarios para `documentRepository`: CRUD, unicidad de nombres (case-insensitive), generación de nombres `untitled-N`. Sin tests end-to-end en V1.

### Hosting

- **Cloudflare Pages.** No deprecado, solo no es la opción por defecto para proyectos nuevos — para una app 100% estática sin bindings no hay diferencia funcional real frente a Workers Static Assets (que se evaluó y descartó por fricción práctica en el despliegue).

La V1 no requiere backend ni lógica de servidor: Pages solo sirve los archivos estáticos generados por Vite.

El despliegue a producción ocurre automáticamente vía la integración de Cloudflare Pages con GitHub (push a `main` → build y deploy automático). También existe `npm run deploy` (`wrangler pages deploy`) como alternativa manual.

---

## 4. Modelo de datos

```ts
export interface MarkdownDocument {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  everEditedInApp: boolean;
}
```

`everEditedInApp` empieza en `false` al crear o importar un documento, y pasa a `true` recién en el primer guardado real de contenido (no al renombrar). Sirve para mostrar la etiqueta "New" en la lista (sección 9) mientras el archivo no haya sido tocado. Los documentos guardados antes de que este campo existiera se tratan como `true` al leerlos (ver `documentRepository.toPublicDocument`), para no etiquetar como "New" contenido antiguo que ya se venía usando.

### IndexedDB

Base de datos:

```text
markdown-space
```

Object store:

```text
documents
```

Clave primaria:

```text
id
```

Índices:

```text
updatedAt
nameKey (unique: true)
```

`nameKey` es una versión normalizada en minúsculas de `name` (`name.trim().toLowerCase()`), mantenida internamente por `documentRepository`/`db.ts` — no forma parte de `MarkdownDocument` ni se expone a la UI. Existe únicamente para que la unicidad de nombres sea insensible a mayúsculas (`README.md` y `readme.md` se consideran el mismo nombre), ya que el índice nativo de IndexedDB por sí solo es sensible a mayúsculas.

El índice único sobre `nameKey` permite que `existsByName` (sección 7) resuelva duplicados en O(1) vía `store.index('nameKey').get(normalize(name))`, en vez de traer todos los documentos y filtrar en memoria (evita además condiciones de carrera entre creaciones simultáneas).

La lista principal se ordenará por:

```text
updatedAt DESC
```

---

## 5. Reglas funcionales

### Crear documento

Al presionar `+`:

1. Buscar el siguiente nombre disponible: el menor `N` libre, probando `untitled.md`, `untitled-2.md`, `untitled-3.md`... en orden (si `untitled-2.md` fue borrado o renombrado, el próximo documento nuevo lo vuelve a ocupar, en vez de saltar a `untitled-4.md`).
2. Crear `untitled.md` o `untitled-N.md`.
3. Guardarlo inmediatamente.
4. Abrir el editor.

### Renombrar

El nombre se edita directamente desde el header.

Reglas:

- No permitir nombres vacíos.
- Eliminar espacios al inicio y final.
- Agregar `.md` si falta.
- No permitir nombres duplicados (comparación insensible a mayúsculas: `README.md` y `readme.md` cuentan como el mismo nombre).
- `createdAt` no cambia.
- `updatedAt` se actualiza.

### Importar

El flujo más común de uso de la app es cargar archivos `.md` ya existentes, no crear desde cero — por eso importar acepta selección múltiple y es la acción visualmente prominente de la lista (ver mockups y empty state en sección 9).

Flujo:

1. Seleccionar uno o varios archivos `.md`.
2. Para cada archivo: leerlo como texto, conservar su nombre, resolver duplicados si ya existe un nombre igual (`archivo.md` → `archivo-2.md` → `archivo-3.md`...) y guardar una copia independiente en IndexedDB. Se procesa de forma secuencial (no en paralelo) para que los duplicados dentro del mismo lote se resuelvan bien entre sí. `updatedAt` se toma de `file.lastModified` (fecha real de última edición del archivo en el disco), no del momento de importación — así "Editado hace X" y el orden de la lista reflejan la edición real. `createdAt` sí es el momento de importación (no hay forma confiable de conocer la fecha de creación real del archivo original).
3. Si se importó **un solo archivo**, abrirlo automáticamente (comportamiento original, sigue teniendo sentido para ese caso).
4. Si se importaron **varios archivos**, quedarse en la lista y mostrar un aviso con el resultado (ej. "Se importaron 4 documentos.", o con conteo de fallos si alguno no se pudo leer).

El archivo original del dispositivo no se modifica.

### Editar

La fuente de verdad es `MarkdownDocument.content`.

### Autoguardado

Flujo:

```text
Usuario escribe
      ↓
Cambio local
      ↓
debounce ~600 ms
      ↓
IndexedDB
      ↓
updatedAt
      ↓
Guardado
```

Debe evitarse guardar en cada pulsación.

Al salir del editor con cambios pendientes, se debe ejecutar el guardado pendiente (flush del debounce). Disparadores concretos:

- Al desmontar el componente del editor (cleanup de `useEffect`), por ejemplo al volver a la lista o cambiar de documento.
- Al detectar `visibilitychange` (pestaña/app pasa a segundo plano) o `pagehide` como red de seguridad — se prefieren sobre `beforeunload`, que no es confiable en Safari/iOS móvil.

### Vista previa

El mismo contenido se renderiza con `react-markdown`. No se almacenará HTML generado.

### Descargar

Generar un archivo con `Blob` (`type: text/markdown`) con el nombre actual del documento.

### Eliminar

1. Solicitar confirmación.
2. Si confirma, eliminar de IndexedDB.
3. Si estaba abierto, volver a la lista.

---

## 6. Arquitectura propuesta

```text
React (componentes de UI)
      ↓
Estado local (useState / useReducer)
      ↓
documentRepository (capa de acceso a datos)
      ↓
idb (wrapper de IndexedDB)
      ↓
IndexedDB (persistencia del navegador)
```

Capas:

- **UI (React):** `DocumentsPage` (lista) y `DocumentEditor` (editor/preview). No acceden a `idb` directamente, solo a `documentRepository` a través de hooks.
- **Navegación:** estado local en el componente raíz (`vista actual: 'list' | 'editor'` + `id` del documento seleccionado). Ver sección 8.
- **documentRepository:** única capa que conoce `idb`. Expone la API de la sección 7. Punto de extensión futuro para agregar un backend remoto sin tocar la UI.
- **Persistencia:** IndexedDB vía `idb`, base `markdown-space`, store `documents`.
- **Hosting:** Cloudflare Pages sirviendo el build de Vite; sin lógica de servidor en V1.

### Rendimiento — code-splitting

CodeMirror y `react-markdown`/`remark-gfm` son, con diferencia, las dependencias más pesadas del bundle. Como la lista de documentos no necesita ninguna de las dos, el bundle se divide en 3 niveles con `React.lazy()` + `Suspense`:

```text
chunk principal (lista de documentos)
  ↓ (al abrir un documento)
chunk DocumentEditor (CodeMirror)
  ↓ (al togglear Vista previa)
chunk MarkdownPreview (react-markdown + gfm)
```

- `App.tsx` carga `DocumentEditor` con `lazy(() => import(...))`, con un `Suspense` fallback ("Cargando editor…").
- `DocumentEditor.tsx` a su vez carga `MarkdownPreview` de la misma forma, con su propio fallback ("Cargando vista previa…").

---

## 7. Acceso a datos

Los componentes React no accederán directamente a `idb`.

Se utilizará:

```text
documentRepository
```

API inicial:

```ts
getAll(): Promise<MarkdownDocument[]>

getById(id: string): Promise<MarkdownDocument | undefined>

create(document: MarkdownDocument): Promise<void>

update(document: MarkdownDocument): Promise<void>

delete(id: string): Promise<void>

existsByName(name: string, excludeId?: string): Promise<boolean>
```

`existsByName` se implementa con `store.index('nameKey').get(normalize(name))` (ver índice único en sección 4), no con `getAll()` + filtro. `normalize` = `trim().toLowerCase()`.

El flujo es el mismo de la sección 6 (React → hooks → `documentRepository` → `idb` → IndexedDB): esto desacopla la UI de la persistencia y facilita una futura sincronización remota.

---

## 8. Navegación

Sin React Router: la navegación se maneja con estado local de React, no con URLs.

```ts
type View =
  | { type: 'list' }
  | { type: 'editor'; documentId: string }
```

Persistencia de sesión:

- El `documentId` del documento abierto se guarda en `localStorage` (clave `markdown-space.lastOpenedDocumentId`) cada vez que se abre un editor.
- Al iniciar la app, si existe un `lastOpenedDocumentId` y el documento todavía existe en IndexedDB, se abre directamente ahí; si no, se muestra la lista.

Esto cubre el requisito de "recargar (F5) debe dejarme en el mismo documento" sin necesitar rutas reales — aceptable porque la app se usará mayormente instalada en pantalla de inicio (sin barra de URL) y no se necesita compartir enlaces a documentos específicos.

Si el `documentId` guardado ya no existe (fue eliminado):

- mostrar estado de documento no encontrado;
- permitir regresar a la lista.

---

## 9. UX — Lista de documentos

Header:

```text
Markdown Space           🔍  ⬆  +
```

`⬆` (Importar) es la acción prominente (acento); `+` (Crear) es secundaria (gris) — ver justificación en la sección 5, "Importar". `🔍` (Buscar) solo se muestra si hay al menos un documento; al tocarlo, reemplaza el título y los íconos por una barra de búsqueda (ver "Búsqueda", más abajo) — no ocupa espacio cuando no se usa.

Lista, ordenada por fecha de edición descendente. Debajo del nombre, truncado a una sola línea (`truncate`, para que nombres largos no hagan crecer la fila y desalineen el botón `⋮` entre archivos), se muestra fecha y hora exactas de la última edición y el peso del archivo, en una misma línea separados por un guion — se prefirió sobre tiempo relativo ("hace 2 min") porque el flujo más común es importar `.md` existentes, donde la fecha exacta y el tamaño ayudan a reconocer el archivo correcto entre varios similares. La fecha empieza por el día (`DD/MM/AAAA, hh:mm a. m./p. m.`, formateada a mano sin depender de un locale de `Intl`, para no heredar convenciones regionales inesperadas):

```text
README.md                                     ⋮
20/09/2026, 08:32 PM - 12.4 KB

notas.md   New                                ⋮
19/09/2026, 08:15 AM - 3.1 KB
─────────────────────────────────────────────
                v{versión}
```

Junto al nombre aparece la etiqueta "New" mientras `everEditedInApp` (sección 4) siga en `false` — es decir, mientras el archivo no haya sido editado dentro de la app desde que se creó o importó.

La versión (de `package.json`, inyectada en build time vía `define` de Vite) se muestra una sola vez, en un footer fijo debajo de la lista — no en el menú de cada documento, donde se repetiría innecesariamente una vez por archivo.

Al abrir el menú `⋮` de un archivo, esa fila se resalta (mismo fondo que el menú) y el fondo del resto de la pantalla se oscurece levemente — el menú de un archivo puede visualmente superponerse a la fila siguiente (es más alto que una fila), y sin esta señal el usuario puede confundir a qué archivo pertenecen esas opciones.

### Empty state

```text
No hay documentos

[ Importar archivos ]
  Crear documento nuevo
```

"Importar archivos" es el botón primario (acento); "Crear documento nuevo" es un link secundario debajo. Sin subtítulo explicativo: "No hay documentos" junto a ambos botones ya es autoexplicativo.

### Búsqueda

Al tocar `🔍` en el header, se reemplaza por una barra de búsqueda (`✕` para cerrar + input, con foco automático); `Escape` también cierra. Filtra la lista en tiempo real (sin botón de buscar) por coincidencia parcial, insensible a mayúsculas, tanto en el **nombre** del archivo como en su **contenido** — como el contenido ya está cargado en memoria (sección 7), es un filtro directo sobre el array, sin costo ni índice adicional.

Si no hay coincidencias, se muestra "No results for "{query}"" en vez de la lista, sin perder la barra de búsqueda (para poder ajustar la consulta). Al cerrar la búsqueda, la consulta se limpia — reabrir siempre empieza en blanco.

### Menú de documento

- Descargar `.md`
- Eliminar

El renombrado se realiza exclusivamente desde el nombre editable dentro del editor (sección 11) — no se agrega una opción de renombrar en este menú, para mantener un único punto de validación de nombres/duplicados en vez de duplicar esa lógica en dos lugares. Es el enfoque más simple: una sola ruta de edición de nombre, un solo lugar donde se valida "vacío" y "duplicado".

---

## 10. UX — Editor

### Mobile-first

Header (una sola fila; Undo/Redo solo aparecen en modo Editor):

```text
←    README.md       ↶  ↷  👁  ⋮
     Guardado
```

Undo/Redo viven dentro de la fila del header en vez de en una barra aparte, para no restarle altura útil al área de escritura en pantallas de celular pequeñas — el nombre del archivo (`truncate`) es lo que cede espacio cuando hace falta, nunca los botones (todos se mantienen en 44px, el tamaño táctil de referencia de toda la app). Ambos se deshabilitan (opacidad reducida, sin respuesta al tap) cuando no hay nada que deshacer/rehacer. Vista previa/Editar y el menú `⋮` van al final de la fila porque son acciones menos frecuentes que Undo/Redo.

Área principal — un único contenedor con scroll (CodeMirror o Vista previa, a altura natural/creciente, no fija) seguido de un pie con la versión de la app:

```text
CodeMirror
...
v{versión}
```

El pie con la versión **no está fijo**: es el último elemento dentro del mismo contenedor que scrollea el contenido, así que solo se ve al llegar al final real del documento — no le resta altura visible al área de escritura mientras se edita. CodeMirror se configura a altura automática (crece con el contenido) en vez de altura fija con scroll interno propio; el contenedor que lo envuelve es el único que scrollea. CodeMirror sigue virtualizando correctamente las líneas fuera de pantalla en este modo (detecta el contenedor scrolleable externo) — verificado con un documento sintético de 20 000 líneas, sin degradación.

El menú `⋮` del header contiene (las primeras cuatro filas solo visibles en modo Editor; ninguna aplica en Vista previa):

- Mostrar/Ocultar números de línea (sección 12)
- Tamaño de fuente del editor (sección 12) — botones `−`/`+`, valor actual en el medio.
- Tema del editor (sección 13) — tres opciones seleccionables en una fila.
- Reset settings — vuelve las tres preferencias anteriores a sus valores por defecto.
- v{versión} (línea informativa, no interactiva) — se muestra también acá, además del pie de página, porque el pie solo es visible tras scrollear hasta el final.

El padding horizontal del área de contenido (`.cm-content`) y el del gutter de números de línea se mantienen deliberadamente angostos (ver `editorTheme.ts`), para que el texto aproveche más el ancho disponible en pantallas angostas.

El header permanece fijo siempre — no solo porque está fuera del contenedor que scrollea, sino porque `html`/`body` tienen `overflow: hidden` + `overscroll-behavior: none` (sección 14), lo que evita además el rebote elástico (bounce) de iOS Safari al arrastrar más allá del contenido.

Las líneas largas hacen ajuste automático (`line wrapping`) dentro del ancho visible del editor — no hay scroll horizontal ni límite de longitud de línea.

El color de fondo de la selección de texto usa los valores reales de VS Code (`editor.selectionBackground` `#264f78` con foco, `editor.inactiveSelectionBackground` `#3a3d41` sin foco — verificados en el código fuente de `microsoft/vscode`, no adivinados), aplicados con `!important`: la regla base de CodeMirror para el estado con foco es más específica que una regla propia sin ese calificador, así que la ganaba por defecto y la selección quedaba casi invisible.

### Preview

La aplicación alternará:

```text
Editor ↔ Vista previa
```

No habrá split view.

Al abrir un documento, siempre se iniciará en modo Editor.

La posición del cursor se persiste por documento (localStorage, clave por `documentId`) en cada cambio de selección, y se restaura — junto con el scroll hacia esa posición — al reabrir el documento, incluso después de volver a la lista o recargar la app. El scroll se dispara desde `onCreateEditor` (no desde un `useEffect` de montaje), que corre exactamente cuando CodeMirror termina de crear su `EditorView` — evita una condición de carrera en la que el efecto podía ejecutarse antes de que el editor existiera, dejando el documento abierto siempre desde el principio en vez de la última posición. Al eliminar un documento, su entrada de cursor en localStorage se borra junto con él (`App.tsx`) — de lo contrario quedaba huérfana para siempre, un descuido detectado en una auditoría de memoria/almacenamiento (confirmado en la práctica: tras varias pruebas de crear/borrar, había 7 claves de cursor acumuladas para un solo documento real).

---

## 11. Nombre editable

Comportamiento:

```text
README.md
```

Tap/click:

```text
[ README.md ]
```

Confirmar:

- Enter / Done.
- Blur.

Cancelar:

- Escape.

Errores inline:

```text
El nombre no puede estar vacío.
```

```text
Ya existe un archivo con ese nombre.
```

---

## 12. Fuente, números de línea y tamaño de letra

Fuente del editor (fija, no configurable por el usuario): `Menlo, Monaco, Consolas, 'Courier New', monospace`. Menlo/Monaco cubren macOS; `Consolas` es el fallback para Windows (mejor legibilidad de código que `'Courier New'`, que solo se usa si ni Consolas está disponible); `monospace` es el fallback genérico final para cualquier otro sistema.

Ambas son preferencias globales (no por documento) configurables desde el menú `⋮` del editor, guardadas en:

```text
localStorage
```

porque son ajustes pequeños de interfaz y no necesitan IndexedDB.

Números de línea — clave `markdown-space.showLineNumbers`, valor inicial oculto (`false`) por defecto.

Tamaño de fuente — clave `markdown-space.editorFontSize`, rango `12px`–`22px`, valor inicial `14px`. Los botones `−`/`+` se deshabilitan al llegar a cada límite en vez de permitir salirse de rango.

Las tres preferencias del editor (números de línea, tamaño de fuente, tema — sección 13) tienen un botón conjunto "Reset settings" al final del menú `⋮`, que las vuelve a sus valores iniciales de una sola vez. No afecta documentos ni su contenido — solo estas preferencias de interfaz.

---

## 13. Tema visual

Solo dark mode.

Paleta inicial:

```css
--app-bg: #181818;
--editor-bg: #1e1e1e;
--surface: #252526;
--border: #2d2d2d;

--text-primary: #d4d4d4;
--text-secondary: #858585;

--accent: #007acc;
--danger: #f14c4c;
```

El objetivo es inspirarse en VS Code Dark sin replicar su interfaz completa.

Esta paleta es la de la interfaz general de la app (listas, header, botones, diálogos) y es fija — no tiene selector, solo existe en modo oscuro (sección 2, "Fuera de la V1").

### Tema del editor (contenido)

A diferencia de la paleta general, el color del **área de escritura de CodeMirror** sí es seleccionable, con un máximo de 3 opciones (todas oscuras; se descartan explícitamente los temas tipo light mode) desde el menú `⋮` del editor (sección 10):

- **Dark Modern** — el tema por defecto, hecho a mano replicando el tema por defecto real de VS Code (no "Dark+" clásico). Colores verificados contra el código fuente de `microsoft/vscode` (`extensions/theme-defaults/themes/dark_modern.json`, encadenado a `dark_plus.json` → `dark_vs.json`), no adivinados: fondo `#1f1f1f`, texto `#cccccc`, números de línea `#6e7681`, encabezados/negrita `#569cd6`, cursiva `#c586c0`, código inline `#ce9178`, marcador de lista `#6796e6`, marcador de cita `#6a9955`. El color de cursor/selección (`#007acc`) es una elección propia — VS Code no define un color de cursor específico en esa cadena de temas, así que se mantiene el acento de la app para dar continuidad visual.
- **Monokai** y **Dracula** — `@uiw/codemirror-theme-monokai` y `@uiw/codemirror-theme-dracula` (paquetes individuales del mismo autor que `@uiw/react-codemirror`, no la umbrella `@uiw/codemirror-themes-all`), que ya incluyen su propio resaltado de sintaxis, sin necesidad de mapear colores a mano como con Dark Modern.

Preferencia guardada en `localStorage`, clave `markdown-space.editorTheme`, por defecto `Dark Modern`.

Arquitectura: `editorTheme.ts` separa una capa **estructural** (padding, tamaño de fuente, safe areas — igual sin importar el tema, `createEditorLayout(fontSize)`) de una capa de **paleta** (colores, intercambiable). Dark Modern se empaqueta de entrada (`vscodeDarkPalette`, es el tema por defecto, lo ve todo el mundo al abrir la app). Monokai y Dracula se cargan bajo demanda (`loadEditorThemePalette(themeId)`, `import()` dinámico) — solo quien realmente los elige descarga esos paquetes; mientras tanto `DocumentEditor.tsx` sigue mostrando la paleta actual (Dark Modern al inicio) hasta que la promesa resuelve. Cambiar de tema no reinicia el editor ni pierde el cursor, scroll o historial de deshacer/rehacer — CodeMirror reconfigura la extensión de tema en caliente, sin remontar la vista.

**Bloques de código vs. código inline:** `@lezer/markdown` usa el mismo nodo (`CodeText`) para el contenido de código en línea y el de bloques ` ``` `, así que un `HighlightStyle` no puede darles colores distintos — y agregar una segunda regla de estilo con contexto (`"FencedCode/CodeText"`) tampoco alcanza: `@lezer/common` combina reglas de estilo de distintas fuentes sin reordenarlas por especificidad, así que la regla sin contexto (código en línea) sigue ganando. La solución real es una decoración de CodeMirror (`ViewPlugin` + `Decoration.mark`, con `Prec.highest` para que su span quede más adentro que el del resaltado de sintaxis, ya que el nodo DOM más interno es el que determina el color visible) que fuerza el color de texto normal en el contenido de los bloques de código — así quedan en texto plano, como en VS Code real, y el código en línea conserva su color distintivo.

**Resaltado real por lenguaje dentro de bloques de código:** `markdown({ codeLanguages })` activa un parseo anidado (vía `@lezer/markdown`'s `parseMixed`) cuando el identificador después de las backticks (ej. ` ```json `) coincide con un lenguaje soportado. Elegidos a partir del uso real medido en una muestra de 43 documentos (no adivinados): **JSON** (`@codemirror/lang-json`, 3 usos), **Java** (`@codemirror/lang-java`, 6 usos) y **SQL** (`@codemirror/lang-sql`, 1 uso). El ~90% restante de los bloques de la muestra (sin lenguaje o `text`) no necesita resaltado — ya se benefician del punto anterior. Bash quedó descartado (1 solo uso real, no justifica el peso).

`codeLanguages` recibe un array de `LanguageDescription.of({ name, alias, load })`, no las funciones de lenguaje importadas directamente — `load` es un `import()` dinámico, y CodeMirror ya trae soporte nativo para esto: mientras la promesa no resuelve, el bloque se muestra sin resaltar (`ParseContext.getSkippingParser`), y en cuanto resuelve, CodeMirror reparsea y aplica el resaltado real, solo. Con esto y la carga diferida de Monokai/Dracula, el chunk del editor bajó de ~250 KB a ~117 KB gzip — por debajo de lo que pesaba antes de agregar ningún tema extra esta sesión.

Los colores de los tokens de programación (keyword, string, number, bool/null, comment, propertyName, typeName/className, nombre de función) están verificados contra `dark_vs.json`/`dark_plus.json` de `microsoft/vscode`, igual que los de markdown — no son una paleta inventada.

La decoración de "texto plano" del punto anterior se desactiva automáticamente para los bloques con lenguaje reconocido (comparando el mismo identificador que usa `codeLanguages`), para no taparle el color al resaltado real.

El identificador de lenguaje después de las backticks (ej. "json" en ` ```json `) se muestra en el mismo gris tenue que las backticks (`tags.labelName`), no en el color de texto normal — es sintaxis de marcado, no contenido.

---

## 14. Requisitos UX mobile-first

- Controles táctiles importantes de aproximadamente `44 × 44 px`.
- Tipografía cómoda dentro del editor.
- Evitar zoom involuntario al enfocar campos.
- Scroll fluido.
- Cursor claramente visible.
- El teclado móvil no debe ocultar controles críticos.
- Respetar `env(safe-area-inset-bottom)` en iPhone.
- Mostrar feedback discreto de guardado y errores.
- Usar modal únicamente para acciones destructivas.
- Sin rebote elástico (bounce) de página completa en iOS Safari: `html`/`body` usan `overflow: hidden` + `overscroll-behavior: none` (`index.css`), porque cada pantalla ya maneja su propio scroll interno — sin esto, arrastrar más allá del contenido movía visualmente hasta el header, aunque este nunca perdía su posición real en el layout.

---

# 15. Historial de implementación

La V1 se construyó en 10 fases, todas completadas y publicadas. El detalle de QUÉ hace cada parte ya vive en las secciones de producto correspondientes (4–14), no acá — esto es solo un resumen de CÓMO se llegó, para no perder trazabilidad.

1. **Bootstrap** — scaffold oficial de Cloudflare (`npm create cloudflare@latest -- markdown-space --framework=react --platform=pages`, React + TypeScript + Pages + Oxlint + Node 24), Tailwind y Lucide agregados después.
2. **Persistencia** — `idb` + `documentRepository` (sección 4, 7).
3. **Lista de documentos** — `DocumentsPage` (sección 9).
4. **Editor CodeMirror** — Markdown + syntax highlighting + undo/redo + números de línea (sección 10, 13).
5. **Autoguardado** — `useAutosave` con debounce (sección 5).
6. **Renombrado** — nombre editable en el header (sección 11).
7. **Preview** — `react-markdown` + `remark-gfm` (sección 5, 10).
8. **Importar y exportar** — selección múltiple, Blob para descarga (sección 5).
9. **Refinamiento mobile-first** — validado en Safari iPhone, Chrome Android, teclado virtual, safe areas, targets táctiles.
10. **Instalabilidad PWA** — `vite-plugin-pwa`, sin service worker ni offline (sección 2).
11. **Despliegue** — Cloudflare Pages conectado a GitHub, deploy automático en cada push a `main` (sección 3, "Hosting").

---

## 16. Criterios de aceptación de la V1

La V1 estará lista cuando:

1. Se pueda crear un documento.
2. Se generen correctamente nombres `untitled`.
3. Se pueda escribir Markdown.
4. CodeMirror muestre syntax highlighting.
5. Undo / redo funcionen.
6. Se puedan activar/desactivar números de línea.
7. El contenido se autoguarde.
8. Recargar no pierda documentos.
9. Se pueda alternar Editor / Preview.
10. Se pueda renombrar tocando el nombre.
11. Se eviten nombres duplicados.
12. Se pueda importar `.md`.
13. Se pueda descargar `.md`.
14. Se pueda eliminar con confirmación.
15. Los documentos se ordenen por modificación reciente.
16. La experiencia sea cómoda en móvil.
17. La aplicación funcione sin backend.
18. La aplicación esté desplegada en Cloudflare Pages.
19. La aplicación pueda instalarse en pantalla de inicio (manifest + iconos), sin que sea obligatorio.

---

## 17. Riesgos relevantes

### Persistencia local

IndexedDB no debe considerarse un backup permanente.

Los documentos pueden perderse si el usuario:

- elimina los datos del sitio;
- cambia de navegador;
- cambia de dispositivo;
- limpia almacenamiento.

Mitigación V1:

- descarga individual de archivos.

Evolución futura:

- exportación masiva;
- sincronización remota.

### Mobile

CodeMirror debe probarse en Safari/iOS desde las primeras fases, no al final.

### Autoguardado

Debe evitar:

- guardar cada pulsación;
- perder el último cambio;
- condiciones de carrera;
- sobrescribir contenido reciente con estado antiguo.

### Vista previa Markdown (XSS)

`react-markdown` no renderiza HTML embebido por defecto, por lo que importar archivos `.md` de terceros es seguro en V1. Restricción permanente: no agregar el plugin `rehype-raw` (habilita HTML embebido) sin combinarlo con `rehype-sanitize` o DOMPurify — de lo contrario un `.md` importado con `<script>` o atributos `on*` podría ejecutar JS en el contexto de la app (acceso a IndexedDB/localStorage del usuario).

---

# Referencias:

https://developers.cloudflare.com/pages/