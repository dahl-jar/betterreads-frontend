import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { ApiError } from '@/lib/api/client'

import { changePassword } from '../api/changePassword'

import { AuthForm } from './AuthForm'
import { PASSWORD_MIN, confirmationMatches, passwordSchema } from './passwordSchema'
import { TextField } from './TextField'

const BAD_REQUEST = 400
const WRONG_CURRENT_DETAIL = 'Current password is incorrect'
const WRONG_CURRENT_ERROR = 'Current password is incorrect. Try again.'
const GENERAL_ERROR = 'Could not change your password. Try again.'

const changePasswordFormSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine(...confirmationMatches('newPassword'))

type ChangePasswordFormValues = z.infer<typeof changePasswordFormSchema>

type ChangePasswordFormProps = {
  onSuccess: () => void
  onCancel: () => void
}

export function ChangePasswordForm({ onSuccess, onCancel }: ChangePasswordFormProps) {
  const [errorMessage, setErrorMessage] = useState(GENERAL_ERROR)
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  const onSubmit = async (values: ChangePasswordFormValues) => {
    await changePassword({
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    }).catch((error: unknown) => {
      const wrongCurrent =
        error instanceof ApiError &&
        error.status === BAD_REQUEST &&
        error.message === WRONG_CURRENT_DETAIL
      setErrorMessage(wrongCurrent ? WRONG_CURRENT_ERROR : GENERAL_ERROR)
      throw error
    })
    onSuccess()
  }

  return (
    <div className="basis-full pb-2">
      <AuthForm form={form} onSubmit={onSubmit} errorMessage={errorMessage}>
        <div className="grid max-w-xl gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 sm:max-w-[calc(50%-0.5rem)]">
            <TextField<ChangePasswordFormValues>
              name="currentPassword"
              label="Current password"
              type="password"
              autoComplete="current-password"
            />
          </div>
          <TextField<ChangePasswordFormValues>
            name="newPassword"
            label="New password"
            type="password"
            autoComplete="new-password"
            description={`At least ${PASSWORD_MIN} characters.`}
          />
          <TextField<ChangePasswordFormValues>
            name="confirmPassword"
            label="Repeat new password"
            type="password"
            autoComplete="new-password"
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit" size="sm" disabled={form.formState.isSubmitting}>
            Save password
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </AuthForm>
    </div>
  )
}
