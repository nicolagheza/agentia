import { nanoid } from '@/lib/utils'
import { createSelectSchema } from 'drizzle-zod'
import { index, pgTable, text, varchar, vector } from 'drizzle-orm/pg-core'
import { resources } from './resources'
import { users } from './auth'
import { z } from 'zod'

export const embeddings = pgTable(
  'embeddings',
  {
    id: varchar('id', { length: 191 })
      .primaryKey()
      .$defaultFn(() => nanoid()),
    resourceId: varchar('resource_id', { length: 191 }).references(
      () => resources.id,
      { onDelete: 'cascade' }
    ),
    userId: text('userId')
      .notNull()
      .references(() => users.id),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: 1536 }).notNull()
  },
  table => ({
    embeddingIndex: index('embeddingIndex').using(
      'hnsw',
      table.embedding.op('vector_cosine_ops')
    )
  })
)
