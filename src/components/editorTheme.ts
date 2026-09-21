import { Prec, type Extension, type Range } from '@codemirror/state'
import { HighlightStyle, LanguageDescription, syntaxHighlighting, syntaxTree } from '@codemirror/language'
import { Decoration, type DecorationSet, EditorView, ViewPlugin, type ViewUpdate } from '@codemirror/view'
import { tags } from '@lezer/highlight'

// Real nested syntax highlighting for fenced code blocks whose info string
// names a supported language — chosen from the actual languages found across
// a real 43-file document sample (java: 6 blocks, json: 3, sql: 1; the ~90%
// majority with no info string or "text" needs no highlighting at all). Each
// `load()` is a dynamic import: CodeMirror shows the block unhighlighted
// until it resolves, then re-highlights — none of these packages inflate the
// initial editor bundle, only whichever language a document actually uses.
export const fencedCodeLanguages: LanguageDescription[] = [
  LanguageDescription.of({
    name: 'json',
    alias: ['json'],
    load: () => import('@codemirror/lang-json').then((m) => m.json()),
  }),
  LanguageDescription.of({
    name: 'java',
    alias: ['java'],
    load: () => import('@codemirror/lang-java').then((m) => m.java()),
  }),
  LanguageDescription.of({
    name: 'sql',
    alias: ['sql'],
    load: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  }),
]

function isRecognizedFencedCodeLanguage(info: string): boolean {
  return LanguageDescription.matchLanguageName(fencedCodeLanguages, info, true) !== null
}

// @lezer/markdown maps both inline code spans and the raw text inside fenced
// code blocks to the same "CodeText" node ("InlineCode CodeText":
// tags.monospace), so a HighlightStyle can't color them differently — and
// overriding just "FencedCode/CodeText" via a second styleTags source
// doesn't work either: @lezer/common's NodeSet.extend merges rule chains
// from different sources without re-sorting by context specificity, so the
// base (context-less) rule still wins. A decoration that force-sets color on
// fenced code ranges sidesteps the parser tagging system entirely — real VS
// Code renders unlabeled fenced blocks as plain text, not a special color,
// unlike inline code. Blocks with a recognized language name are skipped
// here — they already get real nested highlighting from `codeLanguages`
// (eventually, once loaded), which this would otherwise undo.
function createFencedCodePlainText(foregroundColor: string): Extension {
  const mark = Decoration.mark({ attributes: { style: `color: ${foregroundColor} !important` } })

  function buildDecorations(view: EditorView): DecorationSet {
    const ranges: Range<Decoration>[] = []
    for (const { from, to } of view.visibleRanges) {
      syntaxTree(view.state).iterate({
        from,
        to,
        enter: (node) => {
          if (node.name !== 'FencedCode') return
          let info = ''
          let codeText: { from: number; to: number } | null = null
          for (let child = node.node.firstChild; child; child = child.nextSibling) {
            if (child.name === 'CodeInfo') info = view.state.doc.sliceString(child.from, child.to)
            else if (child.name === 'CodeText') codeText = { from: child.from, to: child.to }
          }
          if (codeText && !isRecognizedFencedCodeLanguage(info)) {
            ranges.push(mark.range(codeText.from, codeText.to))
          }
        },
      })
    }
    return Decoration.set(ranges, true)
  }

  // Higher-precedence decorations render as the innermost DOM node, so this
  // must outrank `syntaxHighlighting()` — otherwise its span (with its own
  // explicit color) ends up nested *inside* ours and wins visually, since
  // the innermost element's own color always renders, regardless of what an
  // ancestor's `!important` says.
  return Prec.highest(
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet
        constructor(view: EditorView) {
          this.decorations = buildDecorations(view)
        }
        update(update: ViewUpdate) {
          if (update.docChanged || update.viewportChanged) {
            this.decorations = buildDecorations(update.view)
          }
        }
      },
      { decorations: (plugin) => plugin.decorations },
    ),
  )
}

// Layout-only rules (padding, font size, safe areas): identical across every
// color theme, so it's kept separate from the swappable palette below.
export function createEditorLayout(fontSize: number): Extension {
  return EditorView.theme({
    '&': {
      // Not a fixed 100%: the editor grows past the viewport for long
      // documents (its parent scrolls, see the wrapping div in
      // DocumentEditor), while still filling the screen for short ones.
      minHeight: '100%',
      fontSize: `${fontSize}px`,
    },
    '.cm-content': {
      fontFamily: "Menlo, Monaco, Consolas, 'Courier New', monospace",
      padding: '8px',
      paddingLeft: '4px',
      // Matches the tightened left padding (see the gutter rule below) —
      // reclaims horizontal space on narrow mobile viewports on both sides.
      paddingRight: '1px',
      // The version footer after the editor now reserves the iOS home
      // indicator's safe area, so this only needs a plain bottom gap.
      paddingBottom: '16px',
    },
    '&.cm-focused': {
      outline: 'none',
    },
    // Default is 5px, pushing line numbers away from the screen's left edge —
    // tightened to reclaim horizontal space on narrow mobile viewports.
    '.cm-lineNumbers .cm-gutterElement': {
      paddingLeft: '2px',
    },
  })
}

// Colors verified against microsoft/vscode's own theme-defaults source
// (dark_modern.json, chained to dark_plus.json / dark_vs.json), not guessed.
const vscodeDarkChrome = EditorView.theme(
  {
    '&': {
      color: '#cccccc',
      backgroundColor: '#1f1f1f',
    },
    '.cm-content': {
      caretColor: '#007acc',
    },
    '.cm-cursor, .cm-dropCursor': {
      borderLeftColor: '#007acc',
    },
    // CodeMirror's own base theme targets the focused selection with
    // "&dark.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground"
    // (background: #233) — more specific than a plain ".cm-selectionBackground"
    // rule, so it silently won over the color below without `!important`,
    // making selected text nearly indistinguishable from the background.
    // Colors verified against VS Code's own defaults (editor.selectionBackground
    // #264f78, editor.inactiveSelectionBackground #3a3d41 — dark_vs.json).
    '.cm-selectionBackground': {
      backgroundColor: '#3a3d41 !important',
    },
    '&.cm-focused .cm-selectionBackground': {
      backgroundColor: '#264f78 !important',
    },
    '.cm-content ::selection': {
      backgroundColor: '#264f78 !important',
    },
    '.cm-gutters': {
      backgroundColor: '#1f1f1f',
      color: '#6e7681',
      border: 'none',
    },
    '.cm-activeLineGutter': {
      color: '#cccccc',
      backgroundColor: '#252526',
    },
    '.cm-activeLine': {
      backgroundColor: '#252526',
    },
  },
  { dark: true },
)

const vscodeDarkHighlightStyle = HighlightStyle.define([
  { tag: tags.heading, color: '#569cd6', fontWeight: 'bold' },
  { tag: tags.strong, color: '#569cd6', fontWeight: 'bold' },
  { tag: tags.emphasis, color: '#c586c0', fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.link, color: '#cccccc', textDecoration: 'underline' },
  { tag: tags.url, color: '#cccccc' },
  { tag: tags.monospace, color: '#ce9178' },
  { tag: tags.quote, color: '#6a9955', fontStyle: 'italic' },
  // The language label after a fence's backticks (e.g. "ts" in ```ts) is
  // markdown syntax, not content — muted the same as the backticks
  // themselves instead of inheriting the plain foreground color.
  { tag: tags.labelName, color: '#6e7681' },
  // No color for tags.list: @lezer/markdown applies it to the whole list
  // subtree, not just the marker, so coloring it would tint entire list
  // item text (not just the "-"/"1." marker, which VS Code colors). The
  // marker itself already gets a subtle tint via processingInstruction.
  { tag: [tags.processingInstruction, tags.meta], color: '#6e7681' },
  // Programming-language tokens, for nested highlighting inside fenced code
  // blocks (see `fencedCodeLanguages`). Colors verified the same way as the
  // markdown rules above, against dark_vs.json / dark_plus.json.
  { tag: [tags.keyword, tags.modifier, tags.self], color: '#569cd6' },
  { tag: tags.string, color: '#ce9178' },
  { tag: tags.number, color: '#b5cea8' },
  { tag: [tags.bool, tags.null], color: '#569cd6' },
  { tag: tags.comment, color: '#6a9955', fontStyle: 'italic' },
  { tag: tags.propertyName, color: '#9cdcfe' },
  { tag: [tags.typeName, tags.className], color: '#4ec9b0' },
  { tag: tags.function(tags.variableName), color: '#dcdcaa' },
  { tag: tags.operator, color: '#cccccc' },
])

// Bundled eagerly: it's the default theme, shown immediately to every user
// without a network wait. Monokai and Dracula are loaded on demand instead
// (see `loadEditorThemePalette`), so picking either is the only thing that
// pulls their package into the browser.
export const vscodeDarkPalette: Extension[] = [
  vscodeDarkChrome,
  syntaxHighlighting(vscodeDarkHighlightStyle),
  createFencedCodePlainText('#cccccc'),
]

export interface EditorThemeOption {
  id: string
  label: string
}

// Capped at 3: VS Code Dark Modern (ours, hand-rolled to match exactly) plus
// the two most recognizable options from `@uiw/codemirror-theme-*`, which
// already ship their own syntax highlighting.
export const EDITOR_THEMES: EditorThemeOption[] = [
  { id: 'vscode-dark', label: 'Dark Modern' },
  { id: 'monokai', label: 'Monokai' },
  { id: 'dracula', label: 'Dracula' },
]

export const DEFAULT_EDITOR_THEME_ID = EDITOR_THEMES[0].id

export async function loadEditorThemePalette(themeId: string): Promise<Extension[]> {
  if (themeId === 'monokai') {
    const { monokai } = await import('@uiw/codemirror-theme-monokai')
    return [monokai, createFencedCodePlainText('#f8f8f2')]
  }
  if (themeId === 'dracula') {
    const { dracula } = await import('@uiw/codemirror-theme-dracula')
    return [dracula, createFencedCodePlainText('#f8f8f2')]
  }
  return vscodeDarkPalette
}
