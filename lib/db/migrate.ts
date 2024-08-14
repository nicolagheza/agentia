import { drizzle } from 'drizzle-orm/vercel-postgres'
import { migrate } from 'drizzle-orm/vercel-postgres/migrator'
import { sql } from '@vercel/postgres'
import { config } from 'dotenv'

config({ path: '.env.local' })

const runMigrate = async () => {
  const db = drizzle(sql)

  console.log('⏳ Running migrations...')

  const start = Date.now()

  await migrate(db, { migrationsFolder: 'lib/db/migrations' })

  const end = Date.now()

  console.log('✅ Migrations completed in', end - start, 'ms')

  process.exit(0)
}

runMigrate().catch(err => {
  console.error('❌ Migration failed')
  console.error(err)
  process.exit(1)
})
