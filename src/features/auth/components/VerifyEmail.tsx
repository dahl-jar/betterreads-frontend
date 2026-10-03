import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { SHELF_PATH } from '@/lib/shelfPath'

import { verifyEmail } from '../api/verifyEmail'

import { AuthStatus } from './AuthStatus'
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
      <div className="space-y-5">
        <AuthStatus tone="success">Email verified. You are all set.</AuthStatus>
        <Button asChild className="w-full no-underline">
          <Link to={SHELF_PATH}>Go to My books</Link>
        </Button>
      </div>
    )
  }

  return (
    <ResendVerificationForm>
      <AuthStatus tone="error">
        We couldn&apos;t verify that link. It may be invalid or expired. Request a new one below.
      </AuthStatus>
    </ResendVerificationForm>
  )
}
