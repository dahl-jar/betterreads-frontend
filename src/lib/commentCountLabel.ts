import { formatCount } from '@/lib/formatCount'

export function commentCountLabel(count: number): string {
  return count === 1 ? '1 comment' : `${formatCount(count)} comments`
}
