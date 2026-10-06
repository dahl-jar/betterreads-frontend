import { lazy, Suspense, type ComponentType, type ReactElement } from 'react'
import { createBrowserRouter, Outlet, type RouteObject } from 'react-router-dom'

import { SHELF_PATH } from '@/lib/shelfPath'

import { AppLayout } from './components/AppLayout'
import { RouteErrorBoundary } from './components/RouteErrorBoundary'
import { RouteFallback } from './components/RouteFallback'
import { DocumentTitle } from './DocumentTitle'
import { retryDynamicImport } from './retryDynamicImport'
import { HomeRoute } from './routes/HomeRoute'
import { NotFoundRoute } from './routes/NotFoundRoute'

function lazyElement(
  load: () => Promise<Record<string, ComponentType>>,
  name: string,
  pageTitle: string,
): ReactElement {
  const Component = lazy(() =>
    retryDynamicImport(load).then((module) => ({ default: module[name]! })),
  )
  return (
    <DocumentTitle pageTitle={pageTitle}>
      <Component />
    </DocumentTitle>
  )
}

export const routes: RouteObject[] = [
  {
    errorElement: <RouteErrorBoundary />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: (
              <DocumentTitle>
                <HomeRoute />
              </DocumentTitle>
            ),
          },
          {
            path: '/search',
            element: lazyElement(() => import('./routes/SearchRoute'), 'SearchRoute', 'Search'),
          },
          {
            path: '/books/:key',
            element: lazyElement(() => import('./routes/BookRoute'), 'BookRoute', 'Book'),
          },
          {
            path: '/authors/:id',
            element: lazyElement(() => import('./routes/AuthorRoute'), 'AuthorRoute', 'Author'),
          },
          {
            path: '/profile',
            element: lazyElement(() => import('./routes/ProfileRoute'), 'ProfileRoute', 'Profile'),
          },
          {
            path: '/settings',
            element: lazyElement(
              () => import('./routes/SettingsRoute'),
              'SettingsRoute',
              'Settings',
            ),
          },
          {
            path: SHELF_PATH,
            element: lazyElement(() => import('./routes/ShelfRoute'), 'ShelfRoute', 'My books'),
          },
          {
            path: '/about',
            element: lazyElement(() => import('./routes/AboutRoute'), 'AboutRoute', 'About'),
          },
          {
            path: '/help',
            element: lazyElement(() => import('./routes/HelpRoute'), 'HelpRoute', 'Help'),
          },
          {
            path: '/privacy',
            element: lazyElement(() => import('./routes/PrivacyRoute'), 'PrivacyRoute', 'Privacy'),
          },
          {
            path: '/cookies',
            element: lazyElement(() => import('./routes/CookiesRoute'), 'CookiesRoute', 'Cookies'),
          },
          {
            path: '/terms',
            element: lazyElement(() => import('./routes/TermsRoute'), 'TermsRoute', 'Terms'),
          },
          { path: '*', element: <NotFoundRoute /> },
        ],
      },
      {
        element: (
          <Suspense fallback={<RouteFallback />}>
            <Outlet />
          </Suspense>
        ),
        children: [
          {
            path: '/login',
            element: lazyElement(() => import('./routes/LoginRoute'), 'LoginRoute', 'Log in'),
          },
          {
            path: '/register',
            element: lazyElement(
              () => import('./routes/RegisterRoute'),
              'RegisterRoute',
              'Create account',
            ),
          },
          {
            path: '/forgot-password',
            element: lazyElement(
              () => import('./routes/ForgotPasswordRoute'),
              'ForgotPasswordRoute',
              'Forgot password',
            ),
          },
          {
            path: '/reset-password',
            element: lazyElement(
              () => import('./routes/ResetPasswordRoute'),
              'ResetPasswordRoute',
              'Reset password',
            ),
          },
          {
            path: '/verify-email',
            element: lazyElement(
              () => import('./routes/VerifyEmailRoute'),
              'VerifyEmailRoute',
              'Verify email',
            ),
          },
        ],
      },
    ],
  },
]

export const router = createBrowserRouter(routes)
