import { type ComponentType, useState } from 'react'
import { Link } from 'react-router-dom'

import { BookCover } from '@/components/BookCover'
import { HeartIcon } from '@/components/icons'
import { bookNoun } from '@/lib/bookNoun'
import { bookPath } from '@/lib/bookPath'

import { type ReadingStatus, type ShelfEntry } from '../api/shelfSchemas'
import { formatShelfDate } from '../utils/formatShelfDate'
import {
  finishedByDay,
  finishedIn,
  MONTH_PERIOD_LENGTH,
  shiftMonth,
  yearOf,
} from '../utils/readingCalendar'
import { READING_STATUS_ICONS } from '../utils/readingStatusIcons'
import { READING_STATUS_LABELS } from '../utils/readingStatusLabels'
import { countFor, type ShelfFilter, shelfFilterPath } from '../utils/shelfFilters'

import { MonthCalendar } from './MonthCalendar'
import { ViewToggle } from './ViewToggle'
import { YearCalendar } from './YearCalendar'

type ReadingStatsProps = {
  entries: ShelfEntry[]
  today: string
}

type CalendarView = 'month' | 'year'

type StatCell = {
  filter: ShelfFilter
  label: string
  Icon: ComponentType<{ className?: string }>
  tone: string
}

const STAT_STATUSES: ReadingStatus[] = ['FINISHED', 'CURRENTLY_READING', 'WANT_TO_READ']

const STAT_CELLS: StatCell[] = [
  ...STAT_STATUSES.map((status) => ({
    filter: status,
    label: READING_STATUS_LABELS[status],
    ...READING_STATUS_ICONS[status],
  })),
  { filter: 'FAVORITES', label: 'Favorites', Icon: FilledHeartIcon, tone: 'text-danger' },
]

const VIEW_OPTIONS: { view: CalendarView; label: string }[] = [
  { view: 'month', label: 'Month' },
  { view: 'year', label: 'Year' },
]

const MONTH_NAME = new Intl.DateTimeFormat('en-US', { month: 'long', timeZone: 'UTC' })

function FilledHeartIcon({ className }: { className?: string }) {
  return <HeartIcon className={className} filled />
}

function periodName(period: string, currentYear: string): string {
  if (period === yearOf(period)) {
    return period
  }
  const name = MONTH_NAME.format(new Date(`${period}-01T00:00:00Z`))
  const year = yearOf(period)
  return year === currentYear ? name : `${name} ${year}`
}

export function ReadingStats({ entries, today }: ReadingStatsProps) {
  const [view, setView] = useState<CalendarView>('month')
  const [month, setMonth] = useState(today.slice(0, MONTH_PERIOD_LENGTH))
  const currentYear = yearOf(today)
  const readThisYear = finishedIn(entries, currentYear).length
  const period = view === 'year' ? currentYear : month
  const name = periodName(period, currentYear)
  const finished = finishedIn(entries, period)
  const byDay = finishedByDay(entries, Number(yearOf(period)))

  return (
    <section
      aria-label="Statistics"
      className="mt-8 overflow-hidden rounded-[3px] border border-rule"
    >
      <StatCells entries={entries} />

      <div className="grid gap-px bg-rule sm:grid-cols-4">
        <div className="flex min-w-0 flex-col gap-5 bg-raised p-6 sm:col-span-4 lg:col-span-1">
          <div>
            <p className="label-caps">Read in {currentYear}</p>
            <p className="mt-2 flex items-baseline gap-2.5">
              <span className="text-5xl font-bold leading-none tabular-nums text-fg">
                {readThisYear}
              </span>
              <span className="text-fg-2">{bookNoun(readThisYear)} so far this year</span>
            </p>
          </div>
          <ViewToggle options={VIEW_OPTIONS} view={view} onView={setView} className="self-start" />
          <FinishedList name={name} finished={finished} />
        </div>
        <div className="min-w-0 bg-raised p-6 sm:col-span-4 lg:col-span-3">
          {view === 'month' ? (
            <MonthCalendar
              month={month}
              today={today}
              byDay={byDay}
              onStep={(step) => setMonth((current) => shiftMonth(current, step))}
            />
          ) : (
            <YearCalendar year={Number(currentYear)} today={today} byDay={byDay} />
          )}
        </div>
      </div>
    </section>
  )
}

function StatCells({ entries }: { entries: ShelfEntry[] }) {
  return (
    <div className="grid grid-cols-2 gap-px border-b border-rule bg-rule sm:grid-cols-4">
      {STAT_CELLS.map((cell) => (
        <Link
          key={cell.filter}
          to={shelfFilterPath(cell.filter)}
          className="flex items-center justify-between gap-3 bg-raised px-6 py-4 no-underline transition-colors hover:bg-sunken"
        >
          <span>
            <span className="block text-2xl font-bold leading-tight tabular-nums text-fg">
              {countFor(entries, cell.filter)}
            </span>
            <span className="block text-sm text-fg-2">{cell.label}</span>
          </span>
          <cell.Icon className={`size-6 shrink-0 ${cell.tone}`} />
        </Link>
      ))}
    </div>
  )
}

function FinishedList({ name, finished }: { name: string; finished: ShelfEntry[] }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-rule pt-5">
      <p className="label-caps">
        {finished.length > 0 ? `Finished in ${name} · ${finished.length}` : `Finished in ${name}`}
      </p>
      {finished.length > 0 ? (
        <div className="relative mt-3 min-h-0 flex-1 lg:min-h-36">
          <ul className="scrollbar-quiet flex max-h-72 flex-col gap-3 overflow-y-auto pr-1 lg:absolute lg:inset-0 lg:max-h-none">
            {finished.map((entry) => (
              <li key={entry.key}>
                <Link
                  to={bookPath(entry.key)}
                  className="group flex items-center gap-3 no-underline"
                >
                  <BookCover
                    coverUrl={entry.coverUrl}
                    title={entry.title}
                    className="h-12 w-8 shrink-0 rounded-[2px] text-sm shadow-cover"
                  />
                  <span className="min-w-0">
                    <span className="block truncate font-title text-sm text-fg group-hover:text-brand">
                      {entry.title}
                    </span>
                    <span className="block text-xs text-fg-3">
                      {formatShelfDate(entry.finishedAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-3 text-sm text-fg-3">No books finished in {name}.</p>
      )}
    </div>
  )
}
