type TabAccent = 'green' | 'rust'

type TabOption<T extends string> = {
  id: T
  label: string
}

type TabListProps<T extends string> = {
  tabs: readonly TabOption<T>[]
  activeTab: T
  ariaLabel: string
  accent?: TabAccent
  uppercase?: boolean
  onTabChange: (tab: T) => void
}

const TAB_ACCENT_CLASS: Record<TabAccent, { active: string; inactive: string }> = {
  green: {
    active: 'border-green text-green-deep',
    inactive: 'border-transparent text-ink-soft hover:border-line hover:text-ink',
  },
  rust: {
    active: 'border-rust text-ink',
    inactive: 'border-transparent text-ink-soft hover:text-ink',
  },
}

export function TabList<T extends string>({
  tabs,
  activeTab,
  ariaLabel,
  accent = 'green',
  uppercase = false,
  onTabChange,
}: TabListProps<T>) {
  const accentClass = TAB_ACCENT_CLASS[accent]
  const labelClass = uppercase ? 'uppercase tracking-wide' : ''

  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-6 border-b border-line">
      {tabs.map((entry) => {
        const active = activeTab === entry.id
        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(entry.id)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${labelClass} ${
              active ? accentClass.active : accentClass.inactive
            }`}
          >
            {entry.label}
          </button>
        )
      })}
    </div>
  )
}
