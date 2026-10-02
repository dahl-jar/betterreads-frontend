import { useLocation } from 'react-router-dom'

export function CurrentLocation() {
  const { pathname, search } = useLocation()
  return (
    <p>
      {pathname}
      {search}
    </p>
  )
}
