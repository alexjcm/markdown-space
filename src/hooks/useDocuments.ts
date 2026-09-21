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
      everEditedInApp: false,
    }
    await documentRepository.create(document)
    await refresh()
    return document
  }, [refresh])

  const importDocuments = useCallback(
    async (files: File[]): Promise<{ imported: MarkdownDocument[]; failedCount: number }> => {
      const imported: MarkdownDocument[] = []
      let failedCount = 0

      // Sequential (not Promise.all): each file must see the names already
      // used by the previous ones in the same batch to resolve duplicates
      // correctly (e.g. two "readme.md" files in the same batch -> readme.md, readme-2.md).
      for (const file of files) {
        try {
          const content = await file.text()
          const name = await documentRepository.getNextAvailableName(ensureMdExtension(file.name))
          const document: MarkdownDocument = {
            id: crypto.randomUUID(),
            name,
            content,
            // `createdAt` is when it was added to Markdown Space (there's no reliable
            // way to know the file's real creation date). `updatedAt` does use the
            // file's real last-modified date, so the displayed date and the list
            // order reflect the actual edit, not the import moment.
            createdAt: Date.now(),
            updatedAt: file.lastModified || Date.now(),
            everEditedInApp: false,
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
