import { MoreVertical, Plus, Upload, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MarkdownDocument } from '../types/document'
import { relativeTime } from '../utils/relativeTime'

interface DocumentsPageProps {
  documents: MarkdownDocument[]
  onCreate: () => void
  onImport: (files: File[]) => void
  importNotice: { type: 'success' | 'error'; message: string } | null
  onDismissImportNotice: () => void
  onOpen: (id: string) => void
  onDownload: (document: MarkdownDocument) => void
  onDeleteRequest: (id: string) => void
}

export function DocumentsPage({
  documents,
  onCreate,
  onImport,
  importNotice,
  onDismissImportNotice,
  onOpen,
  onDownload,
  onDeleteRequest,
}: DocumentsPageProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  function openMenu(id: string) {
    lastFocusedRef.current = window.document.activeElement as HTMLElement | null
    setOpenMenuId(id)
  }

  function closeMenu() {
    setOpenMenuId(null)
    lastFocusedRef.current?.focus()
  }

  useEffect(() => {
    if (!openMenuId) return
    firstMenuItemRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openMenuId])

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length > 0) onImport(files)
  }

  return (
    <div className="flex h-svh flex-col">
      <header
        className="flex items-center justify-between border-b border-border px-4 pb-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <h1 className="text-lg font-medium text-text-primary">Markdown Space</h1>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,text/markdown"
            multiple
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            type="button"
            aria-label="Importar documentos"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 items-center justify-center rounded-full text-accent hover:bg-surface"
          >
            <Upload className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Crear documento"
            onClick={onCreate}
            className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </header>

      {importNotice && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2">
          <p className={`text-sm ${importNotice.type === 'error' ? 'text-danger' : 'text-text-primary'}`}>
            {importNotice.message}
          </p>
          <button
            type="button"
            aria-label="Cerrar aviso"
            onClick={onDismissImportNotice}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-text-primary">No hay documentos</p>
          <p className="text-sm text-text-secondary">
            Importá tus archivos Markdown existentes, o creá uno nuevo.
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 rounded-md bg-accent px-6 text-white"
          >
            Importar archivos
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="text-sm text-text-secondary underline"
          >
            Crear documento nuevo
          </button>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {documents.map((document) => (
            <li key={document.id} className="relative flex items-center justify-between px-4">
              <button
                type="button"
                onClick={() => onOpen(document.id)}
                className="flex-1 py-3 text-left"
              >
                <p className="text-text-primary">{document.name}</p>
                <p className="text-sm text-text-secondary">
                  Editado {relativeTime(document.updatedAt)}
                </p>
              </button>

              <button
                type="button"
                aria-label="Más opciones"
                aria-haspopup="menu"
                aria-expanded={openMenuId === document.id}
                onClick={() =>
                  openMenuId === document.id ? closeMenu() : openMenu(document.id)
                }
                className="relative z-30 flex h-11 w-11 items-center justify-center text-text-secondary"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              {openMenuId === document.id && (
                <>
                  <button
                    type="button"
                    aria-label="Cerrar menú"
                    className="fixed inset-0 z-10 cursor-default"
                    onClick={closeMenu}
                  />
                  <div
                    role="menu"
                    className="absolute top-full right-4 z-20 w-44 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
                  >
                    <button
                      ref={firstMenuItemRef}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onDownload(document)
                        closeMenu()
                      }}
                      className="block w-full px-4 py-3 text-left text-text-primary hover:bg-editor-bg"
                    >
                      Descargar .md
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        onDeleteRequest(document.id)
                        closeMenu()
                      }}
                      className="block w-full px-4 py-3 text-left text-danger hover:bg-editor-bg"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
