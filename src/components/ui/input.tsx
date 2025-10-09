import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="mb-2 block text-sm font-medium text-text-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          className={cn(
            'flex h-11 w-full rounded-lg border border-border bg-white px-4 py-2 text-sm transition-colors',
            'placeholder:text-text-secondary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-error focus-visible:ring-error',
            'min-h-[44px]', // タッチターゲット44px以上
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

Input.displayName = 'Input'

export default Input
