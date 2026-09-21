import { beforeEach, describe, expect, it } from 'vitest'
import type { MarkdownDocument } from '../types/document'
import { getDb, STORE_NAME } from './db'
import { documentRepository } from './documentRepository'

function makeDocument(overrides: Partial<MarkdownDocument> = {}): MarkdownDocument {
  const now = Date.now()
  return {
    id: crypto.randomUUID(),
    name: 'untitled.md',
    content: '',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

beforeEach(async () => {
  const db = await getDb()
  await db.clear(STORE_NAME)
})

describe('documentRepository', () => {
  it('creates and retrieves a document by id', async () => {
    const doc = makeDocument({ name: 'notes.md' })
    await documentRepository.create(doc)

    expect(await documentRepository.getById(doc.id)).toEqual(doc)
  })

  it('lists all documents', async () => {
    await documentRepository.create(makeDocument({ name: 'a.md' }))
    await documentRepository.create(makeDocument({ name: 'b.md' }))

    expect(await documentRepository.getAll()).toHaveLength(2)
  })

  it('updates an existing document', async () => {
    const doc = makeDocument({ name: 'notes.md' })
    await documentRepository.create(doc)

    const updated = { ...doc, content: 'hello', updatedAt: doc.updatedAt + 1000 }
    await documentRepository.update(updated)

    expect((await documentRepository.getById(doc.id))?.content).toBe('hello')
  })

  it('deletes a document', async () => {
    const doc = makeDocument()
    await documentRepository.create(doc)
    await documentRepository.delete(doc.id)

    expect(await documentRepository.getById(doc.id)).toBeUndefined()
  })

  it('existsByName is case-insensitive', async () => {
    await documentRepository.create(makeDocument({ name: 'README.md' }))

    expect(await documentRepository.existsByName('readme.md')).toBe(true)
    expect(await documentRepository.existsByName('README.MD')).toBe(true)
    expect(await documentRepository.existsByName('other.md')).toBe(false)
  })

  it('existsByName excludes the document itself via excludeId', async () => {
    const doc = makeDocument({ name: 'README.md' })
    await documentRepository.create(doc)

    expect(await documentRepository.existsByName('readme.md', doc.id)).toBe(false)
  })

  it('generates untitled.md as the first available name', async () => {
    expect(await documentRepository.getNextAvailableName('untitled.md')).toBe('untitled.md')
  })

  it('fills the lowest free gap in untitled names', async () => {
    await documentRepository.create(makeDocument({ name: 'untitled.md' }))
    await documentRepository.create(makeDocument({ name: 'untitled-3.md' }))

    expect(await documentRepository.getNextAvailableName('untitled.md')).toBe('untitled-2.md')
  })

  it('generates available names for an arbitrary base (import)', async () => {
    await documentRepository.create(makeDocument({ name: 'file.md' }))

    expect(await documentRepository.getNextAvailableName('file.md')).toBe('file-2.md')
  })

  it('prevents creating two documents with duplicate names (case-insensitive)', async () => {
    await documentRepository.create(makeDocument({ name: 'notes.md' }))

    await expect(documentRepository.create(makeDocument({ name: 'Notes.md' }))).rejects.toThrow()
  })
})
