import * as React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

const DAYS_ES = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

function parseIsoDate(iso?: string): Date | null {
  if (!iso || typeof iso !== 'string') return null;
  const trimmed = iso.trim();
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(trimmed);
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const date = new Date(y, mo, d);
    if (!Number.isNaN(date.getTime())) return date;
  }
  const d2 = new Date(trimmed);
  return Number.isNaN(d2.getTime()) ? null : d2;
}

function toIsoDateString(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function toCostaRicaDisplay(d: Date | null): string {
  if (!d) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

export interface CalendarProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  onChange?: (isoDate: string) => void;
  minDate?: string;
  maxDate?: string;
  clearable?: boolean;
}

/**
 * Único componente de Calendario compartido en todo el sistema — SIGEMUN Nicoya
 * - Fechas seleccionadas con fondo negro (#171717) y texto blanco (#FFFFFF)
 * - Fechas deshabilitadas en gris (#9CA3AF)
 * - Bordes redondeados de 10px (rounded-[10px]) y altura de 42px (h-[42px])
 * - Formato costarricense obligatorio en interfaz: dd/MM/yyyy
 */
export const Calendar = React.forwardRef<HTMLInputElement, CalendarProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      minDate,
      maxDate,
      placeholder = 'dd/MM/yyyy',
      disabled,
      clearable = true,
      className,
      name,
      id,
      onBlur,
      ...rest
    },
    forwardedRef
  ) => {
    const hiddenInputRef = React.useRef<HTMLInputElement | null>(null);
    const containerRef = React.useRef<HTMLDivElement | null>(null);

    const [isoValue, setIsoValue] = React.useState<string>(() => {
      if (value !== undefined) return value;
      if (defaultValue !== undefined) return defaultValue;
      return '';
    });

    const selectedDate = React.useMemo(() => parseIsoDate(isoValue), [isoValue]);
    const minDateObj = React.useMemo(() => parseIsoDate(minDate), [minDate]);
    const maxDateObj = React.useMemo(() => parseIsoDate(maxDate), [maxDate]);

    const [viewYear, setViewYear] = React.useState<number>(
      () => (selectedDate ?? new Date()).getFullYear()
    );
    const [viewMonth, setViewMonth] = React.useState<number>(
      () => (selectedDate ?? new Date()).getMonth()
    );
    const [open, setOpen] = React.useState(false);

    React.useEffect(() => {
      if (value !== undefined) {
        setIsoValue(value);
        const parsed = parseIsoDate(value);
        if (parsed) {
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      }
    }, [value]);

    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        hiddenInputRef.current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          (forwardedRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
        }
        if (node && value === undefined && node.value && !isoValue) {
          setIsoValue(node.value);
        }
      },
      [forwardedRef, value, isoValue]
    );

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

    const emitChange = (nextIso: string) => {
      setIsoValue(nextIso);
      if (hiddenInputRef.current) {
        const setter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype,
          'value'
        )?.set;
        setter?.call(hiddenInputRef.current, nextIso);
        const ev = new Event('input', { bubbles: true });
        hiddenInputRef.current.dispatchEvent(ev);
      }
      onChange?.(nextIso);
    };

    // Construcción de la cuadrícula mensual (lunes a domingo)
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDayJs = new Date(viewYear, viewMonth, 1).getDay(); // 0=Dom .. 6=Sab
    const leadingBlanks = (firstDayJs + 6) % 7; // Lunes = 0

    const isDateDisabled = (d: Date): boolean => {
      if (minDateObj && d < new Date(minDateObj.getFullYear(), minDateObj.getMonth(), minDateObj.getDate())) {
        return true;
      }
      if (maxDateObj && d > new Date(maxDateObj.getFullYear(), maxDateObj.getMonth(), maxDateObj.getDate())) {
        return true;
      }
      return false;
    };

    const yearsRange = React.useMemo(() => {
      const currentY = new Date().getFullYear();
      const arr: number[] = [];
      for (let y = currentY + 10; y >= 1930; y--) {
        arr.push(y);
      }
      return arr;
    }, []);

    const prevMonth = () => {
      if (viewMonth === 0) {
        setViewMonth(11);
        setViewYear((y) => y - 1);
      } else {
        setViewMonth((m) => m - 1);
      }
    };

    const nextMonth = () => {
      if (viewMonth === 11) {
        setViewMonth(0);
        setViewYear((y) => y + 1);
      } else {
        setViewMonth((m) => m + 1);
      }
    };

    const displayFormatted = toCostaRicaDisplay(selectedDate);

    return (
      <div ref={containerRef} className={cn('relative w-full', className)}>
        {/* Input oculto para react-hook-form */}
        <input
          ref={setRefs}
          type="hidden"
          id={id}
          name={name}
          value={isoValue}
          onBlur={onBlur}
          {...rest}
        />

        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              setOpen((prev) => !prev);
            }
          }}
          className={cn(
            'flex h-[42px] w-full items-center justify-between gap-2 rounded-[10px] border bg-white px-3.5 text-sm transition-colors select-none',
            open
              ? 'border-[#1D4ED8] ring-2 ring-[#1D4ED8]/20'
              : 'border-[#D1D5DB] hover:border-[#9CA3AF] focus-visible:border-[#1D4ED8] focus-visible:ring-2 focus-visible:ring-[#1D4ED8]/20',
            disabled
              ? 'cursor-not-allowed bg-[#F3F4F6] text-[#9CA3AF]'
              : 'cursor-pointer text-[#171717]'
          )}
        >
          <span className={cn('truncate font-medium', !displayFormatted && 'text-[#6B7280] font-normal')}>
            {displayFormatted || placeholder}
          </span>
          <div className="flex items-center gap-1">
            {clearable && displayFormatted && !disabled && (
              <span
                role="button"
                tabIndex={-1}
                title="Limpiar fecha"
                onClick={(e) => {
                  e.stopPropagation();
                  emitChange('');
                }}
                className="rounded p-0.5 text-[#6B7280] hover:bg-[#F3F4F6] hover:text-[#171717]"
              >
                <X className="h-3.5 w-3.5" />
              </span>
            )}
            <CalendarIcon className="h-4 w-4 shrink-0 text-[#4B5563]" />
          </div>
        </div>

        {open && (
          <div className="absolute left-0 z-50 mt-1.5 w-[292px] rounded-[10px] border border-[#D1D5DB] bg-white p-3.5 shadow-elevated">
            {/* Encabezado mes / año */}
            <div className="mb-3 flex items-center justify-between gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#D1D5DB] bg-white text-[#171717] hover:bg-[#F9FAFB]"
                aria-label="Mes anterior"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              <div className="flex items-center gap-1">
                <select
                  value={viewMonth}
                  onChange={(e) => setViewMonth(Number(e.target.value))}
                  className="rounded-[8px] border border-[#D1D5DB] bg-white px-2 py-1 text-xs font-semibold text-[#171717] focus:border-[#1D4ED8] focus:outline-none"
                >
                  {MONTHS_ES.map((m, idx) => (
                    <option key={m} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>
                <select
                  value={viewYear}
                  onChange={(e) => setViewYear(Number(e.target.value))}
                  className="rounded-[8px] border border-[#D1D5DB] bg-white px-2 py-1 text-xs font-semibold text-[#171717] focus:border-[#1D4ED8] focus:outline-none"
                >
                  {yearsRange.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={nextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-[8px] border border-[#D1D5DB] bg-white text-[#171717] hover:bg-[#F9FAFB]"
                aria-label="Mes siguiente"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Cabecera días de la semana */}
            <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold uppercase text-[#6B7280]">
              {DAYS_ES.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Días del mes */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {Array.from({ length: leadingBlanks }).map((_, idx) => (
                <div key={`blank-${idx}`} className="h-8" />
              ))}

              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNumber = idx + 1;
                const cellDate = new Date(viewYear, viewMonth, dayNumber);
                const cellIso = toIsoDateString(cellDate);
                const isSelected = isoValue === cellIso;
                const isDisabled = isDateDisabled(cellDate);
                const isToday = toIsoDateString(new Date()) === cellIso;

                return (
                  <button
                    key={cellIso}
                    type="button"
                    disabled={isDisabled}
                    onClick={() => {
                      emitChange(cellIso);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex h-8 w-full items-center justify-center rounded-[8px] font-medium transition-colors',
                      isDisabled
                        ? 'cursor-not-allowed text-[#9CA3AF] opacity-50'
                        : isSelected
                        ? 'bg-[#171717] font-bold text-white shadow-xs'
                        : isToday
                        ? 'border border-[#1D4ED8] bg-[#EFF6FF] font-semibold text-[#1E3A8A]'
                        : 'text-[#171717] hover:bg-[#F3F4F6]'
                    )}
                  >
                    {dayNumber}
                  </button>
                );
              })}
            </div>

            {/* Pie del calendario: formato dd/MM/yyyy y atajo Hoy */}
            <div className="mt-3 flex items-center justify-between border-t border-[#E5E7EB] pt-2.5 text-xs">
              <span className="font-mono text-[11px] text-[#6B7280]">
                Formato: dd/MM/yyyy
              </span>
              <button
                type="button"
                onClick={() => {
                  const todayIso = toIsoDateString(new Date());
                  emitChange(todayIso);
                  setOpen(false);
                }}
                className="font-semibold text-[#1D4ED8] hover:underline"
              >
                Hoy ({toCostaRicaDisplay(new Date())})
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);
Calendar.displayName = 'Calendar';

