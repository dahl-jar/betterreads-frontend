type GenreBadgeProps = {
  label: string
}

export function GenreBadge({ label }: GenreBadgeProps) {
  return (
    <span className="rounded-full bg-sunken px-2.5 py-0.5 text-xs text-fg-2">
      {label.charAt(0).toUpperCase() + label.slice(1)}
    </span>
  )
}
