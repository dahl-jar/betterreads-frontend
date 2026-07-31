import { useState, type ReactNode } from 'react'
import type { FieldValues, SubmitHandler, UseFormReturn } from 'react-hook-form'

import { Form } from '@/components/ui/form'

type AuthFormProps<TValues extends FieldValues> = {
  form: UseFormReturn<TValues>
  onSubmit: SubmitHandler<TValues>
  errorMessage: string
  children: ReactNode
}

export function AuthForm<TValues extends FieldValues>({
  form,
  onSubmit,
  errorMessage,
  children,
}: AuthFormProps<TValues>) {
  const [submitError, setSubmitError] = useState(false)

  const handleSubmit: SubmitHandler<TValues> = async (values, event) => {
    setSubmitError(false)
    try {
      await onSubmit(values, event)
    } catch {
      setSubmitError(true)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={(event) => void form.handleSubmit(handleSubmit)(event)}
        className="space-y-5"
        noValidate
      >
        {submitError ? (
          <p role="alert" className="text-sm font-medium text-destructive">
            {errorMessage}
          </p>
        ) : null}
        {children}
      </form>
    </Form>
  )
}
