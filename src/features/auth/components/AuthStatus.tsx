import type { ReactNode } from 'react'

import { DroppedIcon, ReadIcon } from '@/components/icons'

type AuthStatusProps = {
  tone: 'success' | 'error'
  children: ReactNode
}

const ICON_CLASS = 'mt-0.5 size-[1.125rem] shrink-0'

export function AuthStatus({ tone, children }: AuthStatusProps) {
  if (tone === 'error') {
    return (
      <p className="flex items-start gap-2.5 text-sm font-medium text-danger">
        <DroppedIcon className={ICON_CLASS} />
        <span>{children}</span>
      </p>
    )
  }

  return (
    <p role="status" className="flex items-start gap-2.5 text-sm font-medium text-read">
      <ReadIcon className={ICON_CLASS} />
      <span>{children}</span>
    </p>
  )
}
