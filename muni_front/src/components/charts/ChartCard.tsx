import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
}

export function ChartCard({ title, subtitle, rightSlot, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>{title}</CardTitle>
          {subtitle && <CardDescription className="mt-1">{subtitle}</CardDescription>}
        </div>
        {rightSlot}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

