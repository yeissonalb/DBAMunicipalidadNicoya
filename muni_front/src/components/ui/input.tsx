import * as React from 'react';
import { cn } from '@/lib/utils';
import { Select } from './Select';
import { Calendar } from './Calendar';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

/**
 * Estándar de Inputs — Sistema de Gestión Municipal de Nicoya (SIGEMUN)
 * - Altura obligatoria: 42px (h-[42px])
 * - Bordes redondeados: 10px (rounded-[10px])
 * - Color del borde: Gris #D1D5DB
 * - Fondo: Blanco #FFFFFF
 * - Texto: Gris oscuro #171717
 * - Focus: Azul institucional (#1D4ED8)
 * - Si se invoca con `type="date"`, delega automáticamente al componente único `Calendar` (formato dd/MM/yyyy)
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, value, defaultValue, onChange, name, id, disabled, placeholder, ...props }, ref) => {
    if (type === 'date') {
      return (
        <Calendar
          ref={ref}
          id={id}
          name={name}
          disabled={disabled}
          value={value !== undefined ? String(value) : undefined}
          defaultValue={defaultValue !== undefined ? String(defaultValue) : undefined}
          onChange={(isoDate) => {
            if (onChange) {
              const syntheticEvent = {
                target: { value: isoDate, name: name ?? '' },
                currentTarget: { value: isoDate, name: name ?? '' },
              } as React.ChangeEvent<HTMLInputElement>;
              onChange(syntheticEvent);
            }
          }}
          placeholder={placeholder}
          className={className}
          {...props}
        />
      );
    }

    return (
      <input
        type={type}
        id={id}
        name={name}
        disabled={disabled}
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        placeholder={placeholder}
        className={cn(
          'flex h-[42px] w-full rounded-[10px] border bg-white px-3.5 py-2 text-sm text-[#171717] transition-colors placeholder:text-[#6B7280] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]',
          error
            ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
            : 'border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[96px] w-full rounded-[10px] border bg-white px-3.5 py-2.5 text-sm text-[#171717] transition-colors placeholder:text-[#6B7280] focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF]',
          error
            ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
            : 'border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export { Select };
