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
- Evitar APIs, paquetes o patrones deprecados u obsoletos; preferir siempre la alternativa vigente y mantenida (ej. `@codemirror/commands` en vez de `@codemirror/history`, `wrangler deploy` en vez de `wrangler pages deploy`).
- Arquitectura preparada para evolucionar a sincronización entre dispositivos.

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
- Tema exclusivamente oscuro inspirado en VS Code.
- Persistencia local en el navegador.
- Instalabilidad como PWA mínima (manifest + iconos), para que el usuario pueda instalar la app en su dispositivo si lo desea — ver Fase 9. Sin service worker ni caché offline.

### Fuera de la V1

- Autenticación.
- Backend.
- Sincronización entre dispositivos.
- Cloudflare Workers con lógica de backend/API propia (la V1 sí corre sobre el runtime de Workers, pero solo como hosting de archivos estáticos vía Workers Static Assets — ver sección 3).
- Cloudflare D1.
- PWA completa con service worker / funcionamiento offline (solo se incluye la instalabilidad mínima, ver sección "Incluido").
- Imágenes en Markdown.
- Barra de formato.
- Búsqueda de documentos.
- Integraciones externas.
- Historial de versiones.
- GitHub Flavored Markdown, excepto tablas (ver sección "Markdown" más abajo — el 44% de los documentos reales del usuario usa tablas, así que sí se soportan en la vista previa vía `remark-gfm`).

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
- Tailwind CSS 4 (vía `@tailwindcss/vite`, el plugin oficial — versión más nueva disponible; confirmado viable con Vite 8 + React 19 en el workspace `dmc`).
- Lucide React

Sin router: la navegación entre la lista de documentos y el editor se maneja con estado local de React (ver sección 8). Se descarta React Router por bajo valor para solo 2 vistas, dado que la app se usará mayormente instalada en pantalla de inicio (sin barra de URL visible) y sin necesidad de compartir enlaces a documentos específicos.

### PWA

- `vite-plugin-pwa` — genera el manifest (`manifest.webmanifest`) e inyecta el `<link>` automáticamente, en vez de escribirlo a mano (mismo enfoque usado en el workspace `dmc`). Configurado sin service worker activo (`injectRegister: null`), solo para habilitar instalabilidad — ver Fase 9.

### Editor

- CodeMirror 6, vía el wrapper `@uiw/react-codemirror` (simplifica la integración con refs/efectos de React; verificar `peerDependencies` con React 19 al instalar).
- `@codemirror/lang-markdown` (sintaxis Markdown).
- `@codemirror/commands` (undo/redo — el historial vive aquí, no en el paquete obsoleto `@codemirror/history`).
- Tema dark custom vía `EditorView.theme()` + `HighlightStyle` (el paquete oficial `@codemirror/theme-one-dark` usa una paleta fija distinta a la definida en la sección 13, no sirve tal cual).

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

- Cloudflare Workers (Static Assets) — reemplaza al scaffold inicial en Cloudflare Pages, que Cloudflare ya no recomienda como opción por defecto para proyectos nuevos.

La V1 no requiere backend ni lógica de servidor: Workers Static Assets solo sirve los archivos estáticos generados por Vite, igual que hacía Pages. Pendiente migrar `wrangler.jsonc` (de `pages_build_output_dir` a `assets.directory`) y los scripts de `package.json` (de `wrangler pages dev/deploy` a `wrangler dev/deploy`) — ver Fase 0.

El despliegue real a producción (`wrangler deploy`) se realiza recién cuando la app esté completa y probada (Fases 0–9 terminadas, incluida la validación mobile de la Fase 8) — ver Fase 10. Durante el desarrollo solo se usa entorno local (`vite dev` / `wrangler dev`), sin publicar versiones intermedias.

---

## 4. Modelo de datos

```ts
export interface MarkdownDocument {
  id: string;
  name: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}
```

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

**Decisión revisada:** el flujo más común de uso de la app es cargar archivos `.md` ya existentes (no crear desde cero) — confirmado por el usuario tras el análisis de una muestra real de 43 documentos. Esto cambia varias decisiones de UX respecto a la versión inicial del plan:

- **Selección múltiple**, no solo un archivo a la vez (`<input type="file" multiple>`).
- **Importar es la acción visualmente prominente** del header de la lista (ícono con color de acento); "Crear documento" (+) pasa a ser la acción secundaria (gris).
- El **empty state** invita primero a importar ("Importá tus archivos Markdown existentes, o creá uno nuevo." + botón primario "Importar archivos"), con "Crear documento nuevo" como link secundario debajo.

Flujo:

1. Seleccionar uno o varios archivos `.md`.
2. Para cada archivo: leerlo como texto, conservar su nombre, resolver duplicados si ya existe un nombre igual (`archivo.md` → `archivo-2.md` → `archivo-3.md`...) y guardar una copia independiente en IndexedDB. Se procesa de forma secuencial (no en paralelo) para que los duplicados dentro del mismo lote se resuelvan bien entre sí. `updatedAt` se toma de `file.lastModified` (fecha real de última edición del archivo en el disco), no del momento de importación — así "Editado hace X" y el orden de la lista reflejan la edición real. `createdAt` sí es el momento de importación (no hay forma confiable de conocer la fecha de creación real del archivo original).
3. Si se importó **un solo archivo**, abrirlo automáticamente (comportamiento original, sigue teniendo sentido para ese caso).
4. Si se importaron **varios archivos**, quedarse en la lista y mostrar un aviso con el resultado (ej. "Se importaron 4 documentos.", o con conteo de fallos si alguno no se pudo leer).

El archivo original del dispositivo no se modifica.

### Editar

La fuente de verdad será:

```text
MarkdownDocument.content
```

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

El mismo contenido se renderiza con:

```text
react-markdown
```

No se almacenará HTML generado.

### Descargar

Generar un archivo usando:

```text
Blob
type: text/markdown
```

con el nombre actual del documento.

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
- **documentRepository:** única capa que conoce `idb`. Expone la API de la sección 7. Punto de extensión futuro para agregar un backend remoto (sección 19) sin tocar la UI.
- **Persistencia:** IndexedDB vía `idb`, base `markdown-space`, store `documents`.
- **Hosting:** Cloudflare Workers (Static Assets) sirviendo el build de Vite; sin lógica de servidor en V1.

### Rendimiento — code-splitting

CodeMirror y `react-markdown`/`remark-gfm` son, con diferencia, las dependencias más pesadas del bundle (confirmado: sin dividir, el JS inicial pesaba ~334KB gzip). Como la lista de documentos no necesita ninguna de las dos, se dividió el bundle en 3 niveles con `React.lazy()` + `Suspense`:

```text
chunk principal (lista de documentos)         ~75KB gzip
  ↓ (al abrir un documento)
chunk DocumentEditor (CodeMirror)             ~214KB gzip
  ↓ (al togglear Vista previa)
chunk MarkdownPreview (react-markdown + gfm)   ~46KB gzip
```

- `App.tsx` carga `DocumentEditor` con `lazy(() => import(...))`, con un `Suspense` fallback ("Cargando editor…").
- `DocumentEditor.tsx` a su vez carga `MarkdownPreview` de la misma forma, con su propio fallback ("Cargando vista previa…").
- Verificado en el build de producción (`vite preview`) que cada chunk se descarga únicamente en el momento correspondiente, no antes.

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

Flujo:

```text
React
  ↓
Hooks
  ↓
DocumentRepository
  ↓
idb
  ↓
IndexedDB
```

Esto desacopla la UI de la persistencia y facilita una futura sincronización remota.

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
Markdown Space              ⬆  +
```

`⬆` (Importar) es la acción prominente (acento); `+` (Crear) es secundaria (gris) — ver justificación en la sección 5, "Importar".

Lista:

```text
README.md
Editado hace 2 min             ⋮

notes.md
Editado ayer                   ⋮
```

### Empty state

```text
No hay documentos

Importá tus archivos Markdown
existentes, o creá uno nuevo.

[ Importar archivos ]
  Crear documento nuevo
```

"Importar archivos" es el botón primario (acento); "Crear documento nuevo" es un link secundario debajo.

### Menú de documento

- Descargar `.md`
- Eliminar

El renombrado se realiza exclusivamente desde el nombre editable dentro del editor (sección 11) — no se agrega una opción de renombrar en este menú, para mantener un único punto de validación de nombres/duplicados en vez de duplicar esa lógica en dos lugares. Es el enfoque más simple: una sola ruta de edición de nombre, un solo lugar donde se valida "vacío" y "duplicado".

---

## 10. UX — Editor

### Mobile-first

Header:

```text
←    README.md            👁  ⋮
     Guardado
```

Área principal:

```text
CodeMirror
```

Acciones (solo visibles en modo Editor; en modo Vista previa no hay barra inferior, el contenido ocupa toda la pantalla):

```text
Undo    Redo
```

Vista previa/Editar se decidió ubicar en el header (junto al ⋮) en vez de la barra inferior — es un cambio de "modo" (como en GitHub/iA Writer), mientras que Undo/Redo son acciones frecuentes de edición y se quedan pegadas arriba del teclado virtual (mismo patrón que iOS Notes/Gmail), agrupadas y centradas en vez de repartidas en todo el ancho.

La barra inferior debe respetar las safe areas de iOS. Cuando no hay barra inferior (modo Vista previa), el área de contenido respeta el safe-area inferior por sí misma.

Header y barra inferior deben permanecer fijos siempre; solo el área de contenido (CodeMirror o Vista previa) scrollea internamente, sin importar qué tan largo sea el documento. (Detectado como bug real en un documento largo de prueba: el contenedor raíz usaba `min-h-svh` en vez de `h-svh`, lo que dejaba crecer toda la página en vez de acotar el scroll al área de contenido — corregido.)

### Preview

La aplicación alternará:

```text
Editor ↔ Vista previa
```

No habrá split view.

Al abrir un documento, siempre se iniciará en modo Editor.

Cuando sea posible, deben conservarse:

- posición de scroll;
- posición del cursor;
- estado del documento.

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

## 12. Números de línea

La preferencia será configurable.

Se recomienda guardar esta preferencia en:

```text
localStorage
```

porque es un ajuste pequeño de interfaz y no necesita IndexedDB.

Clave sugerida:

```text
markdown-space.showLineNumbers
```

Valor inicial: oculto (`false`) por defecto; el usuario puede activarlo cuando quiera.

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

---

# 15. Plan de implementación

## Fase 0 — Bootstrap

Estado: **iniciado / scaffold generado**.

El proyecto se creó con el generador oficial de Cloudflare para React + Pages:

```bash
npm create cloudflare@latest -- markdown-space --framework=react --platform=pages
```

Selecciones realizadas durante el scaffold:

```text
Framework: React
Platform: Pages
Variant: TypeScript
Linter: Oxlint
Node.js: 24
Deploy inicial: No
```

El generador delegó la creación del frontend a Vite mediante la plantilla React + TypeScript.

Pasos inmediatos:

```bash
cd markdown-space
npm run dev
```

Pendiente dentro de esta fase:

- Configurar Tailwind CSS 4 (`@tailwindcss/vite`).
- Instalar Lucide React.
- Eliminar el contenido demo del scaffold (`App.css`, contador, `hero.png`, links a Vite/React).
- Migrar hosting de Cloudflare Pages a Workers Static Assets: actualizar `wrangler.jsonc` (`assets.directory` en vez de `pages_build_output_dir`) y los scripts de `package.json` (`wrangler dev` / `wrangler deploy` en vez de `wrangler pages dev` / `wrangler pages deploy`).
- Crear la estructura inicial de carpetas.
- Crear/conectar el repositorio remoto `markdown-space` si aún no está asociado.

**Resultado esperado:** aplicación base funcionando localmente, con el hosting ya migrado de Cloudflare Pages (scaffold inicial) a Cloudflare Workers (Static Assets).

---

## Fase 1 — Persistencia

- Instalar `idb`, `vitest`, `fake-indexeddb` (dev).
- Crear `db.ts`.
- Crear IndexedDB `markdown-space`.
- Crear store `documents`.
- Crear índice `updatedAt`.
- Crear índice único `nameKey` (versión normalizada de `name`, case-insensitive).
- Crear `documentRepository`.
- Implementar CRUD.
- Generar IDs con `crypto.randomUUID()`.
- Implementar nombres únicos (case-insensitive).
- Implementar generación de nombres `untitled-N` rellenando el hueco más bajo libre.

**Validar (tests unitarios con `vitest` + `fake-indexeddb`):**

- crear, leer, actualizar, eliminar;
- `existsByName` detecta duplicados sin importar mayúsculas/minúsculas;
- generación de `untitled-N` rellena huecos correctamente.

**Validar manualmente en el navegador:**

- recargar navegador;
- comprobar persistencia real en IndexedDB (no solo en el mock de tests).

---

## Fase 2 — Lista de documentos

- Crear `DocumentsPage`.
- Cargar documentos ordenados por `updatedAt`.
- Crear documento desde `+`.
- Crear empty state.
- Abrir documentos (guardando `lastOpenedDocumentId` en `localStorage`, sección 8).
- Eliminar con confirmación (limpiar `lastOpenedDocumentId` si apuntaba al documento eliminado).
- Descargar desde menú.

**Resultado:** gestión funcional de múltiples documentos.

---

## Fase 3 — Editor CodeMirror

- Instalar `@uiw/react-codemirror`, `@codemirror/lang-markdown`, `@codemirror/commands`.
- Configurar Markdown.
- Configurar syntax highlighting.
- Crear tema dark custom (`EditorView.theme()` + `HighlightStyle`, no el paquete `@codemirror/theme-one-dark`).
- Implementar:
  - edición;
  - undo/redo (extensión `history` de `@codemirror/commands`);
  - números de línea opcionales.
- Validar funcionamiento móvil temprano (Safari iOS tiene issues activos conocidos: auto-capitalización y comportamiento de `readOnly` con el teclado virtual).

**Resultado:** editor Markdown usable en móvil.

---

## Fase 4 — Autoguardado

- Crear `useAutosave`.
- Implementar debounce (~600 ms).
- Mostrar:
  - `Guardando…`
  - `Guardado`
  - `Error al guardar`
- Actualizar `updatedAt`.
- Resolver guardados pendientes al salir (flush en cleanup del componente editor y en `visibilitychange`/`pagehide`, ver sección 5).

**Resultado:** no existe botón Guardar.

---

## Fase 5 — Renombrado

- Hacer editable el nombre del header.
- Agregar `.md` automáticamente.
- Validar duplicados.
- Validar vacío.
- Enter / blur confirma.
- Escape cancela.
- Mostrar errores inline.

---

## Fase 6 — Preview

- Instalar `react-markdown` y `remark-gfm` (tablas).
- Crear `MarkdownPreview`.
- Estilizar:
  - headings;
  - párrafos;
  - enlaces;
  - blockquotes;
  - listas;
  - inline code;
  - code blocks;
  - tablas (con scroll horizontal en mobile — las tablas reales del usuario tienen 4+ columnas).
- Implementar:
  - Vista previa.
  - Editar.

**Resultado:**

```text
Editor ↔ Vista previa
```

---

## Fase 7 — Importar y exportar

### Importar

- Permitir `.md`, con selección múltiple.
- Leer con File API, de forma secuencial (no `Promise.all`).
- Resolver nombres duplicados, incluyendo duplicados dentro del mismo lote.
- Guardar en IndexedDB.
- Si es 1 archivo: abrir automáticamente. Si son varios: quedarse en la lista con un aviso del resultado.

### Exportar

- Crear Blob.
- Descargar con nombre actual.

---

## Fase 8 — Refinamiento mobile-first

Probar especialmente:

- Safari en iPhone.
- Chrome en Android.
- viewport pequeño.
- teclado virtual.
- portrait.
- desktop Chrome/Safari/Firefox.

Revisar:

- targets táctiles;
- scroll;
- foco;
- selección;
- safe areas;
- estados de error;
- transición editor-preview.

---

## Fase 9 — Instalabilidad (PWA mínima)

- Instalar `vite-plugin-pwa`.
- Configurar el plugin en `vite.config.ts`: `registerType: 'autoUpdate'`, `injectRegister: null` (sin service worker activo — mantiene el alcance de "instalabilidad mínima, sin offline" de la sección 2).
- Definir el manifest vía la opción `manifest` del plugin (nombre, iconos, `theme_color`, `background_color`, `display: 'standalone'`, `start_url`) — el plugin genera `manifest.webmanifest` e inyecta el `<link>` automáticamente.
- Generar iconos (192px, 512px, maskable).
- Agregar meta tags para iOS (`apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`) en `index.html` — el plugin no los cubre automáticamente para iOS.
- Sin service worker ni caché offline en V1 — solo se habilita el flujo de "Instalar app" / "Agregar a pantalla de inicio"; el usuario decide si instalarla o seguir usándola desde el navegador.

**Resultado:** el usuario puede instalar la app en su dispositivo si lo desea, sin que sea obligatorio ni cambie el comportamiento en el navegador normal.

---

## Fase 10 — Despliegue

Se ejecuta al final, únicamente cuando la app esté lista y probada (Fases 0–9 completas, incluida la validación mobile de la Fase 8). No se despliega en producción durante el desarrollo.

- Confirmar que `wrangler.jsonc` esté migrado a Workers Static Assets (`assets.directory`, sin `pages_build_output_dir`).
- Ejecutar `npm run build`.
- Desplegar con `wrangler deploy`.
- Verificar la app publicada en Cloudflare Workers (Static Assets): carga, persistencia en IndexedDB, instalación PWA mínima.

**Resultado:** V1 publicada en Cloudflare Workers (Static Assets).

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
18. La aplicación esté desplegada en Cloudflare Workers (Static Assets).
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

# 19. Evolución futura — Sincronización entre dispositivos

La arquitectura debe permitir que Markdown Space evolucione sin reescribir el frontend.

V1:

```text
React
  ↓
DocumentRepository
  ↓
idb
  ↓
IndexedDB
```

Futuro:

```text
                    React
                      │
              DocumentRepository
                 ┌────┴────┐
                 │         │
                 ▼         ▼
             IndexedDB   API
                           │
                           ▼
                  Cloudflare Worker
                           │
                ┌──────────┴──────────┐
                │                     │
              Auth0                  D1
```

Responsabilidades futuras:

### IndexedDB

- copia local;
- acceso rápido;
- posible cache local.

### Cloudflare Worker

- API backend;
- validación de usuario;
- lectura/escritura remota;
- reglas de sincronización.

### Auth0

- autenticación;
- identidad del usuario;
- tokens para acceder a la API.

### Cloudflare D1

- almacenamiento remoto de documentos;
- metadatos de sincronización.

La implementación de sincronización deberá definir posteriormente:

- estrategia de conflictos;
- versión de documentos;
- timestamps remotos;
- comportamiento offline;
- origen de verdad.

Nada de esto forma parte de la V1.

---

## 20. Primera iteración técnica

Antes de completar toda la interfaz, validar este flujo:

```text
Crear documento
      ↓
Abrir CodeMirror
      ↓
Escribir Markdown
      ↓
Autoguardar en IndexedDB
      ↓
Recargar navegador
      ↓
Documento sigue existiendo
      ↓
Descargar .md
```

Si este flujo funciona correctamente en móvil, la base técnica está validada.

---

## 21. Estado actual del proyecto

Decisiones de scaffold ya cerradas:

```text
Repositorio: markdown-space
Runtime: Node.js 24
Framework: React
Lenguaje: TypeScript
Build tool: Vite
Linter: Oxlint
Hosting objetivo: Cloudflare Workers (Static Assets) — migrado desde el scaffold inicial en Cloudflare Pages
Deploy inicial: omitido
```

Comandos disponibles identificados durante la creación:

```bash
cd markdown-space
npm run dev
```

# Referencias:

https://developers.cloudflare.com/workers/static-assets/