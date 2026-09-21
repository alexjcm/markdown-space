import { useEffect, useRef } from 'react'

interface ConfirmDialogProps {
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    previouslyFocusedRef.current = window.document.activeElement as HTMLElement | null
    cancelButtonRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      previouslyFocusedRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    // biome-ignore-start -- backdrop closes the dialog; the dialog itself stops propagation
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="w-full max-w-sm rounded-t-lg border border-border bg-surface p-4 sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirm-dialog-title" className="text-base font-medium text-text-primary">
          {title}
        </h2>
        <p id="confirm-dialog-description" className="mt-2 text-sm text-text-secondary">
          {description}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="h-11 rounded-md px-4 text-text-secondary hover:bg-editor-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="h-11 rounded-md bg-danger px-4 text-white"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
    // biome-ignore-end
  )
}
