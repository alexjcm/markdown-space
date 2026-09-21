export interface MarkdownDocument {
  id: string
  name: string
  content: string
  createdAt: number
  updatedAt: number
  /** True once the content has actually been changed inside the app, as opposed to just created or imported. */
  everEditedInApp: boolean
}
