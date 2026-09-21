export function formatFileSize(bytes: number): string {
  const kb = bytes / 1024
  if (kb < 1000) {
    return `${kb < 10 ? kb.toFixed(1) : Math.round(kb)} KB`
  }
  const mb = kb / 1024
  return `${mb.toFixed(1)} MB`
}
