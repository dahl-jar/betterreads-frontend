import { z } from 'zod'

export const PASSWORD_MIN = 8
const PASSWORD_MAX = 72

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be at most ${PASSWORD_MAX} characters`)

type PasswordField = 'password' | 'newPassword'

type PasswordValues = Partial<Record<PasswordField | 'confirmPassword', string>>

type ConfirmationRefinement = [
  check: (values: PasswordValues) => boolean,
  issue: { message: string; path: string[] },
]

export function confirmationMatches(field: PasswordField): ConfirmationRefinement {
  return [
    (values) => values[field] === values.confirmPassword,
    { message: 'Passwords do not match', path: ['confirmPassword'] },
  ]
}
