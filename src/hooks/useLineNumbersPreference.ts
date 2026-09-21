import { useState } from 'react'

const STORAGE_KEY = 'markdown-space.showLineNumbers'

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

  return { showLineNumbers, toggle }
}
