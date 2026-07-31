import { StaticPage } from '@/app/components/StaticPage'

export function AboutRoute() {
  return (
    <StaticPage title="About BetterReads">
      <p>
        BetterReads is a reading tracker for people who want a clean record of what they read and an
        honest way to find their next book. Every book in the catalog is merged from several public
        sources, each field taken from the source most likely to have it right.
      </p>
      <h2 id="how">How it works</h2>
      <p>
        Search the catalog, open a book, and track it on your shelves. When you search for a book we
        don&apos;t have yet, we go and check our sources for it. If a complete copy is out there, it
        shows up on a later search. If a book isn&apos;t in our sources, or only turns up with
        details missing, we leave it out rather than show a broken entry.
      </p>
      <h2>How it stays funded</h2>
      <p>This is a small personal project, not a business. There are no ads and no paid tiers.</p>
    </StaticPage>
  )
}
