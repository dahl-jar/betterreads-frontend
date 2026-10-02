type TabOption<T extends string> = {
  id: T
  label: string
}

type TabListProps<T extends string> = {
  tabs: readonly TabOption<T>[]
  activeTab: T
  ariaLabel: string
  onTabChange: (tab: T) => void
}

const ACTIVE_TAB_CLASS = 'border-fg text-fg'
const INACTIVE_TAB_CLASS = 'border-transparent text-fg-2 hover:text-fg'

export function TabList<T extends string>({
  tabs,
  activeTab,
  ariaLabel,
  onTabChange,
}: TabListProps<T>) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="flex gap-6 border-b border-rule">
      {tabs.map((entry) => {
        const active = activeTab === entry.id
        return (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onTabChange(entry.id)}
            className={`-mb-px border-b-2 px-1 pb-3 text-sm font-semibold transition-colors ${
              active ? ACTIVE_TAB_CLASS : INACTIVE_TAB_CLASS
            }`}
          >
            {entry.label}
          </button>
        )
      })}
    </div>
  )
}
