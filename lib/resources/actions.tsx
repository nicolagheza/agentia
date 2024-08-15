'use server'

import {
  NewResourceParams,
  insertResourceSchema,
  resources
} from '@/lib/db/schema/resources'
import { db } from '../db'
import { generateEmbeddings } from '../ai/embedding'
import { embeddings as embeddingsTable } from '../db/schema/embeddings'
import { auth } from '@/auth'

export const createResource = async (input: NewResourceParams) => {
  try {
    const session = await auth()
    if (!session) throw new Error('Unauthorized')
    if (!session.user || !session.user.id)
      throw new Error('User or UserId missing')

    const { content, userId } = insertResourceSchema.parse({
      ...input,
      userId: session.user.id
    })

    const [resource] = await db
      .insert(resources)
      .values({ content, userId })
      .returning()

    const embeddings = await generateEmbeddings(content)
    await db.insert(embeddingsTable).values(
      embeddings.map(embedding => ({
        resourceId: resource.id,
        userId: userId,
        ...embedding
      }))
    )

    return 'Resource successfully created and embedded.'
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.'
  }
}
