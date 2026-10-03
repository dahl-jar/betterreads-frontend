import type { ComponentType } from 'react'

type ViewOption<T extends string> = {
  view: T
  label: string
  Icon?: ComponentType<{ className?: string }>
}

type ViewToggleProps<T extends string> = {
  options: readonly ViewOption<T>[]
  view: T
  onView: (view: T) => void
  className?: string
}

export function ViewToggle<T extends string>({
  options,
  view,
  onView,
  className = '',
}: ViewToggleProps<T>) {
  return (
    <div
      className={`flex divide-x divide-rule overflow-hidden rounded-md border border-rule ${className}`}
    >
      {options.map(({ view: option, label, Icon }) => (
        <button
          key={option}
          type="button"
          onClick={() => onView(option)}
          aria-pressed={view === option}
          aria-label={Icon ? label : undefined}
          className={`${Icon ? 'flex size-9 items-center justify-center' : 'px-3 py-1 text-sm font-semibold'} ${view === option ? 'bg-sunken text-fg' : 'text-fg-3 hover:text-fg'}`}
        >
          {Icon ? <Icon className="size-4" /> : label}
        </button>
      ))}
    </div>
  )
}
