import { type RefObject, useEffect } from 'react'

export type DismissReason = 'outside' | 'escape'

const CLOSE_KEY = 'Escape'

export function useDismiss(
  ref: RefObject<HTMLElement | null>,
  open: boolean,
  onDismiss: (reason: DismissReason) => void,
) {
  useEffect(() => {
    if (!open) {
      return
    }
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onDismiss('outside')
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === CLOSE_KEY) {
        onDismiss('escape')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [ref, open, onDismiss])
}
