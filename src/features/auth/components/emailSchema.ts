import { z } from 'zod'

export const emailSchema = z
  .email('Enter a valid email with a domain, like name@example.com')
  .max(255, 'Email must be at most 255 characters')
