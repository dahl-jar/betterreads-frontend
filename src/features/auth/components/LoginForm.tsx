import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { ApiError } from '@/lib/api/client'

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
  const [unverified, setUnverified] = useState(false)
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: '', password: '', rememberMe: false },
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
      />
      <label className="flex items-center gap-2 text-sm text-fg">
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
      <p className="text-left text-sm">
        <Link to="/forgot-password" className="font-semibold text-brand">
          Forgot password?
        </Link>
      </p>
    </AuthForm>
  )
}
