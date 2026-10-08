import { StaticPage } from '@/app/components/StaticPage'

export function TermsRoute() {
  return (
    <StaticPage
      title="Terms of service"
      lead="By using BetterReads you agree to these terms."
      sections={[
        {
          heading: 'The service',
          body: 'BetterReads is a personal project, provided as is. It can be unavailable at times, and book details can contain mistakes.',
        },
        {
          heading: 'Your account',
          body: "Keep your password safe. You are responsible for what happens on your account. Post only what you have the right to share, and don't abuse the site or other readers.",
        },
        {
          heading: 'Data sources',
          body: 'Book details come from Hardcover, Open Library, Google Books, Wikidata, Wikipedia, the Library of Congress and Apple Books. Ratings marked Hardcover come from Hardcover. Ratings marked BetterReads come from readers here.',
        },
        {
          heading: 'Changes',
          body: 'These terms and the site can change over time. You can delete your account at any time. We may suspend an account that abuses the site.',
        },
      ]}
    />
  )
}
