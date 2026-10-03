import { type ComponentType } from 'react'

import { DroppedIcon, ReadIcon, ReadingIcon, WantIcon } from '@/components/icons'

import { type ReadingStatus } from '../api/shelfSchemas'

type StatusIcon = {
  Icon: ComponentType<{ className?: string }>
  tone: string
}

export const READING_STATUS_ICONS: Record<ReadingStatus, StatusIcon> = {
  WANT_TO_READ: { Icon: WantIcon, tone: 'text-fg' },
  CURRENTLY_READING: { Icon: ReadingIcon, tone: 'text-brand' },
  FINISHED: { Icon: ReadIcon, tone: 'text-read' },
  DROPPED: { Icon: DroppedIcon, tone: 'text-dropped' },
}
