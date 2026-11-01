import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-[8px] border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]',
        blue: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]',
        gold: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]',
        success: 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]',
        warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#B45309]',
        danger: 'border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]',
        neutral: 'border-[#D1D5DB] bg-[#F8FAFC] text-[#4B5563]',
        dark: 'border-[#171717] bg-[#171717] text-white',
        info: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]',
        outline: 'border-[#D1D5DB] bg-transparent text-[#4B5563]',
        accent: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E3A8A]',
        secondary: 'border-[#D1D5DB] bg-[#F8FAFC] text-[#4B5563]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
