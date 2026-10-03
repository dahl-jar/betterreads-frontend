import { type ReactNode } from 'react'

import { resendVerification } from '../api/resendVerification'

import { EmailRequestForm } from './EmailRequestForm'

const RESEND_CONFIRMATION =
  'If that email needs verifying, a new link is on its way. Check your inbox.'

type ResendVerificationFormProps = {
  children: ReactNode
}

export function ResendVerificationForm({ children }: ResendVerificationFormProps) {
  return (
    <EmailRequestForm
      send={resendVerification}
      confirmation={RESEND_CONFIRMATION}
      submitLabel="Resend verification"
    >
      {children}
    </EmailRequestForm>
  )
}
