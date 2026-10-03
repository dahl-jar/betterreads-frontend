import { useLocation, useNavigate } from 'react-router-dom'

import { AuthLayout } from '@/app/components/AuthLayout'
import { LoginForm } from '@/features/auth/components/LoginForm'
import { returnPathOf } from '@/lib/returnPath'

export function LoginRoute() {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <AuthLayout
      title="Welcome back"
      backdrop
      footer={{ prompt: 'New here?', linkLabel: 'Create an account', to: '/register' }}
    >
      <LoginForm onSuccess={() => void navigate(returnPathOf(location.state), { replace: true })} />
    </AuthLayout>
  )
}
