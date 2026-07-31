import { useEffect } from 'react'

const APP_NAME = 'BetterReads'

export function useDocumentTitle(pageTitle?: string) {
  useEffect(() => {
    document.title = pageTitle ? `${pageTitle} | ${APP_NAME}` : APP_NAME
  }, [pageTitle])
}
