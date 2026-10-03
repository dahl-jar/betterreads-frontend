import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'

import { resetPassword } from '../api/resetPassword'

import { AuthForm } from './AuthForm'
import { confirmationMatches, passwordSchema } from './passwordSchema'
import { TextField } from './TextField'

const resetPasswordFormSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(...confirmationMatches('newPassword'))

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

type ResetPasswordFormProps = {
  token: string
  onSuccess: () => void
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: ResetPasswordFormValues) => {
    await resetPassword({ token, newPassword: values.newPassword })
    onSuccess()
  }

  return (
    <AuthForm
      form={form}
      onSubmit={onSubmit}
      errorMessage="This reset link is invalid or expired. Request a new one."
    >
      <TextField<ResetPasswordFormValues>
        name="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
      />
      <TextField<ResetPasswordFormValues>
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
      />
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        Reset password
      </Button>
    </AuthForm>
  )
}
