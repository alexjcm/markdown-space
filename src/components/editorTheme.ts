import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const chrome = EditorView.theme(
  {
    '&': {
      color: '#d4d4d4',
      backgroundColor: '#1e1e1e',
      height: '100%',
      fontSize: '16px',
    },
    '.cm-content': {
      caretColor: '#007acc',
      fontFamily: 'ui-monospace, Consolas, monospace',
      padding: '16px',
      // No bottom bar in Editor mode: the content itself reserves space for
      // iOS's home indicator, as part of the scrollable area.
      paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#007acc',
    },
    '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
      backgroundColor: 'rgba(0, 122, 204, 0.35)',
    },
    '.cm-gutters': {
      backgroundColor: '#1e1e1e',
      color: '#858585',
      border: 'none',
    },
    '.cm-activeLine': {
      backgroundColor: '#252526',
    },
    '.cm-activeLineGutter': {
      backgroundColor: '#252526',
    },
    '&.cm-focused': {
      outline: 'none',
    },
  },
  { dark: true },
)

const highlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: '#d4d4d4', fontWeight: 'bold' },
  { tag: tags.strong, color: '#d4d4d4', fontWeight: 'bold' },
  { tag: tags.emphasis, color: '#d4d4d4', fontStyle: 'italic' },
  { tag: tags.strikethrough, color: '#858585', textDecoration: 'line-through' },
  { tag: tags.link, color: '#007acc', textDecoration: 'underline' },
  { tag: tags.url, color: '#007acc' },
  { tag: tags.monospace, color: '#d4d4d4' },
  { tag: tags.quote, color: '#858585', fontStyle: 'italic' },
  { tag: tags.list, color: '#858585' },
  { tag: [tags.processingInstruction, tags.meta], color: '#858585' },
])

export const markdownEditorTheme = [chrome, syntaxHighlighting(highlightStyle)]
