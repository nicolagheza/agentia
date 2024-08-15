'use server'

import { signIn } from '@/auth'
import { ResultCode } from '@/lib/utils'
import { z } from 'zod'

interface Result {
  type: string
  resultCode: ResultCode
}

export async function signup(
  _prevState: Result | undefined,
  formData: FormData
): Promise<Result | undefined> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const parsedCredentials = z
    .object({
      email: z.string().email(),
      password: z.string().min(6)
    })
    .safeParse({
      email,
      password
    })

  if (parsedCredentials.success) {
    await signIn('credentials', {
      email,
      password,
      redirect: false
    })

    return {
      type: 'success',
      resultCode: ResultCode.UserLoggedIn
    }
  } else {
    return {
      type: 'error',
      resultCode: ResultCode.InvalidCredentials
    }
  }
}
