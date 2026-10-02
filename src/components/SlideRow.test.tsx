import { describe, expect, it } from 'vitest'

import { fireEvent, render, screen, userEvent } from '@/testing/test-utils'

import { SlideRow } from './SlideRow'

const STRIP_WIDTH = 600
const CONTENT_WIDTH = 2000

function renderRow() {
  return render(
    <SlideRow title="Top rated" note="By reader score" itemCount={2}>
      <li>Alpha</li>
      <li>Bravo</li>
    </SlideRow>,
  )
}

function scrollStripTo(scrollLeft: number) {
  const strip = screen.getByRole('list')
  const scrolls: number[] = []
  Object.defineProperty(strip, 'clientWidth', { value: STRIP_WIDTH, configurable: true })
  Object.defineProperty(strip, 'scrollWidth', { value: CONTENT_WIDTH, configurable: true })
  Object.defineProperty(strip, 'scrollLeft', { value: scrollLeft, configurable: true })
  Object.defineProperty(strip, 'scrollBy', {
    configurable: true,
    value: (options: ScrollToOptions) => scrolls.push(options.left ?? 0),
  })
  fireEvent.scroll(strip)
  return scrolls
}

describe('SlideRow', () => {
  it('should name the row by its title', () => {
    renderRow()

    expect(screen.getByRole('region', { name: 'Top rated' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Top rated', level: 2 })).toBeInTheDocument()
  })

  it('should show the note', () => {
    renderRow()

    expect(screen.getByText('By reader score')).toBeInTheDocument()
  })

  it('should head a row without a note by its title', () => {
    render(
      <SlideRow title="Top rated" itemCount={1}>
        <li>Alpha</li>
      </SlideRow>,
    )

    expect(screen.getByRole('heading', { name: 'Top rated', level: 2 })).toBeInTheDocument()
  })

  it('should show the given heading on a row without a note', () => {
    render(
      <SlideRow
        title="Top rated"
        heading={
          <>
            Top rated <strong>this week</strong>
          </>
        }
        itemCount={1}
      >
        <li>Alpha</li>
      </SlideRow>,
    )

    expect(
      screen.getByRole('heading', { name: 'Top rated this week', level: 2 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Top rated' })).toBeInTheDocument()
  })

  it('should scroll forward on Next', async () => {
    const user = userEvent.setup()
    renderRow()
    const scrolls = scrollStripTo(0)

    await user.click(screen.getByRole('button', { name: 'Top rated, next' }))

    expect(scrolls).toHaveLength(1)
    expect(scrolls[0]).toBeGreaterThan(0)
  })

  it('should scroll back on Previous', async () => {
    const user = userEvent.setup()
    renderRow()
    const scrolls = scrollStripTo(STRIP_WIDTH)

    await user.click(screen.getByRole('button', { name: 'Top rated, previous' }))

    expect(scrolls).toHaveLength(1)
    expect(scrolls[0]).toBeLessThan(0)
  })

  it('should disable Previous at the start', () => {
    renderRow()

    scrollStripTo(0)

    expect(screen.getByRole('button', { name: 'Top rated, previous' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Top rated, next' })).toBeEnabled()
  })

  it('should disable Next at the end', () => {
    renderRow()

    scrollStripTo(CONTENT_WIDTH - STRIP_WIDTH)

    expect(screen.getByRole('button', { name: 'Top rated, next' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Top rated, previous' })).toBeEnabled()
  })
})
