import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'

import { register } from '../api/register'

import { AuthForm } from './AuthForm'
import { emailSchema } from './emailSchema'
import { TextField } from './TextField'

const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/

const registerFormSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(50, 'Username must be at most 50 characters')
      .regex(USERNAME_PATTERN, 'Use only letters, numbers, dot, underscore, or hyphen'),
    email: emailSchema,
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password must be at most 72 characters'),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type RegisterFormValues = z.infer<typeof registerFormSchema>

export function RegisterForm() {
  const [registered, setRegistered] = useState(false)
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: { username: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = async (values: RegisterFormValues) => {
    await register({
      username: values.username,
      email: values.email,
      password: values.password,
    })
    setRegistered(true)
  }

  if (registered) {
    return (
      <p role="status" className="text-sm text-fg-2">
        Check your email to verify your account, then{' '}
        <Link to="/login" className="font-semibold text-brand">
          log in
        </Link>
        .
      </p>
    )
  }

  return (
    <AuthForm
      form={form}
      onSubmit={onSubmit}
      errorMessage="That username or email is already taken, or the details were rejected."
    >
      <TextField<RegisterFormValues> name="username" label="Username" autoComplete="username" />
      <TextField<RegisterFormValues> name="email" label="Email" type="email" autoComplete="email" />
      <TextField<RegisterFormValues>
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
      />
      <TextField<RegisterFormValues>
        name="confirmPassword"
        label="Confirm password"
        type="password"
        autoComplete="new-password"
      />
      <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
        Create account
      </Button>
    </AuthForm>
  )
}
