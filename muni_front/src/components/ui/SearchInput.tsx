import * as React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string;
  onChange: (value: string) => void;
  containerClassName?: string;
}

/**
 * Buscador estandarizado — SIGEMUN Nicoya
 * Altura 42px, bordes 10px (#D1D5DB), foco azul institucional (#1D4ED8)
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar registros...',
  className,
  containerClassName,
  ...props
}: SearchInputProps) {
  return (
    <div className={cn('relative w-full', containerClassName)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#6B7280]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'flex h-[42px] w-full rounded-[10px] border border-[#D1D5DB] bg-white pl-10 pr-9 text-sm text-[#171717] transition-colors placeholder:text-[#6B7280] hover:border-[#9CA3AF] focus:border-[#1D4ED8] focus:outline-none focus:ring-2 focus:ring-[#1D4ED8]/20',
          className
        )}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#171717]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

