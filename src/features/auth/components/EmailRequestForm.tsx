import { zodResolver } from '@hookform/resolvers/zod'
import { type ReactNode, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'

import { AuthForm } from './AuthForm'
import { AuthStatus } from './AuthStatus'
import { emailSchema } from './emailSchema'
import { TextField } from './TextField'

const emailRequestSchema = z.object({
  email: emailSchema,
})

type EmailRequestValues = z.infer<typeof emailRequestSchema>

type EmailRequestFormProps = {
  send: (values: EmailRequestValues) => Promise<void>
  confirmation: string
  submitLabel: string
  children?: ReactNode
}

export function EmailRequestForm({
  send,
  confirmation,
  submitLabel,
  children,
}: EmailRequestFormProps) {
  const [sent, setSent] = useState(false)
  const form = useForm<EmailRequestValues>({
    resolver: zodResolver(emailRequestSchema),
    defaultValues: { email: '' },
  })

  const onSubmit = async (values: EmailRequestValues) => {
    await send(values).catch(() => undefined)
    setSent(true)
  }

  if (sent) {
    return <AuthStatus tone="success">{confirmation}</AuthStatus>
  }

  return (
    <div className="space-y-5">
      {children}
      <AuthForm form={form} onSubmit={onSubmit} errorMessage={null}>
        <TextField<EmailRequestValues>
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
        />
        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
          {submitLabel}
        </Button>
      </AuthForm>
    </div>
  )
}
