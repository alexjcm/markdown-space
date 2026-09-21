import { lazy, Suspense, useState } from 'react'
import { ConfirmDialog } from './components/ConfirmDialog'
import { DocumentsPage } from './components/DocumentsPage'
import { useDocuments } from './hooks/useDocuments'
import type { MarkdownDocument } from './types/document'
import { clearCursorPosition } from './utils/cursorPositionStorage'
import { downloadMarkdown } from './utils/downloadMarkdown'

// The document list doesn't need CodeMirror at all: it's loaded separately,
// only when the user actually opens a document.
const DocumentEditor = lazy(() =>
  import('./components/DocumentEditor').then((module) => ({ default: module.DocumentEditor })),
)

const LAST_OPENED_KEY = 'markdown-space.lastOpenedDocumentId'

type View = { type: 'list' } | { type: 'editor'; documentId: string }

function getInitialView(): View {
  const lastOpenedId = localStorage.getItem(LAST_OPENED_KEY)
  // Trusts localStorage optimistically: if the document no longer exists
  // (it was deleted), DocumentEditor shows the "not found" state.
  return lastOpenedId ? { type: 'editor', documentId: lastOpenedId } : { type: 'list' }
}

function EditorLoadingFallback() {
  return (
    <div className="flex h-svh items-center justify-center">
      <p className="text-sm text-text-secondary">Loading editor…</p>
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
    // The editor already guarantees the pending autosave is flushed before
    // calling this callback, so we always read the latest state here.
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
      setImportNotice({ type: 'error', message: 'Could not import any file. Try again.' })
      return
    }

    const count = imported.length === 1 ? '1 document' : `${imported.length} documents`
    const failedText = failedCount > 0 ? ` (${failedCount} failed)` : ''
    setImportNotice({ type: 'success', message: `Imported ${count}${failedText}.` })
  }

  async function confirmDelete() {
    if (!pendingDeleteId) return

    await deleteDocument(pendingDeleteId)
    clearCursorPosition(pendingDeleteId)

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
          title="Delete document"
          description={`Delete "${pendingDeleteDocument.name}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  )
}

export default App
