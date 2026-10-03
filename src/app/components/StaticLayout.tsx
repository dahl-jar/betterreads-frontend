import type { ReactNode } from 'react'

import { StaticNav } from './StaticNav'

type StaticLayoutProps = {
  title: string
  children: ReactNode
}

export function StaticLayout({ title, children }: StaticLayoutProps) {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 lg:py-12">
      <div className="grid gap-6 lg:grid-cols-[13rem_minmax(0,1fr)] lg:gap-14">
        <StaticNav />
        <div className="min-w-0">
          <h1 className="font-title text-4xl leading-tight tracking-tight text-fg">{title}</h1>
          {children}
        </div>
      </div>
    </main>
  )
}
