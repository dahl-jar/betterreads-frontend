import { type ShelfCounts } from '@/features/shelf/api/getShelfCounts'
import { formatCount } from '@/lib/formatCount'

type BookStatsProps = {
  reviewTotal: number
  counts: ShelfCounts
}

export function BookStats({ reviewTotal, counts }: BookStatsProps) {
  const stats = [
    { label: 'Want to read', value: counts.wantToRead },
    { label: 'Reading now', value: counts.currentlyReading },
    { label: 'Read', value: counts.finished },
    { label: 'Reviews', value: reviewTotal },
  ]

  return (
    <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule bg-rule sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-raised px-6 py-4 text-center">
          <dt className="text-sm text-fg-2">{stat.label}</dt>
          <dd className="mt-0.5 text-2xl font-bold leading-tight tabular-nums text-fg">
            {formatCount(stat.value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}
