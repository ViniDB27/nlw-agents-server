import type { FastifyPluginCallbackZod } from 'fastify-type-provider-zod'
import { z } from 'zod/v4'
import { db } from '../../db/connetction.ts'
import { schema } from '../../db/schema/index.ts'

export const createRoomRoute: FastifyPluginCallbackZod = (app) => {
  app.post(
    '/rooms',
    {
      schema: {
        body: z.object({
          name: z.string().min(1),
          description: z.string().optional(),
        }),
      },
    },
    async (request, apply) => {
      const { name, description } = request.body
      const results = await db
        .insert(schema.rooms)
        .values({
          name,
          description,
        })
        .returning()
      const insertedRoom = results[0]

      if (!insertedRoom) {
        throw new Error('Failed to create room')
      }

      return apply.status(201).send({ roomId: insertedRoom.id })
    }
  )
}
