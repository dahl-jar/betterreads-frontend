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
    'rounded-md border border-rule px-4 py-2 text-sm font-semibold text-fg hover:border-fg-3 disabled:cursor-not-allowed disabled:text-fg-3 disabled:hover:border-rule'

  return (
    <nav
      aria-label={ariaLabel}
      className="mt-10 flex items-center justify-between border-t border-rule pt-6"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious}
        className={buttonClass}
      >
        Previous
      </button>
      <span className="text-sm font-semibold text-fg-2">Page {page}</span>
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
