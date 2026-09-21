import type { MarkdownDocument } from '../types/document'

export function downloadMarkdown(document: MarkdownDocument): void {
  const blob = new Blob([document.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)

  const link = window.document.createElement('a')
  link.href = url
  link.download = document.name
  link.click()

  URL.revokeObjectURL(url)
}
