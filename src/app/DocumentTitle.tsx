import type { ReactNode } from 'react'

import { useDocumentTitle } from './useDocumentTitle'

type DocumentTitleProps = {
  pageTitle?: string | undefined
  children: ReactNode
}

export function DocumentTitle({ pageTitle, children }: DocumentTitleProps) {
  useDocumentTitle(pageTitle)
  return children
}
