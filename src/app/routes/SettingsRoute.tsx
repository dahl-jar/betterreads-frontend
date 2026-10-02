import { useNavigate } from 'react-router-dom'

import { AuthenticatedPage } from '@/app/components/AuthenticatedPage'
import { DeleteAccountSection } from '@/features/auth/components/DeleteAccountSection'

export function SettingsRoute() {
  const navigate = useNavigate()

  return (
    <AuthenticatedPage>
      <h1 className="font-title text-3xl text-fg">Settings</h1>
      <DeleteAccountSection onDeleted={() => void navigate('/', { replace: true })} />
    </AuthenticatedPage>
  )
}
