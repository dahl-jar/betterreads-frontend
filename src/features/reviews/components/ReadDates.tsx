import { OpenBookIcon } from '@/components/icons'
import { formatDate } from '@/lib/formatDate'

const MONTH_DAY = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  timeZone: 'UTC',
})

function yearOf(date: string): string {
  return date.slice(0, 4)
}

type ReadDatesProps = {
  startedAt?: string | null | undefined
  finishedAt?: string | null | undefined
}

function readLabel({ startedAt, finishedAt }: ReadDatesProps): string {
  if (startedAt && finishedAt) {
    const start =
      yearOf(startedAt) === yearOf(finishedAt)
        ? MONTH_DAY.format(new Date(startedAt))
        : formatDate(startedAt)
    return `Read from ${start} to ${formatDate(finishedAt)}`
  }
  if (finishedAt) {
    return `Finished ${formatDate(finishedAt)}`
  }
  return `Started ${formatDate(startedAt ?? '')}`
}

export function ReadDates(dates: ReadDatesProps) {
  if (!dates.startedAt && !dates.finishedAt) {
    return null
  }
  return (
    <p className="mt-5 flex max-w-[68ch] items-center gap-2 text-sm text-fg-2">
      <OpenBookIcon className="size-4 shrink-0 text-fg-3" />
      {readLabel(dates)}
    </p>
  )
}
