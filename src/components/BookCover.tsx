import { useState } from 'react'

import { httpOnlyUrl } from '@/lib/httpOnlyUrl'
import { initialOf } from '@/lib/initialOf'

type BookCoverProps = {
  coverUrl?: string | null | undefined
  title: string
  className: string
}

export function BookCover({ coverUrl, title, className }: BookCoverProps) {
  const [failedUrl, setFailedUrl] = useState<string | undefined>(undefined)
  const webUrl = coverUrl ? httpOnlyUrl(coverUrl) : ''

  if (!webUrl || failedUrl === webUrl) {
    return (
      <div
        aria-hidden="true"
        className={`${className} flex items-center justify-center bg-sunken font-title text-2xl text-fg-3`}
      >
        {initialOf(title)}
      </div>
    )
  }

  return (
    <img
      src={webUrl}
      alt=""
      loading="lazy"
      decoding="async"
      onError={() => setFailedUrl(webUrl)}
      className={`${className} object-cover`}
    />
  )
}
