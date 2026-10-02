import { formatCount } from '@/lib/formatCount'

import { type CommunityRating } from '../api/getCommunityRating'

type CommunityRatingSummaryProps = {
  rating: CommunityRating
}

const PERCENT = 100
const MIN_FILLED_BAR_PERCENT = 8
const EMPTY_BAR_PERCENT = 4
const COUNT_LABEL_HEIGHT = '1.25rem'

function percent(count: number, total: number): number {
  return total === 0 ? 0 : Math.round((count / total) * PERCENT)
}

function barHeight(count: number, total: number): string {
  const share =
    count === 0 ? EMPTY_BAR_PERCENT : Math.max(percent(count, total), MIN_FILLED_BAR_PERCENT)
  return `calc((100% - ${COUNT_LABEL_HEIGHT}) * ${share / PERCENT})`
}

export function CommunityRatingSummary({ rating }: CommunityRatingSummaryProps) {
  if (rating.count === 0) {
    return null
  }

  const buckets = [...rating.distribution].sort((low, high) => low.star - high.star)

  return (
    <div className="rounded-md border border-rule p-4">
      <h2 className="label-caps">BetterReads ratings</h2>

      <ul className="mt-3 flex h-24 gap-1.5 border-b border-rule">
        {buckets.map((bucket) => (
          <li
            key={bucket.star}
            aria-label={`${bucket.star} ${bucket.star === 1 ? 'star' : 'stars'}: ${formatCount(bucket.count)} (${percent(bucket.count, rating.count)}%)`}
            className="flex flex-1 flex-col items-center justify-end"
          >
            {bucket.count > 0 ? (
              <span className="text-xs font-semibold leading-5 text-fg">
                {formatCount(bucket.count)}
              </span>
            ) : null}
            <span
              aria-hidden="true"
              className={`w-full rounded-t-[2px] ${bucket.count === 0 ? 'bg-rule' : 'bg-star'}`}
              style={{ height: barHeight(bucket.count, rating.count) }}
            />
          </li>
        ))}
      </ul>
      <div className="mt-1.5 flex justify-between text-xs text-fg-3" aria-hidden="true">
        <span>1 star</span>
        <span>5 stars</span>
      </div>
    </div>
  )
}
