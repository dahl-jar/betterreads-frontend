const FORMATTER = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
})

/** Formats an ISO date as `Feb 14, 2026`, preserving its calendar day in every time zone. */
export function formatShelfDate(isoDate: string | null | undefined): string | undefined {
  if (!isoDate) {
    return undefined
  }
  return FORMATTER.format(new Date(`${isoDate}T00:00:00Z`))
}
