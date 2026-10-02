import { z } from 'zod'

export const seriesSchema = z.array(z.object({ name: z.string(), position: z.number() }))

type SeriesEntry = { name: string; position: number | undefined }

type SeriesFields = {
  series?: z.infer<typeof seriesSchema> | undefined
  seriesName?: string | null | undefined
  seriesPosition?: number | null | undefined
}

export function seriesEntries({ series, seriesName, seriesPosition }: SeriesFields): SeriesEntry[] {
  if (series !== undefined && series.length > 0) {
    return series
  }
  return seriesName ? [{ name: seriesName, position: seriesPosition ?? undefined }] : []
}
