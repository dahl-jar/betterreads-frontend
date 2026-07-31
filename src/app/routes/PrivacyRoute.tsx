import { Link } from 'react-router-dom'

import { StaticPage } from '@/app/components/StaticPage'

export function PrivacyRoute() {
  return (
    <StaticPage title="Privacy policy">
      <p>
        BetterReads keeps the information needed to run your account, reading record, and public
        discussions.
      </p>
      <h2>Account and reading data</h2>
      <p>
        Your account data includes your username, email address, and any profile fields you add. We
        never store your password as entered. We store a one-way BCrypt hash so we can check it when
        you sign in.
      </p>
      <p>
        Your shelves, reading dates, and notes are private. Reviews and ratings are public without
        an author name. Comments and replies are public and show your username.
      </p>
      <h2>Searches</h2>
      <p>
        Search terms are logged briefly. We send the term without your account identity to
        Hardcover. When Hardcover has no result, we send the same term to OpenLibrary.
      </p>
      <h2>Services we use</h2>
      <p>
        Cloudflare processes web traffic and hosts the website and encrypted backups. Resend
        delivers account emails. Grafana Cloud receives operational logs and metrics. Messages sent
        to our contact address pass through Cloudflare Email Routing and Gmail.
      </p>
      <h2>Cookies</h2>
      <p>
        Signed-in accounts use one 30-day cookie to renew a session when you return or reload a
        page. BetterReads does not set tracking cookies. See the{' '}
        <Link to="/cookies">cookie policy</Link>.
      </p>
      <h2>Deleting your account</h2>
      <p>
        Deleting your account immediately disables it and signs out the browser making the request.
        The account cannot be restored. A device that is already signed in may keep access for up to
        two hours.
      </p>
      <p>
        After 30 days, your account, shelf, review, rating, and comment data are deleted from the
        live service. During those 30 days, reviews and ratings remain public without your identity,
        and your username is removed from comments and replies. Encrypted backups may retain the
        deleted data for about another 30 days.
      </p>
      <p>
        Mail-delivery and operational records follow separate retention periods and are not removed
        by account deletion. To ask about your data, use the contact link in the footer.
      </p>
      <p>If this policy changes, we will update this page.</p>
    </StaticPage>
  )
}
