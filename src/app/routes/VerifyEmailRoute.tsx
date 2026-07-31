import { useSearchParams } from 'react-router-dom'

import { AuthLayout } from '@/app/components/AuthLayout'
import { VerifyEmail } from '@/features/auth/components/VerifyEmail'

export function VerifyEmailRoute() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  return (
    <AuthLayout title="Verify your email">
      {token ? (
        <VerifyEmail token={token} />
      ) : (
        <p role="alert" className="text-sm font-medium text-destructive">
          This verification link is missing its token. Request a new one from your account.
        </p>
      )}
    </AuthLayout>
  )
}
