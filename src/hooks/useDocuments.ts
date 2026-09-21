import { useCallback, useEffect, useState } from 'react'
import { documentRepository } from '../data/documentRepository'
import type { MarkdownDocument } from '../types/document'
import { ensureMdExtension } from '../utils/ensureMdExtension'

export function useDocuments() {
  const [documents, setDocuments] = useState<MarkdownDocument[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const refresh = useCallback(async () => {
    const all = await documentRepository.getAll()
    all.sort((a, b) => b.updatedAt - a.updatedAt)
    setDocuments(all)
  }, [])

  useEffect(() => {
    refresh().finally(() => setIsLoading(false))
  }, [refresh])

  const createDocument = useCallback(async (): Promise<MarkdownDocument> => {
    const name = await documentRepository.getNextAvailableName('untitled.md')
    const now = Date.now()
    const document: MarkdownDocument = {
      id: crypto.randomUUID(),
      name,
      content: '',
      createdAt: now,
      updatedAt: now,
    }
    await documentRepository.create(document)
    await refresh()
    return document
  }, [refresh])

  const importDocuments = useCallback(
    async (files: File[]): Promise<{ imported: MarkdownDocument[]; failedCount: number }> => {
      const imported: MarkdownDocument[] = []
      let failedCount = 0

      // Secuencial (no Promise.all): cada archivo debe ver los nombres ya
      // usados por los anteriores del mismo lote para resolver duplicados bien
      // (ej. dos archivos "readme.md" en el mismo lote -> readme.md, readme-2.md).
      for (const file of files) {
        try {
          const content = await file.text()
          const name = await documentRepository.getNextAvailableName(ensureMdExtension(file.name))
          const document: MarkdownDocument = {
            id: crypto.randomUUID(),
            name,
            content,
            // `createdAt` es cuándo se sumó a Markdown Space (no hay forma confiable de
            // saber la fecha de creación real del archivo). `updatedAt` sí usa la fecha
            // real de última modificación del archivo, para que "Editado hace X" y el
            // orden de la lista reflejen la edición real, no el momento de importación.
            createdAt: Date.now(),
            updatedAt: file.lastModified || Date.now(),
          }
          await documentRepository.create(document)
          imported.push(document)
        } catch {
          failedCount += 1
        }
      }

      await refresh()
      return { imported, failedCount }
    },
    [refresh],
  )

  const deleteDocument = useCallback(
    async (id: string): Promise<void> => {
      await documentRepository.delete(id)
      await refresh()
    },
    [refresh],
  )

  return { documents, isLoading, createDocument, importDocuments, deleteDocument, refresh }
}
