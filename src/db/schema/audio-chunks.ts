import { pgTable, text, timestamp, uuid, vector } from 'drizzle-orm/pg-core'
import { rooms } from './rooms.ts'


export const audioChunks = pgTable('audio_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('roomId').references(() => rooms.id).notNull(),
  transcription: text().notNull(),
  embeddings: vector({ dimensions: 768 }).notNull(),
  createdAt: timestamp().defaultNow().notNull()
})  