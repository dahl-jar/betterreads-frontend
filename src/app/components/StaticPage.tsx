import type { ReactNode } from 'react'

type StaticPageProps = {
  title: string
  children: ReactNode
}

export function StaticPage({ title, children }: StaticPageProps) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-14">
      <h1 className="mb-8 font-display text-4xl font-semibold tracking-tight text-ink">{title}</h1>
      <div className="static-content">{children}</div>
    </main>
  )
}
