import { useSearchParams } from 'react-router-dom'

import { AuthLayout } from '@/app/components/AuthLayout'
import { ResendVerificationForm } from '@/features/auth/components/ResendVerificationForm'
import { VerifyEmail } from '@/features/auth/components/VerifyEmail'

export function VerifyEmailRoute() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  return (
    <AuthLayout title="Verify your email">
      {token ? (
        <VerifyEmail token={token} />
      ) : (
        <ResendVerificationForm>
          <p className="text-sm text-fg-2">
            Enter your email and we will send you a new verification link.
          </p>
        </ResendVerificationForm>
      )}
    </AuthLayout>
  )
}
