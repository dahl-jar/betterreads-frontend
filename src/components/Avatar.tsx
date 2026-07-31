type AvatarProps = {
  name: string
  url?: string | null | undefined
  size?: 'sm' | 'md'
}

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
} as const

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const initial = name.trim() === '' ? '?' : name.trim().charAt(0).toUpperCase()
  const dimensions = SIZES[size]

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${dimensions} shrink-0 rounded-full border border-line object-cover`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full border border-green/15 bg-green-soft font-semibold text-green-deep`}
    >
      {initial}
    </span>
  )
}
