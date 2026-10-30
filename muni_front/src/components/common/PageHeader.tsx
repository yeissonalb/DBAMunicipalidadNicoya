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
    <div className="mb-6 flex flex-col justify-between gap-4 border-b border-[#DCE3DE] pb-4 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#164B35] text-[#B6944A] shadow-xs">
            {icon}
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-[#26352D] sm:text-2xl">{title}</h1>
            {badge && <Badge variant="gold">{badge}</Badge>}
          </div>
          {subtitle && <p className="mt-1 text-sm text-[#5A6B61]">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

