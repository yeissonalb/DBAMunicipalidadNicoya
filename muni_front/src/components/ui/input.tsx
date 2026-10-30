import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-lg border border-[#DCE3DE] bg-white px-3 py-2 text-sm text-[#26352D] placeholder:text-[#5A6B61]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#164B35] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        'flex h-10 w-full rounded-lg border border-[#DCE3DE] bg-white px-3 py-2 text-sm text-[#26352D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#164B35] disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
});
Select.displayName = 'Select';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          'flex min-h-[84px] w-full rounded-lg border border-[#DCE3DE] bg-white px-3 py-2 text-sm text-[#26352D] placeholder:text-[#5A6B61]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#164B35] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Select, Textarea };

