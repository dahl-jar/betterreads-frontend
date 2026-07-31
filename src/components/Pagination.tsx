type PaginationProps = {
  page: number
  hasNext: boolean
  ariaLabel: string
  onPageChange: (page: number) => void
}

export function Pagination({ page, hasNext, ariaLabel, onPageChange }: PaginationProps) {
  const hasPrevious = page > 1
  if (!hasNext && !hasPrevious) {
    return null
  }

  const buttonClass =
    'rounded-md border border-line px-4 py-2 text-sm font-semibold text-ink hover:border-green hover:text-green disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line disabled:hover:text-ink'

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-8 flex items-center justify-between border-t border-line pt-4"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious}
        className={buttonClass}
      >
        Previous
      </button>
      <span className="text-sm text-ink-soft">Page {page}</span>
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        className={buttonClass}
      >
        Next
      </button>
    </nav>
  )
}
