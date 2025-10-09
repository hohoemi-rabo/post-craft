import { TextareaHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  showCount?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, showCount, maxLength, value, ...props }, ref) => {
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between">
          {label && (
            <label className="block text-sm font-medium text-text-primary">
              {label}
            </label>
          )}
          {showCount && maxLength && (
            <span className="text-sm text-text-secondary">
              {currentLength} / {maxLength}
            </span>
          )}
        </div>
        <textarea
          ref={ref}
          maxLength={maxLength}
          value={value}
          className={cn(
            'flex min-h-[120px] w-full rounded-lg border border-border bg-white px-4 py-3 text-sm transition-colors',
            'placeholder:text-text-secondary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'resize-y',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-error">{error}</p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea
