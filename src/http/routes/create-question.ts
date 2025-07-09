import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connetction.ts'
import { schema } from '../../db/schema/index.ts'
import { generateAnswer, generateEmbeddings } from '../../services/gemini.ts'
import { and, eq, sql } from 'drizzle-orm'

export const createQuestionRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/questions',
    {
      schema: {
        params: z.object({
          roomId: z.string()
        }),
        body: z.object({
          question: z.string().min(1)
        })
      }
    },
    async (request, reply) => {
      const { roomId } = request.params
      const { question } = request.body
      const embeddings = await generateEmbeddings(question)
      const embeddingsAsString = `[${embeddings.join(',')}]`

      const chunks = await db.select({
        id: schema.audioChunks.id,
        transcription: schema.audioChunks.transcription,
        similarity: sql<number>`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector)`,
      })
        .from(schema.audioChunks)
        .where(and(
          eq(schema.audioChunks.roomId, roomId),
          sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) > 0.7`
        ))
        .orderBy(sql`1 - (${schema.audioChunks.embeddings} <=> ${embeddingsAsString}::vector) DESC`)
        .limit(3)
      
      let answer: string| null = null
      
      if(chunks.length > 0) {
        const transcriptions = chunks.map((chunk) => chunk.transcription)
        answer = await generateAnswer(question, transcriptions)
      }
      
      const results = await db
        .insert(schema.questions)
        .values({
          question,
          roomId,
          answer
        })
        .returning()
      const insertedQuestion = results[0]

      if (!insertedQuestion) {
        throw new Error('Failed to create question')
      }

      return reply.status(201).send({ roomId: insertedQuestion.id, answer })
    }
  )
}
