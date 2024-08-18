'use server'

import {
  NewResourceParams,
  insertResourceSchema,
  resources
} from '@/lib/db/schema/resources'
import { db } from '../db'
import { generateEmbeddings } from '../embeddings/actions'
import { embeddings as embeddingsTable } from '../db/schema/embeddings'
import { auth } from '@/auth'
import { eq } from 'drizzle-orm'
import { Resource } from '../types'
import { generateObject } from 'ai'
import { z } from 'zod'
import { openai } from '@ai-sdk/openai'

export const createResource = async (
  input: Omit<NewResourceParams, 'userId'>
) => {
  try {
    const session = await auth()
    if (!session) throw new Error('Unauthorized')
    if (!session.user || !session.user.id)
      throw new Error('User or UserId missing')

    let _title: string | undefined
    const { content, title, userId } = insertResourceSchema.parse({
      ...input,
      userId: session.user.id
    })
    _title = title
    if (!_title) {
      const result = await generateObject({
        model: openai('gpt-4o-mini'),
        schema: z.object({
          title: z.string()
        }),
        prompt: `Create a title for the following content:\n\n${content}`
      })
      _title = result.object.title
    }

    const [resource] = await db
      .insert(resources)
      .values({ content, title: _title, userId })
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

export const getUserResources = async (): Promise<Resource[]> => {
  try {
    const session = await auth()
    if (!session) throw new Error('Unauthorized')
    if (!session.user || !session.user.id)
      throw new Error('User or UserId missing')

    const userResources = await db
      .select()
      .from(resources)
      .where(eq(resources.userId, session.user.id))

    return userResources as Resource[] // Ensure the return type is Resource[]
  } catch (error) {
    // Log the error if needed for debugging
    console.error(error)
    // Return an empty array on error
    return []
  }
}

export const deleteResource = async (id: string) => {
  try {
    const session = await auth()
    if (!session) throw new Error('Unauthorized')
    if (!session.user || !session.user.id)
      throw new Error('User or UserId missing')

    await db.delete(resources).where(eq(resources.id, id))

    return 'Resource successfully deleted.'
  } catch (error) {
    return error instanceof Error && error.message.length > 0
      ? error.message
      : 'Error, please try again.'
  }
}
