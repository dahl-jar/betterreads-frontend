import { Link } from 'react-router-dom'

import { StaticPage } from '@/app/components/StaticPage'

export function HelpRoute() {
  return (
    <StaticPage title="Help">
      <h2>Why can&apos;t I find a book?</h2>
      <p>
        We show a book only when its core details are complete, so you never open a half-empty page.
        When you search for one we don&apos;t have, we go and check our sources for it. If a
        complete copy is out there, it shows up on a later search.
      </p>
      <p>
        Some books we simply can&apos;t list: they aren&apos;t in any of our sources, or they only
        turn up with key details missing. We&apos;d rather leave a book out than show you a broken
        entry.
      </p>
      <h2>I forgot my password</h2>
      <p>Use the reset link on the login page. We email a link that lets you set a new password.</p>
      <h2>How do I delete my account?</h2>
      <p>
        Delete your account from Settings. It is disabled immediately and cannot be restored. We
        sign out this browser, though another signed-in device may keep access for up to two hours.
        We delete your account, shelves, reviews, ratings, comments, and replies from the live
        service after 30 days. Reviews and ratings remain public during that time without your
        identity, and your username is removed from comments and replies. See the{' '}
        <Link to="/privacy">privacy policy</Link> for how long backups and service records are kept.
      </p>
      <h2 id="contact">Contact</h2>
      <p>
        For anything not covered here, email us at{' '}
        <strong className="contact-email">contact@betterreadsapp.com</strong> and we&apos;ll get
        back to you.
      </p>
    </StaticPage>
  )
}
