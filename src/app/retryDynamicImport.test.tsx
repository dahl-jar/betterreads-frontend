import { afterEach, describe, expect, it, vi } from 'vitest'

import { retryDynamicImport } from './retryDynamicImport'

const RELOAD_GUARD_KEY = 'betterreads:chunk-reload'

const route = { SearchRoute: () => null }

afterEach(() => {
  sessionStorage.clear()
})

function chunkError(): Error {
  return new TypeError('Failed to fetch dynamically imported module: /assets/SearchRoute-abc.js')
}

describe('retryDynamicImport', () => {
  it('should resolve to the imported module', async () => {
    const load = vi.fn().mockResolvedValue(route)

    const result = await retryDynamicImport(load)

    expect(result).toBe(route)
  })

  it('should retry a failed chunk import', async () => {
    const load = vi.fn().mockRejectedValueOnce(chunkError()).mockResolvedValueOnce(route)

    const result = await retryDynamicImport(load)

    expect(result).toBe(route)
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('should reload after chunk retries fail', async () => {
    const load = vi.fn().mockRejectedValue(chunkError())
    const reload = vi.fn()

    await expect(retryDynamicImport(load, reload)).rejects.toThrow()

    expect(reload).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBe('1')
  })

  it('should reload once per session', async () => {
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
    const load = vi.fn().mockRejectedValue(chunkError())
    const reload = vi.fn()

    await expect(retryDynamicImport(load, reload)).rejects.toThrow()

    expect(reload).not.toHaveBeenCalled()
  })

  it('should propagate module errors', async () => {
    const moduleBug = new Error('Cannot read properties of undefined')
    const load = vi.fn().mockRejectedValue(moduleBug)
    const reload = vi.fn()

    await expect(retryDynamicImport(load, reload)).rejects.toThrow(moduleBug)

    expect(reload).not.toHaveBeenCalled()
  })

  it('should clear the reload guard once an import succeeds again', async () => {
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1')
    const load = vi.fn().mockResolvedValue(route)

    await retryDynamicImport(load)

    expect(sessionStorage.getItem(RELOAD_GUARD_KEY)).toBeNull()
  })
})
