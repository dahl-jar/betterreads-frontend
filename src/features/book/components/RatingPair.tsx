import { useId } from 'react'

import { StarRating } from '@/components/StarRating'
import { formatCount } from '@/lib/formatCount'
import { formatRating } from '@/lib/formatRating'

export type Rating = {
  average: number
  count: number
}

type RatingPairProps = {
  hardcover?: Rating | undefined
  community?: Rating | undefined
}

function RatingCell({ source, rating }: { source: string; rating: Rating | undefined }) {
  const labelId = useId()

  return (
    <div role="group" aria-labelledby={labelId}>
      <p id={labelId} className="label-caps">
        {source}
      </p>
      <p className="mt-1.5 flex items-center gap-2">
        {rating ? (
          <>
            <StarRating value={rating.average} />
            <span className="text-xl font-semibold text-fg">{formatRating(rating.average)}</span>
            {rating.count > 0 ? (
              <span className="text-sm text-fg-2">
                {rating.count === 1 ? '1 rating' : `${formatCount(rating.count)} ratings`}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-sm text-fg-2">No ratings yet</span>
        )}
      </p>
    </div>
  )
}

export function RatingPair({ hardcover, community }: RatingPairProps) {
  return (
    <div className="flex flex-wrap gap-x-12 gap-y-4">
      <RatingCell source="Hardcover" rating={hardcover} />
      <RatingCell source="BetterReads" rating={community} />
    </div>
  )
}
