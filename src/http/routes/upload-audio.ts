import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connetction.ts'
import { schema } from '../../db/schema/index.ts'
import { generateEmbeddings, transcribeAudio } from '../../services/gemini.ts'

export const uploadAudio: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms/:roomId/audio',
    {
      schema: {
        params: z.object({
          roomId: z.string()
        })
      }
    },
    async (request, reply) => {
      const { roomId } = request.params
      const audio = await request.file()
      if (!audio) {
        return reply.status(400).send({ error: 'Audio file is required' })
      }

      const audioBuffer = await audio.toBuffer()
      const audioAsBase64 = audioBuffer.toString('base64')
      const transcription = await transcribeAudio(audioAsBase64, audio.mimetype)
      const embeddings = await generateEmbeddings(transcription)

      const result = await db.insert(schema.audioChunks).values({
        roomId,
        transcription,
        embeddings
      }).returning()

      const chunk = result[0]

      if (!chunk) {
        return reply.status(500).send({ error: 'Failed to save audio chunk' })
      }

      return reply.status(200).send({ chunkId: chunk.id })
    }
  )
}
