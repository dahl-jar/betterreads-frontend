import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'

import { resendVerification } from '../api/resendVerification'
import { verifyEmail } from '../api/verifyEmail'

import { TextField } from './TextField'

type VerificationState = 'verifying' | 'verified' | 'failed'

const RESEND_CONFIRMATION =
  'If that email needs verifying, a new link is on its way. Check your inbox.'

const resendFormSchema = z.object({
  email: z
    .email('Enter a valid email with a domain, like name@example.com')
    .max(255, 'Email must be at most 255 characters'),
})

type ResendFormValues = z.infer<typeof resendFormSchema>

type VerifyEmailProps = {
  token: string
}

export function VerifyEmail({ token }: VerifyEmailProps) {
  const [state, setState] = useState<VerificationState>('verifying')
  const [resent, setResent] = useState(false)
  const form = useForm<ResendFormValues>({
    resolver: zodResolver(resendFormSchema),
    defaultValues: { email: '' },
  })

  useEffect(() => {
    let active = true
    verifyEmail({ token })
      .then(() => {
        if (active) {
          setState('verified')
        }
      })
      .catch(() => {
        if (active) {
          setState('failed')
        }
      })
    return () => {
      active = false
    }
  }, [token])

  const onResend = async (values: ResendFormValues) => {
    await resendVerification(values).catch(() => undefined)
    setResent(true)
  }

  if (state === 'verifying') {
    return (
      <p role="status" className="text-sm text-ink-soft">
        Verifying your email…
      </p>
    )
  }

  if (state === 'verified') {
    return <p className="text-sm font-medium text-green">Email verified. You are all set.</p>
  }

  if (resent) {
    return (
      <p role="status" className="text-sm text-ink-soft">
        {RESEND_CONFIRMATION}
      </p>
    )
  }

  return (
    <div className="space-y-5">
      <p className="text-sm font-medium text-destructive">
        We couldn&apos;t verify that link. It may be invalid or expired. Request a new one below.
      </p>
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
