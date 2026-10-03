import { forgotPassword } from '../api/forgotPassword'

import { EmailRequestForm } from './EmailRequestForm'

const NEUTRAL_CONFIRMATION =
  'If that email has an account, a reset link is on its way. Check your inbox.'

export function ForgotPasswordForm() {
  return (
    <EmailRequestForm
      send={forgotPassword}
      confirmation={NEUTRAL_CONFIRMATION}
      submitLabel="Send reset link"
    />
  )
}
