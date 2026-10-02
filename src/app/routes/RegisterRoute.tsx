import { AuthLayout } from '@/app/components/AuthLayout'
import { RegisterForm } from '@/features/auth/components/RegisterForm'

export function RegisterRoute() {
  return (
    <AuthLayout
      title="Create your account"
      footer={{ prompt: 'Already have an account?', linkLabel: 'Log in', to: '/login' }}
    >
      <RegisterForm />
    </AuthLayout>
  )
}
