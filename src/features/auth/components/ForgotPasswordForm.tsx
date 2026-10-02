import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import { forgotPassword } from '../api/forgotPassword'

import { TextField } from './TextField'

const NEUTRAL_CONFIRMATION =
  'If that email has an account, a reset link is on its way. Check your inbox.'

const forgotPasswordFormSchema = z.object({
  email: z
    .email('Enter a valid email with a domain, like name@example.com')
    .max(255, 'Email must be at most 255 characters'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordFormSchema>

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false)
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordFormSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    await forgotPassword(values).catch(() => undefined)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <p role="status" className="text-sm text-fg-2">
        {NEUTRAL_CONFIRMATION}
      </p>
    )
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(onSubmit)(event)}
        className="space-y-5"
        noValidate
      >
        <TextField<ForgotPasswordFormValues>
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          Send reset link
        </Button>
      </form>
    </Form>
  )
}
