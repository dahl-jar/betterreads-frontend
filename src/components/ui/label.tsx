import { Root as LabelRoot } from '@radix-ui/react-label'
import type * as React from 'react'

import { cn } from '@/lib/utils'

function Label({ className, ...props }: React.ComponentProps<typeof LabelRoot>) {
  return (
    <LabelRoot
      className={cn(
        'text-sm font-semibold leading-none text-fg peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className,
      )}
      {...props}
    />
  )
}

export { Label }
