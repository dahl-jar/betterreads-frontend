import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { ContactCard } from '@/app/components/ContactCard'
import { StaticLayout } from '@/app/components/StaticLayout'
import { ChevronDownIcon } from '@/components/icons'

type Question = {
  question: string
  answer: ReactNode
}

const QUESTIONS: Question[] = [
  {
    question: "Why can't I find a book?",
    answer:
      "We list a book once its details are complete. When you search for one we don't have, we look for it, and it can show up on a later search. Some books can't be listed because their details are missing everywhere we look.",
  },
  {
    question: 'How do I add a book to my shelves?',
    answer:
      'Open the book and choose Want to read. The arrow next to it has the other shelves: Currently reading, Read, and Did not finish.',
  },
  {
    question: 'How do I write a review?',
    answer:
      'Open the book and pick a star rating under Reviews. The review box opens, and writing in it is optional.',
  },
  {
    question: 'Who can see my books and reviews?',
    answer:
      'Your shelves and dates are private. Your ratings, reviews, and comments are public and show your username.',
  },
  {
    question: 'I forgot my password',
    answer: 'Choose Forgot password? on the login page. We email you a link to set a new one.',
  },
  {
    question: 'How do I delete my account?',
    answer: (
      <>
        Go to Settings and choose Delete my account. It can&apos;t be undone, and your data is
        removed after 30 days. The{' '}
        <Link to="/privacy" className="font-semibold text-brand underline underline-offset-2">
          privacy policy
        </Link>{' '}
        has the details.
      </>
    ),
  },
]

export function HelpRoute() {
  return (
    <StaticLayout title="Help">
      <div className="mt-8 border-t border-rule text-[1.0625rem] leading-7">
        {QUESTIONS.map((item, index) => (
          <details
            key={item.question}
            open={index === 0}
            className="group border-b border-rule open:bg-sunken"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-semibold text-fg hover:text-brand [&::-webkit-details-marker]:hidden">
              {item.question}
              <ChevronDownIcon className="size-4 shrink-0 text-brand transition-transform group-open:rotate-180" />
            </summary>
            <p className="max-w-[62ch] px-4 pb-5 text-fg-2">{item.answer}</p>
          </details>
        ))}
      </div>
      <ContactCard />
    </StaticLayout>
  )
}
