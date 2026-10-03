import { useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/app/components/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'

export function LoginRoute() {
  const navigate = useNavigate()
  return (
    <AuthLayout
      title="Welcome back"
      backdrop
      footer={{ prompt: 'New here?', linkLabel: 'Create an account', to: '/register' }}
    >
      <LoginForm onSuccess={() => void navigate('/')} />
    </AuthLayout>
  )
}
