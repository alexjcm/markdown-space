import { useCallback, useEffect, useRef, useState } from 'react'
import { documentRepository } from '../data/documentRepository'
import type { MarkdownDocument } from '../types/document'

const DEBOUNCE_MS = 600

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutosaveOptions {
  document: MarkdownDocument | undefined
  content: string
}

export function useAutosave({ document: doc, content }: UseAutosaveOptions) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latestRef = useRef({ doc, content })

  useEffect(() => {
    latestRef.current = { doc, content }
  })

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = undefined
    }

    const { doc, content } = latestRef.current
    if (!doc || content === doc.content) return

    const updated: MarkdownDocument = { ...doc, content, updatedAt: Date.now() }
    setStatus('saving')
    try {
      await documentRepository.update(updated)
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!doc || content === doc.content) return

    setStatus('saving')
    timeoutRef.current = setTimeout(flush, DEBOUNCE_MS)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [doc, content, flush])

  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') flush()
    }
    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  return { status, flush }
}
