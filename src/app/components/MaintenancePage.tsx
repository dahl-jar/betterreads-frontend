import { Button } from '@/components/ui/button'

type MaintenancePageProps = {
  onRetry: () => void
}

export function MaintenancePage({ onRetry }: MaintenancePageProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 py-20 text-center">
      <h1 className="font-display text-2xl font-semibold text-ink">
        BetterReads is temporarily unavailable
      </h1>
      <p className="max-w-md text-ink-soft">
        We cannot reach the server right now. The catalog and your shelves are safe. Please try
        again shortly.
      </p>
      <Button type="button" onClick={onRetry}>
        Try again
      </Button>
    </div>
  )
}
