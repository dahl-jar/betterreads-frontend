import { useNavigate } from 'react-router-dom'

import { type BookCard } from '@/features/catalog/api/getBookList'
import { BookListRow } from '@/features/catalog/components/BookListRow'
import { CatalogHeadline } from '@/features/catalog/components/CatalogHeadline'
import { NewBookCard } from '@/features/catalog/components/NewBookCard'
import { useBookList } from '@/features/catalog/hooks/useBookList'
import { RecentReviews } from '@/features/reviews/components/RecentReviews'
import { SearchForm } from '@/features/search/components/SearchForm'

import { ReviewThread } from '../components/ReviewThread'
import { searchPath } from '../searchPath'

function rankLabel(_card: BookCard, index: number): string {
  return `No. ${index + 1}`
}

function yearLabel(card: BookCard): string {
  return card.firstPublishYear ? String(card.firstPublishYear) : ''
}

export function HomeRoute() {
  const navigate = useNavigate()
  const topRated = useBookList('TOP_RATED')
  const recentlyAdded = useBookList('RECENTLY_ADDED')
  const newestBook = recentlyAdded.cards[0]

  const runSearch = (query: string) => {
    void navigate(searchPath(query))
  }

  return (
    <main className="flex-1">
      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 pb-4 pt-7 md:grid-cols-[minmax(0,1fr)_19rem] md:items-center md:gap-14 md:pb-10 md:pt-16">
        <div className="min-w-0">
          <CatalogHeadline />
          <div className="mt-4 md:mt-7">
            <SearchForm variant="hero" onSearch={runSearch} />
          </div>
        </div>
        {newestBook ? <NewBookCard card={newestBook} /> : null}
      </section>
      <BookListRow
        title="Top rated"
        note="Ranked by Hardcover rating"
        state={topRated}
        labelOf={rankLabel}
      />
      <BookListRow
        title="Recently added"
        note="Newest first"
        state={recentlyAdded}
        labelOf={yearLabel}
      />
      <RecentReviews renderComments={(reviewId) => <ReviewThread reviewId={reviewId} />} />
    </main>
  )
}
