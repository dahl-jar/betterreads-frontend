import { type ReadingStatus } from '../api/shelfSchemas'

export const READING_STATUS_LABELS: Record<ReadingStatus, string> = {
  WANT_TO_READ: 'Want to read',
  CURRENTLY_READING: 'Currently reading',
  FINISHED: 'Read',
  DROPPED: 'Dropped',
}
