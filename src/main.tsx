import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import './index.css'
import App from './App.tsx'

if (import.meta.env.DEV) {
  // Dev only: lets you try documentRepository from the browser console
  // (e.g. `await documentRepository.getAll()`). Dynamic import so neither the
  // code nor the `idb` dependency end up in the production bundle.
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
