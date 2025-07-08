import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { rooms } from "./rooms.ts";

export const questions = pgTable('questions', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('roomId').references(() => rooms.id).notNull(),
  question: text().notNull(),
  answer: text(),
  createdAt: timestamp().defaultNow().notNull(),
})