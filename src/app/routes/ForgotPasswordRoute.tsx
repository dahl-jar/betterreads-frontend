import { AuthLayout } from '@/app/components/AuthLayout'
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm'

export function ForgotPasswordRoute() {
  return (
    <AuthLayout
      title="Reset your password"
      footer={{ prompt: 'Remembered it?', linkLabel: 'Back to log in', to: '/login' }}
    >
      <ForgotPasswordForm />
    </AuthLayout>
  )
}
