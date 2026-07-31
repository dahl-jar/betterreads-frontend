import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

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
    <main className="flex min-h-screen items-center justify-center bg-paper px-4 py-16">
      <div className="w-full max-w-sm">
        <Link
          to="/"
          className="mb-8 block text-center text-2xl tracking-tight text-ink no-underline"
        >
          better<b className="font-extrabold">reads</b>
        </Link>
        <div className="rounded-lg border border-line bg-surface p-8 shadow-sm">
          <h1 className="mb-6 font-display text-2xl font-semibold text-ink">{title}</h1>
          {children}
        </div>
        {footer ? (
          <p className="mt-6 text-center text-sm text-ink-soft">
            {footer.prompt}{' '}
            <Link to={footer.to} className="font-semibold text-green">
              {footer.linkLabel}
            </Link>
          </p>
        ) : null}
      </div>
    </main>
  )
}
