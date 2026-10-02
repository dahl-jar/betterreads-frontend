const RATING_DECIMALS = 2

export function formatRating(value: number): string {
  return String(Number(value.toFixed(RATING_DECIMALS)))
}
