import { HeartIcon } from '@/components/icons'

export function FavoriteMark() {
  return (
    <>
      <HeartIcon className="size-4 shrink-0 text-danger" filled />
      <span className="sr-only">Favorite</span>
    </>
  )
}
