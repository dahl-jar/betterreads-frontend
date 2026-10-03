import { describe, expect, it } from 'vitest'

import { passwordSchema } from '../components/passwordSchema'

const LONGEST_PASSWORD = 72

describe('passwordSchema', () => {
  it('should accept a password of 72 characters', () => {
    expect(passwordSchema.safeParse('x'.repeat(LONGEST_PASSWORD)).success).toBe(true)
  })

  it('should reject a password over 72 characters', () => {
    expect(passwordSchema.safeParse('x'.repeat(LONGEST_PASSWORD + 1)).success).toBe(false)
  })
})
