import { getDb, STORE_NAME, type StoredDocument } from './db'
import type { MarkdownDocument } from '../types/document'
import { normalizeName } from '../utils/normalizeName'
import { splitFileName } from '../utils/splitFileName'

function toPublicDocument({ nameKey: _nameKey, ...document }: StoredDocument): MarkdownDocument {
  // Records saved before `everEditedInApp` existed have no such field; treat
  // them as already edited so old, unrelated content isn't mislabeled "New".
  return { ...document, everEditedInApp: document.everEditedInApp ?? true }
}

async function getAll(): Promise<MarkdownDocument[]> {
  const db = await getDb()
  const stored = await db.getAll(STORE_NAME)
  return stored.map(toPublicDocument)
}

async function getById(id: string): Promise<MarkdownDocument | undefined> {
  const db = await getDb()
  const stored = await db.get(STORE_NAME, id)
  return stored ? toPublicDocument(stored) : undefined
}

async function create(document: MarkdownDocument): Promise<void> {
  const db = await getDb()
  const stored: StoredDocument = { ...document, nameKey: normalizeName(document.name) }
  await db.add(STORE_NAME, stored)
}

async function update(document: MarkdownDocument): Promise<void> {
  const db = await getDb()
  const stored: StoredDocument = { ...document, nameKey: normalizeName(document.name) }
  await db.put(STORE_NAME, stored)
}

async function deleteDocument(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE_NAME, id)
}

async function existsByName(name: string, excludeId?: string): Promise<boolean> {
  const db = await getDb()
  const match = await db.getFromIndex(STORE_NAME, 'nameKey', normalizeName(name))
  return match !== undefined && match.id !== excludeId
}

/**
 * Returns `baseName` if it's free; otherwise appends "-2", "-3"... before the
 * extension until it finds the first available name (fills in gaps).
 * Used both for `untitled.md` (creation) and for imported names.
 */
async function getNextAvailableName(baseName: string): Promise<string> {
  const db = await getDb()
  const stored = await db.getAll(STORE_NAME)
  const takenKeys = new Set(stored.map((document) => document.nameKey))

  if (!takenKeys.has(normalizeName(baseName))) return baseName

  const { stem, extension } = splitFileName(baseName)
  let n = 2
  while (true) {
    const candidate = `${stem}-${n}${extension}`
    if (!takenKeys.has(normalizeName(candidate))) return candidate
    n += 1
  }
}

export const documentRepository = {
  getAll,
  getById,
  create,
  update,
  delete: deleteDocument,
  existsByName,
  getNextAvailableName,
}
