import { type ShelfEntry } from '../api/shelfSchemas'

export type ShelfItemProps = {
  entry: ShelfEntry
  query: string
  onRate: (rating: number) => Promise<void>
  onEntryChange: (entry: ShelfEntry | undefined) => void
}
