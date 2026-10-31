import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Estándar único de botones — Sistema de Gestión Municipal de Nicoya (SIGEMUN)
 * - Altura estándar obligatoria: 42px (h-[42px])
 * - Bordes redondeados obligatorios: 10px (rounded-[10px])
 * - Primario: Fondo negro (#171717) y texto blanco (#FFFFFF)
 * - Secundario: Fondo blanco (#FFFFFF) con borde gris (#D1D5DB) y texto (#171717)
 * - Destructivo: Fondo rojo institucional (#DC2626) y texto blanco (#FFFFFF)
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] h-[42px] px-4 text-sm font-semibold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none',
  {
    variants: {
      variant: {
        default: 'bg-[#171717] text-white border border-[#171717] hover:bg-[#262626]',
        primary: 'bg-[#171717] text-white border border-[#171717] hover:bg-[#262626]',
        secondary:
          'bg-white text-[#171717] border border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#9CA3AF]',
        outline:
          'bg-white text-[#171717] border border-[#D1D5DB] hover:bg-[#F9FAFB] hover:border-[#9CA3AF]',
        destructive:
          'bg-[#DC2626] text-white border border-[#DC2626] hover:bg-[#B91C1C]',
        ghost:
          'bg-transparent text-[#171717] border border-transparent hover:bg-[#F3F4F6]',
        /* Alias de compatibilidad hacia el estándar primario negro */
        gold: 'bg-[#171717] text-white border border-[#171717] hover:bg-[#262626]',
      },
      size: {
        default: 'h-[42px] px-4 text-sm',
        sm: 'h-[42px] px-3.5 text-sm',
        lg: 'h-[42px] px-5 text-sm',
        icon: 'h-[42px] w-[42px] p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
