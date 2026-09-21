import { useRef, useState } from 'react'
import { documentRepository } from '../data/documentRepository'
import type { MarkdownDocument } from '../types/document'
import { ensureMdExtension } from '../utils/ensureMdExtension'

interface UseRenameDocumentOptions {
  document: MarkdownDocument | undefined
  onRenamed: (name: string) => void
}

export function useRenameDocument({ document, onRenamed }: UseRenameDocumentOptions) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(document?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const skipNextBlurRef = useRef(false)

  function start() {
    if (!document) return
    setDraft(document.name)
    setError(null)
    setIsEditing(true)
  }

  function cancel() {
    skipNextBlurRef.current = true
    setIsEditing(false)
    setError(null)
  }

  async function commit() {
    if (skipNextBlurRef.current) {
      skipNextBlurRef.current = false
      return
    }
    if (!document) return

    const trimmed = draft.trim()
    if (!trimmed) {
      setError('Name cannot be empty.')
      return
    }

    const candidate = ensureMdExtension(trimmed)

    if (candidate === document.name) {
      setIsEditing(false)
      setError(null)
      return
    }

    const isDuplicate = await documentRepository.existsByName(candidate, document.id)
    if (isDuplicate) {
      setError('A file with that name already exists.')
      return
    }

    await documentRepository.update({ ...document, name: candidate, updatedAt: Date.now() })
    onRenamed(candidate)
    setIsEditing(false)
    setError(null)
  }

  return { isEditing, draft, setDraft, error, start, cancel, commit }
}
