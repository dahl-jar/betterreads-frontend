type Listener = (event: { data: string }) => void

export class FakeEventSource {
  static instances: FakeEventSource[] = []
  url: string
  listeners = new Map<string, Listener>()
  onerror: ((event: unknown) => void) | null = null
  closed = false

  constructor(url: string) {
    this.url = url
    FakeEventSource.instances.push(this)
  }

  addEventListener(type: string, listener: Listener) {
    this.listeners.set(type, listener)
  }

  emit(type: string, data: unknown) {
    this.listeners.get(type)?.({ data: JSON.stringify(data) })
  }

  close() {
    this.closed = true
  }
}

export class ThrowingEventSource {
  constructor() {
    throw new Error('connection failed')
  }
}
