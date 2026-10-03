import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/icons'
import { bookPath } from '@/lib/bookPath'

import { type ShelfEntry } from '../api/shelfSchemas'
import { monthGrid, monthParts, WEEKDAYS } from '../utils/readingCalendar'

type MonthCalendarProps = {
  month: string
  today: string
  byDay: Record<string, ShelfEntry[]>
  onStep: (step: number) => void
}

const MONTH_HEADING = new Intl.DateTimeFormat('en-US', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const DAY_OF_MONTH_START = 8

const STEP_CLASS =
  'flex size-8 items-center justify-center rounded-full border border-rule text-fg-2 hover:border-fg-3 hover:text-fg'

export function MonthCalendar({ month, today, byDay, onStep }: MonthCalendarProps) {
  const { year, month: monthNumber } = monthParts(month)
  const cells = monthGrid(year, monthNumber)

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="font-title text-lg text-fg">
          {MONTH_HEADING.format(new Date(Date.UTC(year, monthNumber - 1, 1)))}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onStep(-1)}
            aria-label="Previous month"
            className={STEP_CLASS}
          >
            <ChevronLeftIcon className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => onStep(1)}
            aria-label="Next month"
            className={STEP_CLASS}
          >
            <ChevronRightIcon className="size-4" />
          </button>
        </div>
      </div>
      <div aria-hidden="true" className="mt-3 grid grid-cols-7 gap-1.5 text-center">
        {WEEKDAYS.map((name) => (
          <span key={name} className="text-xs text-fg-3">
            {name}
          </span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((day, index) =>
          day === undefined ? (
            <span key={`blank-${index}`} />
          ) : (
            <DayCell key={day} day={day} today={today} books={byDay[day] ?? []} />
          ),
        )}
      </div>
    </>
  )
}

function DayCell({ day, today, books }: { day: string; today: string; books: ShelfEntry[] }) {
  const dayNumber = Number(day.slice(DAY_OF_MONTH_START))
  const [first] = books

  if (first === undefined) {
    return (
      <span
        className={`flex h-14 items-start justify-start rounded-[3px] bg-sunken/60 p-1.5 text-xs tabular-nums sm:h-16 ${day > today ? 'text-rule' : 'text-fg-3'}`}
      >
        {dayNumber}
      </span>
    )
  }

  const titles = books.map((entry) => entry.title).join(', ')
  return (
    <Link
      to={bookPath(first.key)}
      title={titles}
      aria-label={titles}
      className="relative flex h-14 items-end justify-center rounded-[3px] bg-brand-soft p-1.5 no-underline sm:h-16"
    >
      <span className="absolute left-1.5 top-1.5 text-xs font-semibold tabular-nums text-brand">
        {dayNumber}
      </span>
      <BookCover
        coverUrl={first.coverUrl}
        title={first.title}
        className="h-8 w-auto rounded-[2px] text-xs shadow-cover sm:h-10"
      />
      {books.length > 1 ? (
        <span className="absolute bottom-1 right-1 rounded-full bg-raised px-1.5 text-[0.6875rem] font-bold tabular-nums text-fg shadow-card">
          +{books.length - 1}
        </span>
      ) : null}
    </Link>
  )
}
