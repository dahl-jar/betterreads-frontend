const STARS = [1, 2, 3, 4, 5] as const

type StarRatingProps = {
  value: number
  onRate?: (rating: number) => void
  disabled?: boolean
}

export function StarRating({ value, onRate, disabled = false }: StarRatingProps) {
  const rounded = Math.round(value)

  if (onRate === undefined) {
    return (
      <span className="inline-flex text-rust" aria-label={`Rated ${rounded} of 5`}>
        {STARS.map((star) => (
          <span key={star} aria-hidden="true">
            {star <= rounded ? '★' : '☆'}
          </span>
        ))}
      </span>
    )
  }

  return (
    <span className="inline-flex">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          disabled={disabled}
          aria-pressed={star <= rounded}
          aria-label={`Rate ${star} of 5`}
          className="px-0.5 text-2xl leading-none text-rust disabled:opacity-50"
        >
          <span aria-hidden="true">{star <= rounded ? '★' : '☆'}</span>
        </button>
      ))}
    </span>
  )
}
