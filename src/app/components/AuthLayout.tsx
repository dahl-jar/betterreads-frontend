import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Wordmark } from './Wordmark'

type AuthLayoutProps = {
  title: string
  children: ReactNode
  footer?: {
    prompt: string
    linkLabel: string
    to: string
  }
}

export function AuthLayout({ title, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-4 py-16">
      <div className="w-full max-w-sm">
        <Wordmark className="mb-8 block text-center text-2xl" />
        <div className="rounded-lg border border-rule bg-raised p-8 shadow-sm">
          <h1 className="mb-6 font-title text-2xl text-fg">{title}</h1>
          {children}
        </div>
        {footer ? (
          <p className="mt-6 text-center text-sm text-fg-2">
            {footer.prompt}{' '}
            <Link to={footer.to} className="font-semibold text-brand">
              {footer.linkLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  )
}
