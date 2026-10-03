import { type ReactNode, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AuthenticatedPage } from '@/app/components/AuthenticatedPage'
import { ReadIcon } from '@/components/icons'
import { Button } from '@/components/ui/button'
import { ChangePasswordForm } from '@/features/auth/components/ChangePasswordForm'
import { DeleteAccountSection } from '@/features/auth/components/DeleteAccountSection'
import { useAuth } from '@/hooks/useAuth'

type PasswordEditor = 'closed' | 'open' | 'saved'

const PASSWORD_MASK = '••••••••••'

export function SettingsRoute() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [passwordEditor, setPasswordEditor] = useState<PasswordEditor>('closed')

  return (
    <AuthenticatedPage>
      <h1 className="font-title text-3xl text-fg">Settings</h1>
      {user ? (
        <section className="mt-8 overflow-hidden rounded-[3px] border border-rule">
          <h2 className="border-b border-rule bg-sunken px-5 py-3 font-semibold text-fg">
            Account
          </h2>
          <dl className="divide-y divide-rule px-5">
            <SettingsRow term="Username" detail={`@${user.username}`} />
            <SettingsRow term="Display name" detail={user.displayName ?? user.username} />
            <SettingsRow
              term="Email"
              detail={user.email}
              action={
                user.emailVerified ? (
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-read">
                    <ReadIcon className="size-4" />
                    Verified
                  </span>
                ) : null
              }
            />
            <SettingsRow
              term="Password"
              detail={
                passwordEditor === 'open'
                  ? 'Enter your current password, then the new one.'
                  : PASSWORD_MASK
              }
              action={
                passwordEditor === 'open' ? (
                  <ChangePasswordForm
                    onSuccess={() => setPasswordEditor('saved')}
                    onCancel={() => setPasswordEditor('closed')}
                  />
                ) : (
                  <div className="flex items-center gap-3">
                    {passwordEditor === 'saved' ? (
                      <span role="status" className="text-sm font-semibold text-read">
                        Password changed
                      </span>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setPasswordEditor('open')}
                    >
                      Change
                    </Button>
                  </div>
                )
              }
            />
          </dl>
        </section>
      ) : null}
      <DeleteAccountSection onDeleted={() => void navigate('/', { replace: true })} />
    </AuthenticatedPage>
  )
}

function SettingsRow({
  term,
  detail,
  action,
}: {
  term: string
  detail: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 py-4">
      <div className="min-w-0">
        <dt className="text-sm font-semibold text-fg">{term}</dt>
        <dd className="mt-0.5 text-sm text-fg-2">{detail}</dd>
      </div>
      {action}
    </div>
  )
}
