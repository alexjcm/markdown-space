import { useState } from 'react'
import { DEFAULT_EDITOR_THEME_ID, EDITOR_THEMES } from '../components/editorTheme'

const STORAGE_KEY = 'markdown-space.editorTheme'

function readPreference(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  const isValid = stored !== null && EDITOR_THEMES.some((theme) => theme.id === stored)
  return isValid ? stored : DEFAULT_EDITOR_THEME_ID
}

export function useEditorThemePreference() {
  const [themeId, setThemeIdState] = useState(readPreference)

  function setThemeId(next: string) {
    setThemeIdState(next)
    localStorage.setItem(STORAGE_KEY, next)
  }

  function reset() {
    setThemeId(DEFAULT_EDITOR_THEME_ID)
  }

  return { themeId, setThemeId, reset }
}
