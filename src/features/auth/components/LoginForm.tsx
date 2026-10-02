import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'

import { AuthForm } from './AuthForm'
import { TextField } from './TextField'

const loginFormSchema = z.object({
  identifier: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
})

type LoginFormValues = z.infer<typeof loginFormSchema>

type LoginFormProps = {
  onSuccess: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { login } = useAuth()
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { identifier: '', password: '' },
  })

  const onSubmit = async (values: LoginFormValues) => {
    await login(values)
    onSuccess()
  }

  return (
    <AuthForm
      form={form}
      onSubmit={onSubmit}
      errorMessage="Email, username, or password is incorrect. Try again."
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
