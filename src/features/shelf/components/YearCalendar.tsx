import { bookNoun } from '@/lib/bookNoun'

import { type ShelfEntry } from '../api/shelfSchemas'
import { formatShelfDate } from '../utils/formatShelfDate'
import { heatTone, yearGrid } from '../utils/readingCalendar'

type YearCalendarProps = {
  year: number
  today: string
  byDay: Record<string, ShelfEntry[]>
}

const MONTH_LABEL = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const MONTH_LABEL_SPAN = 4
const LEGEND_COUNTS = [0, 1, 2, 3]
const FUTURE_TONE = 'bg-sunken/50'
const FIRST_OF_MONTH = '-01'

export function YearCalendar({ year, today, byDay }: YearCalendarProps) {
  const { weeks, days } = yearGrid(year)
  const columns = { gridTemplateColumns: `repeat(${weeks}, minmax(0, 1fr))` }
  const monthStarts = days.filter((day) => day.date.endsWith(FIRST_OF_MONTH))

  return (
    <>
      <p className="font-title text-lg text-fg">{year}</p>
      <div className="mt-3 overflow-x-auto">
        <div className="min-w-[32rem]">
          <div aria-hidden="true" className="grid gap-[3px]" style={columns}>
            {monthStarts.map((day) => (
              <span
                key={day.date}
                style={{ gridColumn: `${day.week + 1} / span ${MONTH_LABEL_SPAN}` }}
                className="text-xs text-fg-3"
              >
                {MONTH_LABEL.format(new Date(`${day.date}T00:00:00Z`))}
              </span>
            ))}
          </div>
          <div className="mt-1.5 grid gap-[3px]" style={columns}>
            {days.map((day) => {
              const count = byDay[day.date]?.length ?? 0
              return (
                <span
                  key={day.date}
                  title={`${formatShelfDate(day.date) ?? day.date}: ${count} ${bookNoun(count)} finished`}
                  style={{ gridColumn: day.week + 1, gridRow: day.weekday + 1 }}
                  className={`aspect-square rounded-[2px] ${day.date > today ? FUTURE_TONE : heatTone(count)}`}
                />
              )
            })}
          </div>
        </div>
      </div>
      <p className="mt-3 flex items-center justify-end gap-1.5 text-xs text-fg-3">
        Fewer
        {LEGEND_COUNTS.map((count) => (
          <span key={count} className={`size-3 rounded-[2px] ${heatTone(count)}`} />
        ))}
        More
      </p>
    </>
  )
}
