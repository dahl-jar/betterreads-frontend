import { BookCover } from '@/components/BookCover'
import { useBookList } from '@/features/catalog/hooks/useBookList'

const ROW_COUNT = 4
const ROW_COPIES = 4
const ROW_DELAY_SECONDS = 31
export function CoverRows() {
  const { status, cards } = useBookList('TOP_RATED')
  const covered = cards.filter((card) => card.coverUrl)

  if (status !== 'success' || covered.length === 0) {
    return null
  }

  const rows = Array.from({ length: ROW_COUNT }, (_unused, row) =>
    covered.filter((_card, index) => index % ROW_COUNT === row),
  )

  return (
    <div aria-hidden="true" className="absolute inset-0 hidden flex-col gap-5 py-5 md:flex">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="min-h-0 flex-1">
          <div
            className={`cover-row flex h-full w-max gap-5 pr-5 ${rowIndex % 2 === 1 ? 'cover-row-back' : ''}`}
            style={{ animationDelay: `-${rowIndex * ROW_DELAY_SECONDS}s` }}
          >
            {Array.from({ length: ROW_COPIES }, (_unused, copy) =>
              row.map((card) => (
                <BookCover
                  key={`${copy}-${card.key}`}
                  coverUrl={card.coverUrl}
                  title={card.title}
                  className="aspect-[2/3] h-full w-auto rounded-[3px] shadow-cover"
                />
              )),
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
