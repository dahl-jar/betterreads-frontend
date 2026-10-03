type RatingErrorProps = {
  error: string | undefined
}

export function RatingError({ error }: RatingErrorProps) {
  if (!error) {
    return null
  }
  return (
    <p role="alert" className="mt-2 text-sm text-destructive">
      {error}
    </p>
  )
}
