import { useState } from 'react'

const STORAGE_KEY = 'markdown-space.editorFontSize'
const MIN_FONT_SIZE = 12
const MAX_FONT_SIZE = 22
const DEFAULT_FONT_SIZE = 14

function clamp(value: number): number {
  return Math.min(MAX_FONT_SIZE, Math.max(MIN_FONT_SIZE, value))
}

function readPreference(): number {
  const raw = localStorage.getItem(STORAGE_KEY)
  const parsed = raw === null ? Number.NaN : Number(raw)
  return Number.isFinite(parsed) ? clamp(parsed) : DEFAULT_FONT_SIZE
}

export function useFontSizePreference() {
  const [fontSize, setFontSize] = useState(readPreference)

  function step(delta: number) {
    setFontSize((current) => {
      const next = clamp(current + delta)
      localStorage.setItem(STORAGE_KEY, String(next))
      return next
    })
  }

  function reset() {
    localStorage.setItem(STORAGE_KEY, String(DEFAULT_FONT_SIZE))
    setFontSize(DEFAULT_FONT_SIZE)
  }

  return {
    fontSize,
    increase: () => step(1),
    decrease: () => step(-1),
    canIncrease: fontSize < MAX_FONT_SIZE,
    canDecrease: fontSize > MIN_FONT_SIZE,
    reset,
  }
}
