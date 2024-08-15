import NextAuth, { User } from 'next-auth'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { eq } from 'drizzle-orm'
import Credentials from 'next-auth/providers/credentials'
import GithubProvider from 'next-auth/providers/github'
import { z } from 'zod'

import { db } from '@/lib/db'
import { users } from './lib/db/schema/auth'

function passwordToSalt(password: string) {
  const bcrypt = require('bcryptjs')
  const saltRounds = 10
  const hash = bcrypt.hashSync(password, saltRounds)
  return hash
}

async function getUserFromDb(email: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  })
  return user
}

async function addUserToDb(email: string, saltedPassword: string) {
  const user = await db
    .insert(users)
    .values({
      id: crypto.randomUUID(),
      email: email,
      password: saltedPassword
    })
    .returning()
  return user.pop()
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Credentials({
      async authorize(credentials): Promise<User | null> {
        const parsedCredentials = z
          .object({
            email: z.string().email(),
            password: z.string().min(6)
          })
          .safeParse(credentials)

        if (parsedCredentials.success) {
          const { email, password } = parsedCredentials.data
          let user = await getUserFromDb(email)
          if (user) {
            if (!user.password) return null
            const bcrypt = require('bcryptjs')
            const isAuthenticated = await bcrypt.compare(
              password,
              user.password
            )
            if (isAuthenticated) {
              return user
            } else {
              return null
            }
          } else {
            const saltedPassword = passwordToSalt(password)
            user = await addUserToDb(email, saltedPassword)
            if (!user) {
              throw new Error('user was not found and could not be created.')
            }
            return user
          }
        }

        return null
      }
    }),
    GithubProvider({
      clientId: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET
    })
  ],
  callbacks: {
    async session({ session }: any) {
      return session
    }
  },
  session: {
    strategy: 'jwt'
  }
})
