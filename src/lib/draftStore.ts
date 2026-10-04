export type Draft = {
  readonly body: string
  readonly title?: string
  readonly savedAt: number
}

export function hasDraftText(draft: Draft | undefined): draft is Draft {
  return draft !== undefined && (draft.body.trim() !== '' || (draft.title ?? '').trim() !== '')
}

const DRAFT_PREFIX = 'betterreads:draft:'

const cache = new Map<string, Draft | undefined>()

const listeners = new Set<() => void>()

function storageKey(owner: string, key: string): string {
  return `${DRAFT_PREFIX}${owner}:${key}`
}

function isDraft(value: unknown): value is Draft {
  return (
    typeof value === 'object' &&
    value !== null &&
    'body' in value &&
    typeof value.body === 'string' &&
    'savedAt' in value &&
    typeof value.savedAt === 'number'
  )
}

function loadDraft(id: string): Draft | undefined {
  try {
    const raw = localStorage.getItem(id)
    const parsed: unknown = raw === null ? undefined : JSON.parse(raw)
    return isDraft(parsed) ? parsed : undefined
  } catch {
    return undefined
  }
}

function attemptStorage(write: () => void) {
  try {
    write()
  } catch {
    return
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

export function subscribeDrafts(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function readDraft(owner: string, key: string): Draft | undefined {
  const id = storageKey(owner, key)
  if (!cache.has(id)) {
    cache.set(id, loadDraft(id))
  }
  return cache.get(id)
}

export function writeDraft(owner: string, key: string, draft: Draft): void {
  const id = storageKey(owner, key)
  cache.set(id, draft)
  attemptStorage(() => localStorage.setItem(id, JSON.stringify(draft)))
  notify()
}

export function removeDraft(owner: string, key: string): void {
  const id = storageKey(owner, key)
  cache.set(id, undefined)
  attemptStorage(() => localStorage.removeItem(id))
  notify()
}

export function clearDrafts(): void {
  cache.clear()
  attemptStorage(() =>
    Object.keys(localStorage)
      .filter((id) => id.startsWith(DRAFT_PREFIX))
      .forEach((id) => localStorage.removeItem(id)),
  )
  notify()
}
