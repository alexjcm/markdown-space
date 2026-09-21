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
  it('crea y obtiene un documento por id', async () => {
    const doc = makeDocument({ name: 'notes.md' })
    await documentRepository.create(doc)

    expect(await documentRepository.getById(doc.id)).toEqual(doc)
  })

  it('lista todos los documentos', async () => {
    await documentRepository.create(makeDocument({ name: 'a.md' }))
    await documentRepository.create(makeDocument({ name: 'b.md' }))

    expect(await documentRepository.getAll()).toHaveLength(2)
  })

  it('actualiza un documento existente', async () => {
    const doc = makeDocument({ name: 'notes.md' })
    await documentRepository.create(doc)

    const updated = { ...doc, content: 'hola', updatedAt: doc.updatedAt + 1000 }
    await documentRepository.update(updated)

    expect((await documentRepository.getById(doc.id))?.content).toBe('hola')
  })

  it('elimina un documento', async () => {
    const doc = makeDocument()
    await documentRepository.create(doc)
    await documentRepository.delete(doc.id)

    expect(await documentRepository.getById(doc.id)).toBeUndefined()
  })

  it('existsByName es insensible a mayúsculas', async () => {
    await documentRepository.create(makeDocument({ name: 'README.md' }))

    expect(await documentRepository.existsByName('readme.md')).toBe(true)
    expect(await documentRepository.existsByName('README.MD')).toBe(true)
    expect(await documentRepository.existsByName('other.md')).toBe(false)
  })

  it('existsByName excluye al propio documento con excludeId', async () => {
    const doc = makeDocument({ name: 'README.md' })
    await documentRepository.create(doc)

    expect(await documentRepository.existsByName('readme.md', doc.id)).toBe(false)
  })

  it('genera untitled.md como primer nombre disponible', async () => {
    expect(await documentRepository.getNextAvailableName('untitled.md')).toBe('untitled.md')
  })

  it('rellena el hueco más bajo libre en los nombres untitled', async () => {
    await documentRepository.create(makeDocument({ name: 'untitled.md' }))
    await documentRepository.create(makeDocument({ name: 'untitled-3.md' }))

    expect(await documentRepository.getNextAvailableName('untitled.md')).toBe('untitled-2.md')
  })

  it('genera nombres disponibles para una base arbitraria (importar)', async () => {
    await documentRepository.create(makeDocument({ name: 'archivo.md' }))

    expect(await documentRepository.getNextAvailableName('archivo.md')).toBe('archivo-2.md')
  })

  it('impide crear dos documentos con nombres duplicados (case-insensitive)', async () => {
    await documentRepository.create(makeDocument({ name: 'notes.md' }))

    await expect(documentRepository.create(makeDocument({ name: 'Notes.md' }))).rejects.toThrow()
  })
})
