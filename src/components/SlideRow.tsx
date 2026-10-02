import type { ReactNode } from 'react'

import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import { SectionHeading } from '@/components/SectionHeading'
import { useStripScroll } from '@/hooks/useStripScroll'

type SlideRowProps = {
  title: string
  note?: string
  heading?: ReactNode
  itemCount: number
  children: ReactNode
}

const ARROW_CLASS =
  'flex size-9 items-center justify-center rounded-full border border-rule text-fg-2 transition-colors hover:border-fg-3 hover:text-fg disabled:text-rule disabled:hover:border-rule'

export function SlideRow({ title, note, heading, itemCount, children }: SlideRowProps) {
  const { ref, canScrollBack, canScrollForward, measure, scrollByPage } = useStripScroll(itemCount)

  return (
    <section aria-label={title}>
      <div className="flex items-end justify-between gap-4">
        {note ? (
          <SectionHeading title={title} note={note} />
        ) : (
          <h2 className="label-caps">{heading ?? title}</h2>
        )}
        <div className="hidden gap-2 md:flex">
          <button
            type="button"
            aria-label={`${title}, previous`}
            disabled={!canScrollBack}
            onClick={() => scrollByPage(-1)}
            className={ARROW_CLASS}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label={`${title}, next`}
            disabled={!canScrollForward}
            onClick={() => scrollByPage(1)}
            className={ARROW_CLASS}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
      <ul
        ref={ref}
        onScroll={measure}
        className="-mx-5 mt-4 flex snap-x scroll-px-5 gap-5 overflow-x-auto scroll-smooth px-5 pb-4 pt-3 scrollbar-none"
      >
        {children}
      </ul>
    </section>
  )
}
