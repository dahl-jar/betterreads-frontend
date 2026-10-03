import { StaticPage } from '@/app/components/StaticPage'

export function AboutRoute() {
  return (
    <StaticPage
      title="About BetterReads"
      lead="BetterReads is a place to keep track of what you read and find your next book."
      sections={[
        {
          id: 'how',
          heading: 'How it works',
          body: 'Search the catalog, open a book, and add it to your shelves. You can rate it, review it, and discuss it with other readers.',
        },
        {
          heading: 'Where the books come from',
          body: "Book details come from public book databases. We list a book once its title, author, cover, description, and year are all in place. If you search for a book we don't have, we look for it, and it can show up on a later search.",
        },
        {
          heading: 'Who runs it',
          body: 'One person runs BetterReads as a personal project. There are no ads and nothing to pay for.',
        },
      ]}
    />
  )
}
