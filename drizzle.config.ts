import { config } from 'dotenv'
import { defineConfig } from 'drizzle-kit'

config({ path: '.env.local' })

export default defineConfig({
  dialect: 'postgresql', // "mysql" | "sqlite" | "postgresql"
  schema: './lib/db/schema/*',
  out: './lib/db/migrations',
  dbCredentials: {
    url: process.env.POSTGRES_URL!
  }
})
