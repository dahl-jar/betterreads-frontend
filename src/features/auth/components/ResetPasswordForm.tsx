import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'

import { resetPassword } from '../api/resetPassword'

import { AuthForm } from './AuthForm'
import { TextField } from './TextField'

const resetPasswordFormSchema = z.object({
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
})

type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>

type ResetPasswordFormProps = {
  token: string
  onSuccess: () => void
}

export function ResetPasswordForm({ token, onSuccess }: ResetPasswordFormProps) {
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { newPassword: '' },
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
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        Reset password
      </Button>
    </AuthForm>
  )
}
