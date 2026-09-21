import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { MarkdownDocument } from '../types/document'

const DB_NAME = 'markdown-space'
const DB_VERSION = 1
export const STORE_NAME = 'documents'

export interface StoredDocument extends MarkdownDocument {
  nameKey: string
}

export interface MarkdownSpaceDB extends DBSchema {
  documents: {
    key: string
    value: StoredDocument
    indexes: {
      updatedAt: number
      nameKey: string
    }
  }
}

let dbPromise: Promise<IDBPDatabase<MarkdownSpaceDB>> | undefined

export function getDb(): Promise<IDBPDatabase<MarkdownSpaceDB>> {
  if (!dbPromise) {
    dbPromise = openDB<MarkdownSpaceDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
        store.createIndex('nameKey', 'nameKey', { unique: true })
      },
    })
  }
  return dbPromise
}
