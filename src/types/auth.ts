export type CurrentUser = {
  username: string
  email: string
  emailVerified: boolean
  displayName?: string | null | undefined
  avatarUrl?: string | null | undefined
  bio?: string | null | undefined
}

export type RegisterInput = {
  username: string
  email: string
  password: string
}

export type LoginInput = {
  identifier: string
  password: string
}
