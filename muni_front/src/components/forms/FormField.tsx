import * as React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Contenedor de campo de formulario estandarizado — SIGEMUN Nicoya
 * - Etiquetas en gris oscuro (#171717)
 * - Mensajes de error en Rojo Institucional (#DC2626)
 */
export function FormField({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-semibold text-[#171717]">
        {label}
        {required && <span className="ml-0.5 text-[#DC2626]">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] leading-relaxed text-[#6B7280]">{hint}</p>}
      {error && <p className="text-xs font-medium text-[#DC2626]">{error}</p>}
    </div>
  );
}
