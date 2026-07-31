import { apiCheck } from './client'

const HEALTH_CHECK_TIMEOUT_MS = 5_000

export async function checkBackendHealth(signal?: AbortSignal): Promise<boolean> {
  const timeoutSignal = AbortSignal.timeout(HEALTH_CHECK_TIMEOUT_MS)
  const requestSignal =
    signal === undefined ? timeoutSignal : AbortSignal.any([signal, timeoutSignal])

  try {
    await apiCheck('/healthz', { signal: requestSignal })
    return true
  } catch {
    return false
  }
}
