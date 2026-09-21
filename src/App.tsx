import { lazy, Suspense, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DocumentsPage } from './components/DocumentsPage'
import { useDocuments } from './hooks/useDocuments'
import type { MarkdownDocument } from './types/document'
import { downloadMarkdown } from './utils/downloadMarkdown'

// La lista de documentos no necesita CodeMirror para nada: se carga aparte,
// solo cuando el usuario efectivamente abre un documento.
const DocumentEditor = lazy(() =>
  import('./components/DocumentEditor').then((module) => ({ default: module.DocumentEditor })),
)

const LAST_OPENED_KEY = 'markdown-space.lastOpenedDocumentId'

type View = { type: 'list' } | { type: 'editor'; documentId: string }

function getInitialView(): View {
  const lastOpenedId = localStorage.getItem(LAST_OPENED_KEY)
  // Se confía en localStorage de forma optimista: si el documento ya no existe
  // (fue eliminado), DocumentEditor muestra el estado "no encontrado".
  return lastOpenedId ? { type: 'editor', documentId: lastOpenedId } : { type: 'list' }
}

function EditorLoadingFallback() {
  return (
    <div className="flex h-svh items-center justify-center">
      <p className="text-sm text-text-secondary">Cargando editor…</p>
    </div>
  )
}

interface ImportNotice {
  type: 'success' | 'error'
  message: string
}

function App() {
  const { documents, isLoading, createDocument, importDocuments, deleteDocument, refresh } =
    useDocuments()
  const [view, setView] = useState<View>(getInitialView)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [importNotice, setImportNotice] = useState<ImportNotice | null>(null)

  function openDocument(id: string) {
    localStorage.setItem(LAST_OPENED_KEY, id)
    setView({ type: 'editor', documentId: id })
  }

  function closeEditor() {
    // El editor ya garantiza el flush del autoguardado pendiente antes de llamar
    // a este callback, así que acá siempre leemos el estado más reciente.
    refresh()
    setView({ type: 'list' })
  }

  async function handleCreate() {
    const document = await createDocument()
    openDocument(document.id)
  }

  async function handleImport(files: File[]) {
    setImportNotice(null)
    const { imported, failedCount } = await importDocuments(files)

    if (imported.length === 1 && failedCount === 0) {
      openDocument(imported[0].id)
      return
    }

    if (imported.length === 0) {
      setImportNotice({ type: 'error', message: 'No se pudo importar ningún archivo. Probá de nuevo.' })
      return
    }

    const verb = imported.length === 1 ? 'Se importó' : 'Se importaron'
    const count = imported.length === 1 ? '1 documento' : `${imported.length} documentos`
    const failedText =
      failedCount > 0 ? ` (${failedCount} ${failedCount === 1 ? 'falló' : 'fallaron'})` : ''
    setImportNotice({ type: 'success', message: `${verb} ${count}${failedText}.` })
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return

    await deleteDocument(pendingDeleteId)

    if (localStorage.getItem(LAST_OPENED_KEY) === pendingDeleteId) {
      localStorage.removeItem(LAST_OPENED_KEY)
    }
    if (view.type === 'editor' && view.documentId === pendingDeleteId) {
      setView({ type: 'list' })
    }
    setPendingDeleteId(null)
  }

  function handleDownload(document: MarkdownDocument) {
    downloadMarkdown(document)
  }

  if (isLoading) {
    return (
      <div className="flex h-svh flex-col">
        <header
          className="flex items-center justify-between border-b border-border px-4 pb-4"
          style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
        >
          <h1 className="text-lg font-medium text-text-primary">Markdown Space</h1>
        </header>
      </div>
    )
  }

  const pendingDeleteDocument = documents.find((document) => document.id === pendingDeleteId)

  return (
    <>
      {view.type === 'list' ? (
        <DocumentsPage
          documents={documents}
          onCreate={handleCreate}
          onImport={handleImport}
          importNotice={importNotice}
          onDismissImportNotice={() => setImportNotice(null)}
          onOpen={openDocument}
          onDownload={handleDownload}
          onDeleteRequest={setPendingDeleteId}
        />
      ) : (
        <Suspense fallback={<EditorLoadingFallback />}>
          <DocumentEditor
            document={documents.find((document) => document.id === view.documentId)}
            onBack={closeEditor}
          />
        </Suspense>
      )}

      {pendingDeleteDocument && (
        <ConfirmDialog
          title="Eliminar documento"
          description={`¿Eliminar "${pendingDeleteDocument.name}"? Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  )
}

export default App
