import { getShelf } from './getShelf'
import { type ShelfEntry } from './shelfSchemas'

export async function getShelfEntry(
  key: string,
  signal?: AbortSignal,
): Promise<ShelfEntry | undefined> {
  const shelf = await getShelf(signal)
  return shelf.find((entry) => entry.key === key)
}
