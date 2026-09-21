function storageKey(documentId: string): string {
  return `markdown-space.cursor.${documentId}`
}

export function getCursorPosition(documentId: string): number | undefined {
  const raw = localStorage.getItem(storageKey(documentId))
  if (raw === null) return undefined
  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed : undefined
}

export function saveCursorPosition(documentId: string, offset: number): void {
  localStorage.setItem(storageKey(documentId), String(offset))
}
