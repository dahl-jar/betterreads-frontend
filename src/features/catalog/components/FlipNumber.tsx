import { useState } from 'react'

import { formatCount } from '@/lib/formatCount'

type FlipNumberProps = {
  value: number
}

type Seen = {
  value: number
  previous: number | undefined
}

function isDigit(char: string): boolean {
  return char >= '0' && char <= '9'
}

export function FlipNumber({ value }: FlipNumberProps) {
  const [seen, setSeen] = useState<Seen>({ value, previous: undefined })
  if (seen.value !== value) {
    setSeen({ value, previous: seen.value })
  }

  const formatted = formatCount(value)
  const before = seen.previous === undefined ? undefined : [...formatCount(seen.previous)]
  return (
    <span className="flip-number" aria-label={formatted}>
      {[...formatted].map((char, index) => {
        if (!isDigit(char)) {
          return (
            <span key={`${index}-${char}`} className="flip-separator">
              {char}
            </span>
          )
        }
        const flips = before !== undefined && before[index] !== char
        return (
          <span key={`${index}-${char}`} className="flip-digit" data-flip={flips}>
            {char}
          </span>
        )
      })}
    </span>
  )
}
