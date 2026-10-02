import { type ShelfCounts } from '@/features/shelf/api/getShelfCounts'
import { formatCount } from '@/lib/formatCount'

type BookStatsProps = {
  reviewTotal: number
  counts: ShelfCounts
}

export function BookStats({ reviewTotal, counts }: BookStatsProps) {
  const stats = [
    { label: 'Reviews', value: reviewTotal },
    { label: 'Reading now', value: counts.currentlyReading },
    { label: 'Read', value: counts.finished },
    { label: 'Want to read', value: counts.wantToRead },
  ]

  return (
    <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-brand/15 bg-brand/15 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-brand-soft px-5 py-4 text-center">
          <dt className="label-caps text-fg-2">{stat.label}</dt>
          <dd className="mt-1 font-title text-2xl text-brand">{formatCount(stat.value)}</dd>
        </div>
      ))}
    </dl>
  )
}
