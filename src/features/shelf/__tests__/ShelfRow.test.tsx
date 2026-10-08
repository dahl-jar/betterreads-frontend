import { describe, expect, it, vi } from 'vitest'

import shelfEntry from '@/testing/mocks/shelf-entry.json'
import { renderWithProviders, screen } from '@/testing/test-utils'

import { type ShelfEntry } from '../api/shelfSchemas'
import { ShelfRow } from '../components/ShelfRow'

const DUNE = { ...shelfEntry, status: 'WANT_TO_READ' } satisfies ShelfEntry
const UNRATED = { ...DUNE, communityAverage: null, communityCount: 0 }

function renderRow(entry: ShelfEntry) {
  renderWithProviders(
    <ul>
      <ShelfRow entry={entry} query="" onRate={vi.fn()} onEntryChange={vi.fn()} />
    </ul>,
  )
}

describe('ShelfRow', () => {
  it('should show the BetterReads rating', () => {
    renderRow(DUNE)

    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('BetterReads')).toBeInTheDocument()
  })

  it('should show no rating without BetterReads ratings', () => {
    renderRow(UNRATED)

    expect(screen.queryByText('BetterReads')).toBeNull()
  })
})
