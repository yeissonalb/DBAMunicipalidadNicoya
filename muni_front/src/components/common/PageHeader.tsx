import * as React from 'react';
import { Badge } from '@/components/ui/Badge';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

/**
 * Encabezado de página estandarizado — SIGEMUN Nicoya
 * - Títulos en negro institucional (#171717) y subtítulos con jerarquía uniforme (#4B5563)
 * - Iconografía en azul institucional (#1E3A8A / #EFF6FF)
 */
export function PageHeader({ title, subtitle, badge, icon, actions }: PageHeaderProps) {
  return (
    <header className="rounded-[12px] border border-[#E5E7EB] bg-white p-6 shadow-card">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] border border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-bold tracking-tight text-[#171717] sm:text-2xl">
                {title}
              </h1>
              {badge && <Badge variant="blue">{badge}</Badge>}
            </div>
            {subtitle && (
              <p className="mt-1 max-w-3xl text-sm leading-relaxed text-[#4B5563]">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
      </div>
    </header>
  );
}
