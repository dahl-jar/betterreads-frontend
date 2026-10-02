import { AuthenticatedPage } from '@/app/components/AuthenticatedPage'
import { useAuth } from '@/hooks/useAuth'

export function ProfileRoute() {
  const { user } = useAuth()

  return (
    <AuthenticatedPage>
      {user ? (
        <>
          <h1 className="font-title text-3xl text-fg">Your account</h1>

          <dl className="mt-6 space-y-4">
            <Field label="Username" value={user.username} />
            <Field
              label="Email"
              value={user.email}
              note={user.emailVerified ? 'Verified' : 'Not verified'}
            />
            {user.displayName ? <Field label="Display name" value={user.displayName} /> : null}
          </dl>
        </>
      ) : null}
    </AuthenticatedPage>
  )
}

function Field({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div>
      <dt className="text-sm text-fg-3">{label}</dt>
      <dd className="text-fg">
        {value}
        {note ? <span className="ml-2 text-sm text-fg-2">({note})</span> : null}
      </dd>
    </div>
  )
}
