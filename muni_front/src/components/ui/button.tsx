import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#164B35] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-[#164B35] text-white shadow-sm hover:bg-[#0F3626]',
        gold: 'bg-[#B6944A] text-white shadow-sm hover:bg-[#967736]',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        outline:
          'border border-[#DCE3DE] bg-white text-[#26352D] hover:bg-[#E8F0EC] hover:text-[#164B35]',
        secondary: 'bg-[#E8F0EC] text-[#164B35] hover:bg-[#D5E4DC]',
        ghost: 'text-[#26352D] hover:bg-[#E8F0EC] hover:text-[#164B35]',
        link: 'text-[#164B35] underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-lg px-6 text-base',
        icon: 'h-9 w-9',
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
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

