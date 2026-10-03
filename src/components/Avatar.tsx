import { initialOf } from '@/lib/initialOf'

type AvatarProps = {
  name: string
  url?: string | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'xl'
}

const SIZES = {
  xs: 'h-6 w-6 text-[0.6875rem]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-9 w-9 text-sm',
  xl: 'h-20 w-20 text-3xl',
} as const

export function Avatar({ name, url, size = 'md' }: AvatarProps) {
  const dimensions = SIZES[size]

  if (url) {
    return (
      <img
        src={url}
        alt=""
        className={`${dimensions} shrink-0 rounded-full border border-rule object-cover`}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`${dimensions} flex shrink-0 items-center justify-center rounded-full bg-brand-soft ${size === 'xl' ? 'font-title' : 'font-semibold'} text-brand`}
    >
      {initialOf(name)}
    </span>
  )
}
