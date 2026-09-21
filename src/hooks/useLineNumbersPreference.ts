import { useState } from 'react'

const STORAGE_KEY = 'markdown-space.showLineNumbers'
const DEFAULT_SHOW_LINE_NUMBERS = false

function readPreference(): boolean {
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function useLineNumbersPreference() {
  const [showLineNumbers, setShowLineNumbers] = useState(readPreference)

  function toggle() {
    setShowLineNumbers((current) => {
      const next = !current
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  function reset() {
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_SHOW_LINE_NUMBERS))
    setShowLineNumbers(DEFAULT_SHOW_LINE_NUMBERS)
  }

  return { showLineNumbers, toggle, reset }
}
