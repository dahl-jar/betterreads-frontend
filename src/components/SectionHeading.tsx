type SectionHeadingProps = {
  title: string
  note: string
}

export function SectionHeading({ title, note }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
      <h2 className="font-title text-2xl text-fg">{title}</h2>
      <p className="label-caps">{note}</p>
    </div>
  )
}
