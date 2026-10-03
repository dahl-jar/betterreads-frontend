import { useState } from 'react'
import { Link } from 'react-router-dom'

import { AuthenticatedPage } from '@/app/components/AuthenticatedPage'
import { Avatar } from '@/components/Avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ProfileShelves } from '@/features/shelf/components/ProfileShelves'
import { ReadingStats } from '@/features/shelf/components/ReadingStats'
import { useShelf } from '@/features/shelf/hooks/useShelf'
import { SHELF_LOAD_FAILED } from '@/features/shelf/utils/shelfLoadFailed'
import { useAuth } from '@/hooks/useAuth'
import { bookNoun } from '@/lib/bookNoun'

const ISO_PART_LENGTH = 2

function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(ISO_PART_LENGTH, '0')
  const day = String(now.getDate()).padStart(ISO_PART_LENGTH, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function ProfileRoute() {
  return (
    <AuthenticatedPage width="wide">
      <ProfileContent />
    </AuthenticatedPage>
  )
}

function ProfileContent() {
  const { user } = useAuth()
  const { status, entries } = useShelf()
  const [today] = useState(todayIso)

  if (!user) {
    return null
  }

  const name = user.displayName ?? user.username

  return (
    <>
      <div className="flex flex-wrap items-center gap-5">
        <Avatar name={name} url={user.avatarUrl} size="xl" />
        <div className="min-w-0 flex-1">
          <h1 className="font-title text-3xl text-fg">{name}</h1>
          <p className="mt-1 text-fg-2">
            @{user.username}
            {status === 'success' ? ` · ${entries.length} ${bookNoun(entries.length)}` : null}
          </p>
        </div>
        <Link
          to="/settings"
          className="rounded-md border border-rule px-4 py-2 text-sm font-semibold text-fg no-underline hover:border-fg-3"
        >
          Settings
        </Link>
      </div>

      {status === 'error' ? (
        <p role="alert" className="mt-8 text-sm text-destructive">
          {SHELF_LOAD_FAILED}
        </p>
      ) : null}

      {status === 'loading' ? <Skeleton className="mt-8 h-64 w-full" /> : null}

      {status === 'success' ? (
        <>
          <ReadingStats entries={entries} today={today} />
          <ProfileShelves entries={entries} />
        </>
      ) : null}
    </>
  )
}
