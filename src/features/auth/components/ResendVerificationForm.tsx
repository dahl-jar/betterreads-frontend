import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import { resendVerification } from '../api/resendVerification'

import { emailSchema } from './emailSchema'
import { TextField } from './TextField'

const RESEND_CONFIRMATION =
  'If that email needs verifying, a new link is on its way. Check your inbox.'

const resendFormSchema = z.object({
  email: emailSchema,
})

type ResendFormValues = z.infer<typeof resendFormSchema>

type ResendVerificationFormProps = {
  children: ReactNode
}

export function ResendVerificationForm({ children }: ResendVerificationFormProps) {
  const [resent, setResent] = useState(false)
  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendFormSchema),
    defaultValues: { email: '' },
  })

  const onResend = async (values: ResendFormValues) => {
    await resendVerification(values).catch(() => undefined)
    setResent(true)
  }

  if (resent) {
    return (
      <p role="status" className="text-sm text-fg-2">
        {RESEND_CONFIRMATION}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      {children}
      <Form {...form}>
        <form
          onSubmit={(event) => void form.handleSubmit(onResend)(event)}
          className="space-y-5"
          noValidate
        >
          <TextField<ResendFormValues>
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
          />
          <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
            Resend verification
          </Button>
        </form>
      </Form>
    </div>
  )
}
