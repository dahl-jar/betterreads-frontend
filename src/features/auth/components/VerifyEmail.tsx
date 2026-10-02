import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { verifyEmail } from '../api/verifyEmail'

import { ResendVerificationForm } from './ResendVerificationForm'

type VerificationState = 'verifying' | 'verified' | 'failed'

type VerifyEmailProps = {
  token: string
}

export function VerifyEmail({ token }: VerifyEmailProps) {
  const [state, setState] = useState<VerificationState>('verifying')

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

  if (state === 'verifying') {
    return (
      <p role="status" className="text-sm text-fg-2">
        Verifying your email…
      </p>
    )
  }

  if (state === 'verified') {
    return (
      <p className="text-sm font-medium text-read">
        Email verified.{' '}
        <Link to="/login" className="font-semibold text-brand">
          Log in
        </Link>
      </p>
    )
  }

  return (
    <ResendVerificationForm>
      <p className="text-sm font-medium text-destructive">
        We couldn&apos;t verify that link. It may be invalid or expired. Request a new one below.
      </p>
    </ResendVerificationForm>
  )
}
