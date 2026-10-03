import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { loginState } from '@/lib/returnPath'

type LoginLinkProps = {
  className?: string
  children: ReactNode
}

export function LoginLink({ className, children }: LoginLinkProps) {
  const location = useLocation()
  return (
    <Link to="/login" state={loginState(location)} className={className}>
      {children}
    </Link>
  )
}
