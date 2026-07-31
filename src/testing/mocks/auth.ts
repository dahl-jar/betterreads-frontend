import auth from './auth.json'

function makeCurrentUser(overrides: Record<string, unknown> = {}) {
  return { ...auth.user, ...overrides }
}

export function makeAuthResponse(
  overrides: Record<string, unknown> = {},
  userOverrides: Record<string, unknown> = {},
) {
  return { ...auth, ...overrides, user: makeCurrentUser(userOverrides) }
}
