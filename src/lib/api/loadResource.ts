import { ApiError } from './client'

const NOT_FOUND = 404

type LoadHandlers<T> = {
  onLoaded: (value: T) => void
  onNotFound: () => void
  onFailed: () => void
}

export function loadResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  { onLoaded, onNotFound, onFailed }: LoadHandlers<T>,
): () => void {
  const controller = new AbortController()
  load(controller.signal)
    .then(onLoaded)
    .catch((error: unknown) => {
      if (controller.signal.aborted) {
        return
      }
      if (error instanceof ApiError && error.status === NOT_FOUND) {
        onNotFound()
      } else {
        onFailed()
      }
    })
  return () => controller.abort()
}
