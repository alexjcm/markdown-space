export function splitFileName(name: string): { stem: string; extension: string } {
  const dotIndex = name.lastIndexOf('.')
  if (dotIndex <= 0) return { stem: name, extension: '' }
  return { stem: name.slice(0, dotIndex), extension: name.slice(dotIndex) }
}
