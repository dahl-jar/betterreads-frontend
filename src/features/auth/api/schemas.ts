import { z } from 'zod'

import { type CurrentUser, type LoginInput, type RegisterInput } from '@/types/auth'

const currentUserSchema = z.object({
  username: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
  displayName: z.string().nullish(),
  avatarUrl: z.string().nullish(),
  bio: z.string().nullish(),
})

const authResponseSchema = z.object({
  accessToken: z.string(),
  user: currentUserSchema,
})

export type ForgotPasswordInput = {
  email: string
}

export type ResetPasswordInput = {
  token: string
  newPassword: string
}

export type VerifyEmailInput = {
  token: string
}

export type ResendVerificationInput = {
  email: string
}

export type AuthResponse = z.infer<typeof authResponseSchema>

export type { CurrentUser, LoginInput, RegisterInput }

export function parseAuthResponse(raw: unknown): AuthResponse {
  return authResponseSchema.parse(raw)
}

export function parseCurrentUser(raw: unknown): CurrentUser {
  return currentUserSchema.parse(raw)
}
