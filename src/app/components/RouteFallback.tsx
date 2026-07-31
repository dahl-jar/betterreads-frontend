import { Skeleton } from '@/components/ui/skeleton'

export function RouteFallback() {
  return (
    <div className="flex min-h-screen flex-col">
      <main
        className="mx-auto w-full max-w-2xl flex-1 px-6 py-12"
        role="status"
        aria-label="Loading page"
        aria-busy="true"
      >
        <Skeleton className="h-8 w-40" />
      </main>
    </div>
  )
}
