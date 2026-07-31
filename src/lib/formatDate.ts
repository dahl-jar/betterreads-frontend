const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeZone: 'UTC',
})

export function formatDate(value: string): string {
  return DATE_FORMATTER.format(new Date(value))
}
