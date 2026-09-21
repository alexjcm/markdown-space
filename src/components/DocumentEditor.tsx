import { markdown } from '@codemirror/lang-markdown'
import { redo, redoDepth, undo, undoDepth } from '@codemirror/commands'
import { EditorView } from '@codemirror/view'
import CodeMirror, { type ReactCodeMirrorRef, type ViewUpdate } from '@uiw/react-codemirror'
import { ArrowLeft, Eye, MoreVertical, Pencil, Redo2, Undo2 } from 'lucide-react'
import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useAutosave } from '../hooks/useAutosave'
import { useLineNumbersPreference } from '../hooks/useLineNumbersPreference'
import { useRenameDocument } from '../hooks/useRenameDocument'
import type { MarkdownDocument } from '../types/document'
import { getCursorPosition, saveCursorPosition } from '../utils/cursorPositionStorage'
import { markdownEditorTheme } from './editorTheme'

// react-markdown + remark-gfm are only downloaded when toggling Preview,
// not when opening the editor.
const MarkdownPreview = lazy(() =>
  import('./MarkdownPreview').then((module) => ({ default: module.MarkdownPreview })),
)

interface DocumentEditorProps {
  document: MarkdownDocument | undefined
  onBack: () => void
}

function statusLabel(status: ReturnType<typeof useAutosave>['status']): string | null {
  switch (status) {
    case 'saving':
      return 'Saving…'
    case 'saved':
      return 'Saved'
    case 'error':
      return 'Error saving'
    default:
      return null
  }
}

export function DocumentEditor({ document, onBack }: DocumentEditorProps) {
  const editorRef = useRef<ReactCodeMirrorRef>(null)
  const renameInputRef = useRef<HTMLInputElement>(null)
  const firstMenuItemRef = useRef<HTMLButtonElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)
  const { showLineNumbers, toggle: toggleLineNumbers } = useLineNumbersPreference()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mode, setMode] = useState<'editor' | 'preview'>('editor')
  const [content, setContent] = useState(document?.content ?? '')
  const [name, setName] = useState(document?.name ?? '')
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)
  const [initialCursor] = useState(() => (document ? getCursorPosition(document.id) : undefined))

  const documentWithCurrentName = useMemo(
    () => (document ? { ...document, name } : undefined),
    [document, name],
  )
  const { status, flush } = useAutosave({ document: documentWithCurrentName, content })
  const rename = useRenameDocument({ document, onRenamed: setName })

  useEffect(() => {
    // The blur that triggers validation removes focus from the input; if it
    // failed, we give it back so the user can fix it without another tap/click.
    if (rename.error) renameInputRef.current?.focus()
  }, [rename.error])

  function openMenu() {
    lastFocusedRef.current = window.document.activeElement as HTMLElement | null
    setIsMenuOpen(true)
  }

  function closeMenu() {
    setIsMenuOpen(false)
    lastFocusedRef.current?.focus()
  }

  useEffect(() => {
    if (!isMenuOpen) return
    firstMenuItemRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMenuOpen])

  useEffect(() => {
    // When opening the document, centers the view on the position where the
    // cursor last was, instead of always starting from the beginning.
    if (initialCursor === undefined) return
    const view = editorRef.current?.view
    if (!view) return
    const pos = Math.min(initialCursor, view.state.doc.length)
    view.dispatch({ effects: EditorView.scrollIntoView(pos, { y: 'center' }) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!document) {
    return (
      <div className="flex h-svh flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-text-primary">Document not found</p>
        <button
          type="button"
          onClick={onBack}
          className="h-11 rounded-md bg-accent px-6 text-white"
        >
          Back to list
        </button>
      </div>
    )
  }

  const documentId = document.id

  async function handleBack() {
    await flush()
    onBack()
  }

  function handleUndo() {
    const view = editorRef.current?.view
    if (view) undo(view)
  }

  function handleRedo() {
    const view = editorRef.current?.view
    if (view) redo(view)
  }

  function handleEditorUpdate(viewUpdate: ViewUpdate) {
    setCanUndo(undoDepth(viewUpdate.state) > 0)
    setCanRedo(redoDepth(viewUpdate.state) > 0)
    if (viewUpdate.selectionSet) {
      saveCursorPosition(documentId, viewUpdate.state.selection.main.head)
    }
  }

  const label = statusLabel(status)

  return (
    <div className="flex h-svh flex-col">
      <header
        className="relative flex items-center gap-3 border-b border-border px-4 pb-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          aria-label="Back"
          onClick={handleBack}
          className="flex h-11 w-11 items-center justify-center text-text-secondary"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1">
          {rename.isEditing ? (
            <input
              ref={renameInputRef}
              autoFocus
              enterKeyHint="done"
              value={rename.draft}
              onChange={(event) => rename.setDraft(event.target.value)}
              onFocus={(event) => event.target.select()}
              onBlur={rename.commit}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  event.currentTarget.blur()
                } else if (event.key === 'Escape') {
                  event.preventDefault()
                  rename.cancel()
                }
              }}
              className="w-full border-b border-accent bg-transparent text-text-primary outline-none"
            />
          ) : (
            <button
              type="button"
              onClick={rename.start}
              className="block w-full truncate text-left text-text-primary"
            >
              {name}
            </button>
          )}

          {rename.error ? (
            <p className="text-xs text-danger">{rename.error}</p>
          ) : (
            label && (
              <p
                className={`flex items-center gap-2 text-xs ${status === 'error' ? 'text-danger' : 'text-text-secondary'}`}
              >
                {label}
                {status === 'error' && (
                  <button type="button" onClick={() => flush()} className="underline">
                    Retry
                  </button>
                )}
              </p>
            )
          )}
        </div>

        <button
          type="button"
          aria-label={mode === 'editor' ? 'Preview' : 'Edit'}
          onClick={() => setMode(mode === 'editor' ? 'preview' : 'editor')}
          className="flex h-11 w-11 items-center justify-center rounded-full text-text-secondary hover:bg-surface"
        >
          {mode === 'editor' ? <Eye className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
        </button>

        <button
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded={isMenuOpen}
          onClick={() => (isMenuOpen ? closeMenu() : openMenu())}
          className="relative z-30 flex h-11 w-11 items-center justify-center text-text-secondary"
        >
          <MoreVertical className="h-5 w-5" />
        </button>

        {isMenuOpen && (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-10 cursor-default"
              onClick={closeMenu}
            />
            <div
              role="menu"
              className="absolute top-full right-4 z-20 w-60 overflow-hidden rounded-md border border-border bg-surface shadow-lg"
            >
              <button
                ref={firstMenuItemRef}
                type="button"
                role="menuitemcheckbox"
                aria-checked={showLineNumbers}
                onClick={() => {
                  toggleLineNumbers()
                  closeMenu()
                }}
                className="block w-full px-4 py-3 text-left text-text-primary hover:bg-editor-bg"
              >
                {showLineNumbers ? 'Hide line numbers' : 'Show line numbers'}
              </button>
              <p className="border-t border-border px-4 py-2 text-xs text-text-secondary">
                v{__APP_VERSION__}
              </p>
            </div>
          </>
        )}
      </header>

      {mode === 'editor' && (
        <div className="flex items-center gap-1 border-b border-border px-2 py-1">
          <button
            type="button"
            onClick={handleUndo}
            disabled={!canUndo}
            aria-label="Undo"
            className="flex h-11 w-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface disabled:pointer-events-none disabled:opacity-30"
          >
            <Undo2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={!canRedo}
            aria-label="Redo"
            className="flex h-11 w-11 items-center justify-center rounded-md text-text-secondary hover:bg-surface disabled:pointer-events-none disabled:opacity-30"
          >
            <Redo2 className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="min-h-0 flex-1">
        {mode === 'editor' ? (
          <CodeMirror
            ref={editorRef}
            value={content}
            onChange={setContent}
            onUpdate={handleEditorUpdate}
            theme={markdownEditorTheme}
            extensions={[markdown({ addKeymap: false }), EditorView.lineWrapping]}
            basicSetup={{
              lineNumbers: showLineNumbers,
              foldGutter: false,
            }}
            selection={
              initialCursor !== undefined
                ? { anchor: Math.min(initialCursor, content.length) }
                : undefined
            }
            height="100%"
            className="h-full"
          />
        ) : (
          <Suspense
            fallback={
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-text-secondary">Loading preview…</p>
              </div>
            }
          >
            <MarkdownPreview content={content} />
          </Suspense>
        )}
      </div>
    </div>
  )
}
