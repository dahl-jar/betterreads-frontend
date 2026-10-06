import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { type AuthorPage } from '@/features/author/api/getAuthor'
import { AuthorDetail } from '@/features/author/components/AuthorDetail'
import { useAuthor, type AuthorStatus } from '@/features/author/hooks/useAuthor'
import { authorPath } from '@/lib/authorPath'

import { useDocumentTitle } from '../useDocumentTitle'

import { NotFoundRoute } from './NotFoundRoute'

function authorTitle(status: AuthorStatus, name: string | undefined): string {
  if (name !== undefined) {
    return name
  }
  return status === 'notFound' ? 'Author not found' : 'Author'
}

function useSurvivorRedirect(authorId: number, author: AuthorPage | undefined) {
  const navigate = useNavigate()
  const survivorId =
    author !== undefined && author.authorId !== authorId ? author.authorId : undefined
  useEffect(() => {
    if (survivorId !== undefined) {
      void navigate(authorPath(survivorId), { replace: true })
    }
  }, [survivorId, navigate])
}

export function AuthorRoute() {
  const { id = '' } = useParams<{ id: string }>()
  const authorId = Number(id)
  const { status, author } = useAuthor(authorId)
  useDocumentTitle(authorTitle(status, author?.name))
  useSurvivorRedirect(authorId, author)

  if (status === 'notFound') {
    return <NotFoundRoute subject="author" />
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 md:py-12">
      {status === 'loading' ? (
        <p role="status" className="text-fg-2">
          Loading author
        </p>
      ) : null}
      {status === 'error' ? (
        <p role="alert" className="text-fg-2">
          Something went wrong loading this author. Try again in a moment.
        </p>
      ) : null}
      {status === 'success' && author ? <AuthorDetail author={author} /> : null}
    </main>
  )
}
