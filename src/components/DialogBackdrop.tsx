export function DialogBackdrop({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      tabIndex={-1}
      aria-hidden="true"
      onClick={onClick}
      className="absolute inset-0 cursor-default bg-black/55"
    />
  )
}
