import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api/client'
import { keptLoginState } from '@/lib/returnPath'

import { AuthForm } from './AuthForm'
import { TextField } from './TextField'

const FORBIDDEN = 403

const UNVERIFIED_DETAIL = 'Verify your email to log in'

const loginFormSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean(),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

type LoginFormProps = {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const returnState = keptLoginState(useLocation().state)
  const [unverified, setUnverified] = useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: '', password: '', rememberMe: true },
  })

  const onSubmit = async (values: LoginFormValues) => {
    await login(values).catch((error: unknown) => {
      setUnverified(
        error instanceof ApiError &&
          error.status === FORBIDDEN &&
          error.message === UNVERIFIED_DETAIL,
      )
      throw error
    })
    onSuccess()
  }

  return (
    <AuthForm
      form={form}
      onSubmit={onSubmit}
      errorMessage={
        unverified ? (
          <>
            Verify your email to log in.{' '}
            <Link to="/verify-email" className="font-semibold text-brand">
              Send a new verification email
            </Link>
          </>
        ) : (
          'Email, username, or password is incorrect. Try again.'
        )
      }
    >
      <TextField<LoginFormValues>
        name="identifier"
        label="Email or username"
        autoComplete="username"
      />
      <TextField<LoginFormValues>
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        aside={
          <Link
            to="/forgot-password"
            state={returnState}
            className="text-sm font-semibold text-brand underline-offset-2 hover:underline"
          >
            Forgot password?
          </Link>
        }
      />
      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-fg">
        <input
          type="checkbox"
          className="size-4 rounded border border-input accent-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          {...form.register('rememberMe')}
        />
        Remember me
      </label>
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        Log in
      </Button>
    </AuthForm>
  )
}
