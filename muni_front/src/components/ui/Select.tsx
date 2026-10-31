import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOptionItem {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOptionItem[];
  placeholder?: string;
  error?: boolean;
}

/**
 * Componente Select estandarizado — SIGEMUN Nicoya
 * - Altura: 42px (h-[42px])
 * - Bordes: 10px (rounded-[10px]), color #D1D5DB
 * - Fondo: Blanco (#FFFFFF), Texto: #171717
 * - Focus: Azul institucional (#1D4ED8)
 * - Desplegable personalizado con la paleta institucional (sin menús nativos dispares)
 * - Totalmente compatible con `<option>` hijos y `react-hook-form` (`register`)
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, options, placeholder, error, disabled, value, defaultValue, onChange, onBlur, name, id, ...props }, forwardedRef) => {
    const internalSelectRef = React.useRef<HTMLSelectElement | null>(null);
    const containerRef = React.useRef<HTMLDivElement | null>(null);
    const [open, setOpen] = React.useState(false);

    // Extraer opciones desde `options` prop o desde los `<option>` hijos
    const parsedOptions = React.useMemo<SelectOptionItem[]>(() => {
      if (options && options.length > 0) return options;
      const list: SelectOptionItem[] = [];
      const extract = (nodes: React.ReactNode) => {
        React.Children.forEach(nodes, (child) => {
          if (!React.isValidElement(child)) return;
          if (child.type === React.Fragment) {
            extract((child.props as { children?: React.ReactNode }).children);
          } else if (child.type === 'option') {
            const cProps = child.props as React.OptionHTMLAttributes<HTMLOptionElement>;
            const val = cProps.value !== undefined ? String(cProps.value) : String(cProps.children ?? '');
            const lbl =
              typeof cProps.children === 'string' || typeof cProps.children === 'number'
                ? String(cProps.children)
                : Array.isArray(cProps.children)
                ? cProps.children.map((x) => (x ?? '')).join('')
                : val;
            list.push({
              value: val,
              label: lbl.trim(),
              disabled: Boolean(cProps.disabled),
            });
          }
        });
      };
      extract(children);
      return list;
    }, [options, children]);

    const [selectedValue, setSelectedValue] = React.useState<string>(() => {
      if (value !== undefined && value !== null) return String(value);
      if (defaultValue !== undefined && defaultValue !== null) return String(defaultValue);
      return parsedOptions[0] ? String(parsedOptions[0].value) : '';
    });

    // Sincronizar cuando `value` controlado cambia o cuando las opciones asíncronas cargan
    React.useEffect(() => {
      if (value !== undefined && value !== null) {
        setSelectedValue(String(value));
      } else if (internalSelectRef.current && internalSelectRef.current.value !== undefined) {
        setSelectedValue(internalSelectRef.current.value);
      }
    }, [value, parsedOptions.length]);

    // Combinar ref externo (react-hook-form) con ref interno
    const setRefs = React.useCallback(
      (node: HTMLSelectElement | null) => {
        internalSelectRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLSelectElement | null>).current = node;
        }
        if (node && value === undefined && node.value) {
          setSelectedValue(node.value);
        }
      },
      [forwardedRef, value]
    );

    // Cerrar al hacer clic fuera
    React.useEffect(() => {
      if (!open) return;
      const handleOutside = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener('mousedown', handleOutside);
      return () => document.removeEventListener('mousedown', handleOutside);
    }, [open]);

    const currentOption = parsedOptions.find((o) => String(o.value) === String(selectedValue));
    const displayLabel =
      currentOption?.label ??
      placeholder ??
      (parsedOptions[0]?.label || 'Seleccionar...');

    const handleSelectOption = (optValue: string) => {
      if (disabled) return;
      setSelectedValue(optValue);
      setOpen(false);

      if (internalSelectRef.current) {
        const nativeSelectValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLSelectElement.prototype,
          'value'
        )?.set;
        nativeSelectValueSetter?.call(internalSelectRef.current, optValue);
        const ev = new Event('change', { bubbles: true });
        internalSelectRef.current.dispatchEvent(ev);
      }
    };

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        {/* Select nativo oculto sincronizado para react-hook-form y accesibilidad */}
        <select
          ref={setRefs}
          id={id}
          name={name}
          disabled={disabled}
          value={value !== undefined ? value : selectedValue}
          onChange={(e) => {
            setSelectedValue(e.target.value);
            onChange?.(e);
          }}
          onBlur={onBlur}
          tabIndex={-1}
          aria-hidden="true"
          className="sr-only pointer-events-none"
          {...props}
        >
          {options
            ? options.map((o) => (
                <option key={String(o.value)} value={o.value} disabled={o.disabled}>
                  {o.label}
                </option>
              ))
            : children}
        </select>

        {/* Botón disparador con medidas y colores exactos no negociables */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            'flex h-[42px] w-full items-center justify-between gap-2 rounded-[10px] border bg-white px-3.5 text-left text-sm font-medium text-[#171717] transition-colors focus:outline-none focus:ring-2',
            error
              ? 'border-[#DC2626] focus:border-[#DC2626] focus:ring-[#DC2626]/20'
              : open
              ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20'
              : 'border-[#D1D5DB] hover:border-[#9CA3AF] focus:border-[#1D4ED8] focus:ring-[#1D4ED8]/20',
            disabled && 'cursor-not-allowed bg-[#F3F4F6] text-[#9CA3AF] opacity-70'
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-[#4B5563] transition-transform duration-150',
              open && 'rotate-180 text-[#1D4ED8]'
            )}
          />
        </button>

        {/* Lista desplegable unificada */}
        {open && parsedOptions.length > 0 && (
          <div
            role="listbox"
            className="absolute left-0 z-50 mt-1.5 max-h-64 w-full min-w-[180px] overflow-y-auto rounded-[10px] border border-[#D1D5DB] bg-white p-1 shadow-elevated"
          >
            {parsedOptions.map((opt) => {
              const isSelected = String(opt.value) === String(selectedValue);
              return (
                <button
                  key={String(opt.value)}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={opt.disabled}
                  onClick={() => handleSelectOption(String(opt.value))}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-[8px] px-3 py-2 text-left text-sm transition-colors',
                    opt.disabled
                      ? 'cursor-not-allowed text-[#9CA3AF]'
                      : isSelected
                      ? 'bg-[#EFF6FF] font-semibold text-[#1E3A8A]'
                      : 'text-[#171717] hover:bg-[#F8FAFC]'
                  )}
                >
                  <span className="truncate">{opt.label}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-[#1D4ED8]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);
Select.displayName = 'Select';

