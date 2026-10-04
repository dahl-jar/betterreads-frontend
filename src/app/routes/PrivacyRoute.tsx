import { Link } from 'react-router-dom'

import { StaticPage } from '@/app/components/StaticPage'
import { CONTACT_EMAIL } from '@/app/siteLinks'

export function PrivacyRoute() {
  return (
    <StaticPage
      title="Privacy policy"
      lead="We keep only what we need to run your account."
      summary={[
        'No ads and no tracking cookies.',
        'Your shelves are private.',
        'You can delete your account at any time.',
      ]}
      sections={[
        {
          heading: 'What we store',
          body: "Your username, email address, and password. The password is stored in a protected form that can't be read back. We also store your shelves, ratings, reviews, and comments.",
        },
        {
          heading: 'What others can see',
          body: 'Your shelves are private. Your ratings, reviews, and comments are public and show your username. A review also shows when you read the book.',
        },
        {
          heading: 'Searches',
          body: "When you search, the search words go to outside book databases so we can find books we don't have yet. Nothing about you goes with them. We keep search words in our logs for a short time.",
        },
        {
          heading: 'Who helps us run the site',
          body: 'Other companies host the site, deliver our emails, and keep our logs. They handle your data only to do that work.',
        },
        {
          heading: 'Cookies',
          body: (
            <>
              One cookie keeps you signed in. See the{' '}
              <Link to="/cookies" className="font-semibold text-brand underline underline-offset-2">
                cookie policy
              </Link>
              .
            </>
          ),
        },
        {
          heading: 'Deleting your account',
          body: "Deleting your account disables it at once, and it can't be restored. After 30 days your data is removed from the site. Until then your ratings and reviews stay up without your name. Backups can keep a copy for up to 8 more weeks.",
        },
        {
          heading: 'Questions',
          body: (
            <>
              Email{' '}
              <strong className="whitespace-nowrap rounded-md bg-brand-soft px-1.5 py-0.5 font-semibold text-brand">
                {CONTACT_EMAIL}
              </strong>
              . If this policy changes, we update this page.
            </>
          ),
        },
      ]}
    />
  )
}
