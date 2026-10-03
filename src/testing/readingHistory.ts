import shelfEntry from './mocks/shelf-entry.json'

function finished(key: string, title: string, finishedAt: string) {
  return {
    ...shelfEntry,
    key,
    title,
    authors: ['Pierce Brown'],
    status: 'FINISHED' as const,
    finishedAt,
  }
}

export const RED_RISING = finished('OL2W', 'Red Rising', '2026-06-05')
export const GOLDEN_SON = finished('OL3W', 'Golden Son', '2026-06-12')
export const MORNING_STAR = finished('OL4W', 'Morning Star', '2026-05-20')
export const IRON_GOLD = finished('OL5W', 'Iron Gold', '2025-06-05')
export const DARK_AGE = {
  ...shelfEntry,
  key: 'OL6W',
  title: 'Dark Age',
  status: 'CURRENTLY_READING' as const,
}
