import * as React from 'react';
import { cn } from '@/lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-11 w-full rounded-xl border border-sigemun-border bg-white px-3.5 py-2 text-sm text-sigemun-text shadow-sm placeholder:text-sigemun-muted hover:border-sigemun-border-strong focus-visible:border-sigemun-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigemun-medium/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
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
        'flex h-11 w-full rounded-xl border border-sigemun-border bg-white px-3.5 py-2 text-sm text-sigemun-text shadow-sm hover:border-sigemun-border-strong focus-visible:border-sigemun-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigemun-medium/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
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
          'flex min-h-[104px] w-full resize-y rounded-xl border border-sigemun-border bg-white px-3.5 py-3 text-sm text-sigemun-text shadow-sm placeholder:text-sigemun-muted hover:border-sigemun-border-strong focus-visible:border-sigemun-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sigemun-medium/20 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60',
          className
        )}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Input, Select, Textarea };

