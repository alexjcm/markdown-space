export function ensureMdExtension(name: string): string {
  return name.toLowerCase().endsWith('.md') ? name : `${name}.md`
}
