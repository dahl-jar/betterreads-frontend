import { StaticPage } from '@/app/components/StaticPage'

export function TermsRoute() {
  return (
    <StaticPage title="Terms of service">
      <p>By using BetterReads you agree to these terms.</p>
      <h2>The service</h2>
      <p>
        BetterReads is a hobby-run reading tracker offered as is, without warranty. We try to keep
        it available and your data safe, but we cannot guarantee uninterrupted service. Book
        metadata is merged from public sources and may contain errors.
      </p>
      <h2>Your account</h2>
      <p>
        You are responsible for keeping your password safe and for the activity on your account. Do
        not upload content you do not have the right to share, and do not abuse the service or other
        readers.
      </p>
      <h2>Changes and termination</h2>
      <p>
        We may update these terms or the service over time. You can delete your account at any time.
        We may suspend an account that abuses the service.
      </p>
    </StaticPage>
  )
}
