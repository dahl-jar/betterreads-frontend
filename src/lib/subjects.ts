/** Removes case-insensitive duplicate subjects, keeping the first spelling seen. */
export function uniqueSubjects(subjects: string[]): string[] {
  const seen = new Set<string>()
  return subjects.filter((subject) => {
    const key = subject.toLowerCase()
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
