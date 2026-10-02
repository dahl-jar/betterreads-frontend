import { StarIcon } from '@/components/icons'
import { formatRating } from '@/lib/formatRating'

const STARS = [1, 2, 3, 4, 5] as const
const MAX_RATING = 5
const PERCENT = 100

const STAR_SIZE = {
  sm: 'size-3.5',
  md: 'size-4',
  lg: 'size-7',
} as const

type StarRatingProps = {
  value: number
  onRate?: (rating: number) => void
  disabled?: boolean
  size?: keyof typeof STAR_SIZE
}

export function StarRating({ value, onRate, disabled = false, size }: StarRatingProps) {
  if (onRate === undefined) {
    const starClass = `${STAR_SIZE[size ?? 'md']} shrink-0`
    return (
      <span
        role="img"
        className="relative inline-flex"
        aria-label={`Rated ${formatRating(value)} of ${MAX_RATING}`}
      >
        <span className="flex text-rule">
          {STARS.map((star) => (
            <StarIcon key={star} className={starClass} />
          ))}
        </span>
        <span
          className="absolute inset-y-0 left-0 flex overflow-hidden text-star"
          style={{ width: `${(value / MAX_RATING) * PERCENT}%` }}
        >
          {STARS.map((star) => (
            <StarIcon key={star} className={starClass} />
          ))}
        </span>
      </span>
    )
  }

  const rounded = Math.round(value)
  const starClass = STAR_SIZE[size ?? 'lg']

  return (
    <span className="inline-flex gap-1">
      {STARS.map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRate(star)}
          disabled={disabled}
          aria-pressed={star <= rounded}
          aria-label={`Rate ${star} of ${MAX_RATING}`}
          className={`disabled:opacity-50 ${star <= rounded ? 'text-star' : 'text-rule hover:text-fg-3'}`}
        >
          <StarIcon className={starClass} />
        </button>
      ))}
    </span>
  )
}
