import * as React from 'react';
import { Badge } from '@/components/ui/badge';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function PageHeader({ title, subtitle, badge, icon, actions }: PageHeaderProps) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-5 rounded-2xl border border-[#DCE3DE] bg-white p-5 shadow-card sm:flex-row sm:items-center sm:p-6">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#164B35] text-[#E2C982] shadow-sm">
            {icon}
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-extrabold tracking-tight text-[#23342B] sm:text-2xl lg:text-[1.75rem]">{title}</h1>
            {badge && <Badge variant="gold">{badge}</Badge>}
          </div>
          {subtitle && <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-[#607168]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

