import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { CoverRows } from './CoverRows'
import { Wordmark } from './Wordmark'

type AuthLayoutProps = {
  title: string
  children: ReactNode
  backdrop?: boolean
  footer?: {
    prompt: string
    linkLabel: string
    to: string
  }
}

export function AuthLayout({ title, children, backdrop = false, footer }: AuthLayoutProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-sunken px-4 py-16">
      {backdrop ? (
        <>
          <CoverRows />
          <div aria-hidden="true" className="absolute inset-0 hidden bg-fg/70 md:block" />
        </>
      ) : null}
      <div className="relative w-full max-w-[26rem] rounded-[3px] border border-rule bg-raised p-8 shadow-card">
        <div className="mb-8 text-2xl">
          <Wordmark className="inline-block" />
        </div>
        <h1 className="font-title text-2xl text-fg">{title}</h1>
        <div className="mt-6">{children}</div>
        {footer ? (
          <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5 text-sm text-fg-2">
            <span>{footer.prompt}</span>
            <Link
              to={footer.to}
              className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md border border-rule bg-raised px-3 text-sm font-semibold text-fg no-underline transition-colors hover:border-fg-3"
            >
              {footer.linkLabel}
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  )
}
