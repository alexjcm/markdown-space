# Markdown Space

Mobile-first web app to create, import, edit, preview and download Markdown (`.md`) files — for personal use, no backend or accounts, everything saved locally in the browser (IndexedDB).

**Production:** https://markdown-space-7mr.pages.dev

## Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4
- CodeMirror 6 (via `@uiw/react-codemirror`) for the editor
- `react-markdown` + `remark-gfm` for the preview
- `idb` over IndexedDB for local persistence
- `vite-plugin-pwa` for installability (no service worker or offline cache)
- Cloudflare Pages for hosting, with Git integration (automatic deploy on every push to `main`)

See [`plan-implementacion.md`](./plan-implementacion.md) (in Spanish) for the full detail of product decisions, architecture and V1 scope.

## Local development

```bash
npm install
npm run dev
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Development server (Vite) |
| `npm run build` | Production build (`tsc -b && vite build`) |
| `npm run test` | Unit tests (Vitest) |
| `npm run lint` | Lint (Oxlint) |
| `npm run deploy` | Alternative manual deploy (`wrangler pages deploy`) — usually not needed, deploy is automatic on every push to `main` |

## Deployment

The project is connected to Cloudflare Pages via Git: every push to `main` triggers an automatic build and deploy. No manual steps required.
