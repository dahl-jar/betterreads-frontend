import type { ReactNode } from 'react'

import { ReadIcon } from '@/components/icons'

import { StaticLayout } from './StaticLayout'

type StaticSection = {
  id?: string
  heading: string
  body: ReactNode
}

type StaticPageProps = {
  title: string
  lead: ReactNode
  summary?: string[]
  sections: StaticSection[]
}

export function StaticPage({ title, lead, summary, sections }: StaticPageProps) {
  return (
    <StaticLayout title={title}>
      <p className="mt-5 max-w-2xl font-title text-2xl leading-snug text-fg-2">{lead}</p>
      {summary ? (
        <div className="mt-6 max-w-[62ch]">
          <ul className="flex flex-col gap-2 rounded-[3px] bg-sunken px-5 py-4 text-base text-fg">
            {summary.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <ReadIcon className="mt-1 size-4 shrink-0 text-read" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <dl className="mt-10 border-t border-rule">
        {sections.map((section) => (
          <div
            key={section.heading}
            id={section.id}
            className="grid scroll-mt-6 gap-x-10 gap-y-2 border-b border-rule py-7 md:grid-cols-[13rem_minmax(0,1fr)]"
          >
            <dt className="font-semibold text-fg">{section.heading}</dt>
            <dd className="max-w-[62ch] text-[1.0625rem] leading-7 text-fg-2">{section.body}</dd>
          </div>
        ))}
      </dl>
    </StaticLayout>
  )
}
