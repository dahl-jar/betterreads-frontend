import { StarRating } from '@/components/StarRating'

import { type CommunityRating } from '../api/getCommunityRating'

type CommunityRatingSummaryProps = {
  rating: CommunityRating
}

function percent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * 100)
}

export function CommunityRatingSummary({ rating }: CommunityRatingSummaryProps) {
  if (rating.count === 0 || rating.average === null || rating.average === undefined) {
    return null
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-3">
        <StarRating value={rating.average} />
        <span className="text-3xl font-semibold text-ink">{rating.average.toFixed(2)}</span>
        <span className="text-sm text-ink-soft">
          {rating.count.toLocaleString()} {rating.count === 1 ? 'rating' : 'ratings'}
        </span>
      </div>

      <ul className="mt-3 space-y-1.5">
        {rating.distribution.map((bucket) => {
          const pct = percent(bucket.count, rating.count)
          return (
            <li key={bucket.star} className="flex items-center gap-3 text-sm">
              <span className="w-12 shrink-0 text-ink-soft">{bucket.star} stars</span>
              <span className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                <span className="block h-full rounded-full bg-rust" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-28 shrink-0 text-right text-ink-soft">
                {bucket.count.toLocaleString()} ({pct}%)
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
