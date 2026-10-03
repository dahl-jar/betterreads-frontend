export function holdResponse() {
  let release: () => void = () => undefined
  const held = new Promise<void>((resolve) => {
    release = resolve
  })
  return { held, release: () => release() }
}
