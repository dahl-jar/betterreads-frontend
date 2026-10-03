import { useRef, useState } from 'react'

import { CONTACT_EMAIL } from '@/app/siteLinks'
import { CopyIcon, MailIcon } from '@/components/icons'

export function ContactCard() {
  const [copied, setCopied] = useState(false)
  const addressRef = useRef<HTMLSpanElement>(null)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL)
      setCopied(true)
    } catch {
      if (addressRef.current) {
        window.getSelection()?.selectAllChildren(addressRef.current)
      }
    }
  }

  return (
    <section id="contact" className="mt-16 scroll-mt-6">
      <h2 className="font-title text-3xl leading-tight tracking-tight text-fg">Contact</h2>
      <div className="mt-6 max-w-sm rounded-[3px] border border-rule p-5">
        <p className="flex items-center gap-2 font-semibold text-fg">
          <MailIcon className="size-[1.125rem] text-fg-2" />
          Email
        </p>
        <p className="mt-1 text-sm text-fg-2">
          Still stuck? Email us and we&apos;ll get back to you.
        </p>
        <p className="mt-4 flex items-center gap-1.5">
          <span ref={addressRef} className="min-w-0 break-words text-fg">
            {CONTACT_EMAIL}
          </span>
          <button
            type="button"
            aria-label="Copy address"
            onClick={() => void onCopy()}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-fg-2 hover:bg-sunken hover:text-fg"
          >
            <CopyIcon className="size-4" />
          </button>
          <span role="status" className="text-xs font-semibold text-read">
            {copied ? 'Copied' : null}
          </span>
        </p>
      </div>
    </section>
  )
}
