import { StaticPage } from '@/app/components/StaticPage'

export function CookiesRoute() {
  return (
    <StaticPage
      title="Cookie policy"
      lead="BetterReads uses one cookie."
      sections={[
        {
          heading: 'The sign-in cookie',
          body: 'It keeps you signed in. If you tick Remember me, it lasts 30 days from when you log in. If not, it ends when you close your browser, or after 24 hours. Logging out removes it.',
        },
        {
          heading: 'No tracking',
          body: 'We use no cookies for ads, analytics, or tracking. Nothing is optional, so there are no cookie settings to choose.',
        },
      ]}
    />
  )
}
