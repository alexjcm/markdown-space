import { MoreVertical, Plus, Search, Upload, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { MarkdownDocument } from '../types/document'
import { formatDateTime } from '../utils/formatDateTime'
import { formatFileSize } from '../utils/formatFileSize'

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
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const filteredDocuments = useMemo(() => {
    const trimmed = query.trim().toLowerCase()
    if (!trimmed) return documents
    return documents.filter(
      (document) =>
        document.name.toLowerCase().includes(trimmed) ||
        document.content.toLowerCase().includes(trimmed),
    )
  }, [documents, query])

  function openSearch() {
    setIsSearchOpen(true)
  }

  function closeSearch() {
    setIsSearchOpen(false)
    setQuery('')
  }

  useEffect(() => {
    if (!isSearchOpen) return
    searchInputRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeSearch()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSearchOpen])

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
        className="flex items-center justify-between gap-2 border-b border-border px-4 pb-4"
        style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,text/markdown"
          multiple
          className="hidden"
          onChange={handleFileSelected}
        />
        {isSearchOpen ? (
          <>
            <button
              type="button"
              aria-label="Close search"
              onClick={closeSearch}
              className="flex h-11 w-11 shrink-0 items-center justify-center text-text-secondary"
            >
              <X className="h-5 w-5" />
            </button>
            <input
              ref={searchInputRef}
              type="text"
              inputMode="search"
              enterKeyHint="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search documents…"
              className="h-11 min-w-0 flex-1 bg-transparent text-text-primary placeholder:text-text-secondary focus:outline-none"
            />
          </>
        ) : (
          <>
            <h1 className="text-lg font-medium text-text-primary">Markdown Space</h1>
            <div className="flex items-center gap-2">
              {documents.length > 0 && (
                <button
                  type="button"
                  aria-label="Search documents"
                  onClick={openSearch}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
                >
                  <Search className="h-5 w-5" />
                </button>
              )}
              <button
                type="button"
                aria-label="Import documents"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 w-11 items-center justify-center rounded-full text-accent hover:bg-surface"
              >
                <Upload className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Create document"
                onClick={onCreate}
                className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
              >
                <Plus className="h-6 w-6" />
              </button>
            </div>
          </>
        )}
      </header>

      {importNotice && (
        <div className="flex items-center justify-between gap-2 border-b border-border bg-surface px-4 py-2">
          <p className={`text-sm ${importNotice.type === 'error' ? 'text-danger' : 'text-text-primary'}`}>
            {importNotice.message}
          </p>
          <button
            type="button"
            aria-label="Dismiss notice"
            onClick={onDismissImportNotice}
            className="flex h-8 w-8 shrink-0 items-center justify-center text-text-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <p className="text-text-primary">No documents yet</p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="h-11 rounded-md bg-accent px-6 text-white"
          >
            Import files
          </button>
          <button
            type="button"
            onClick={onCreate}
            className="text-sm text-text-secondary underline"
          >
            Create new document
          </button>
        </div>
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
          <p className="text-text-primary">No results for "{query}"</p>
          <p className="text-sm text-text-secondary">Try a different name or word from the content.</p>
        </div>
      ) : (
        <ul className="flex-1 divide-y divide-border overflow-y-auto">
          {filteredDocuments.map((document) => (
            <li
              key={document.id}
              className={`relative flex items-center justify-between px-4 ${openMenuId === document.id ? 'bg-surface' : ''}`}
            >
              <button
                type="button"
                onClick={() => onOpen(document.id)}
                className="min-w-0 flex-1 py-3 text-left"
              >
                <div className="flex items-center gap-2">
                  <p className="truncate text-text-primary">{document.name}</p>
                  {!document.everEditedInApp && (
                    <span className="shrink-0 rounded-full bg-accent/20 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      New
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-text-secondary">
                  {formatDateTime(document.updatedAt)} -{' '}
                  {formatFileSize(new TextEncoder().encode(document.content).length)}
                </p>
              </button>

              <button
                type="button"
                aria-label="More options"
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
                    aria-label="Close menu"
                    className="fixed inset-0 z-10 cursor-default bg-black/20"
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
                      Download .md
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
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="border-t border-border px-4 py-2 text-center text-xs text-text-secondary">
        v{__APP_VERSION__}
      </p>
    </div>
  )
}
