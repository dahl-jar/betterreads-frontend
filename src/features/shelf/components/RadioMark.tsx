type RadioMarkProps = {
  selected: boolean
  tone: string
}

export function RadioMark({ selected, tone }: RadioMarkProps) {
  return (
    <span
      aria-hidden="true"
      className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? `border-current ${tone}` : 'border-fg-3'}`}
    >
      {selected ? <span className="size-2 rounded-full bg-current" /> : null}
    </span>
  )
}
