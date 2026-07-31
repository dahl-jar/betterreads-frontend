import { useNavigate, useSearchParams } from 'react-router-dom'

import { AuthLayout } from '@/app/components/AuthLayout'
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm'

export function ResetPasswordRoute() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  return (
    <AuthLayout
      title="Choose a new password"
      footer={{ prompt: 'Need a new link?', linkLabel: 'Request a reset', to: '/forgot-password' }}
    >
      {token ? (
        <ResetPasswordForm token={token} onSuccess={() => void navigate('/login')} />
      ) : (
        <p role="alert" className="text-sm font-medium text-destructive">
          This reset link is missing its token. Request a new one.
        </p>
      )}
    </AuthLayout>
  )
}
