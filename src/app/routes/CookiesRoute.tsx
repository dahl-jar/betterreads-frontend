import { StaticPage } from '@/app/components/StaticPage'

export function CookiesRoute() {
  return (
    <StaticPage title="Cookie policy">
      <p>BetterReads uses one cookie for signed-in accounts. It does not set tracking cookies.</p>
      <h2>The sign-in cookie</h2>
      <p>
        When you create an account or log in, we set a cookie named <code>br_refresh</code>. It
        lasts for 30 days and lets us renew your session when you return or reload the page. Logging
        out clears it in that browser. Without it, a reload or later visit would require you to log
        in again.
      </p>
      <h2>No tracking</h2>
      <p>
        We do not use cookies for analytics, advertising, or tracking. BetterReads does not set
        optional cookies, so there are no cookie preferences to choose.
      </p>
    </StaticPage>
  )
}
