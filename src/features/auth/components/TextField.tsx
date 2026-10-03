import type { ComponentProps, ReactNode } from 'react'
import { useFormContext, type FieldPath, type FieldValues } from 'react-hook-form'

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type TextFieldProps<TFieldValues extends FieldValues> = {
  name: FieldPath<TFieldValues>
  label: string
  description?: string
  aside?: ReactNode
} & Omit<ComponentProps<typeof Input>, 'name'>

export function TextField<TFieldValues extends FieldValues>({
  name,
  label,
  description,
  aside,
  ...inputProps
}: TextFieldProps<TFieldValues>) {
  const { control } = useFormContext<TFieldValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-baseline justify-between gap-3">
            <FormLabel>{label}</FormLabel>
            {aside}
          </div>
          <FormControl>
            <Input {...inputProps} {...field} />
          </FormControl>
          {description ? <FormDescription>{description}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
