const SHELF_CHANGED_EVENT = 'betterreads:shelf-changed'

export function notifyShelfChanged(): void {
  window.dispatchEvent(new Event(SHELF_CHANGED_EVENT))
}

export function subscribeToShelfChanges(listener: () => void): () => void {
  window.addEventListener(SHELF_CHANGED_EVENT, listener)
  return () => window.removeEventListener(SHELF_CHANGED_EVENT, listener)
}
