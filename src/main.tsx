import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  // Solo en desarrollo: permite probar documentRepository desde la consola del navegador
  // (ej. `await documentRepository.getAll()`). Import dinámico para que ni el código
  // ni la dependencia `idb` terminen en el bundle de producción.
  import('./data/documentRepository.ts').then(({ documentRepository }) => {
    Object.assign(window, { documentRepository })
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
