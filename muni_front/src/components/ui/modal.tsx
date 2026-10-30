import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#071A12]/60 p-0 backdrop-blur-sm animate-in fade-in duration-150 sm:items-center sm:p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sigemun-modal-title"
        className={cn(
          'relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-[#DCE3DE] bg-white shadow-elevated sm:rounded-2xl',
          maxWidth
        )}
      >
        <div className="flex items-start justify-between border-b border-[#DCE3DE] px-6 py-4">
          <div>
            <h2 id="sigemun-modal-title" className="text-lg font-bold text-[#164B35]">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-[#5A6B61]">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#5A6B61] hover:bg-[#E8F0EC] hover:text-[#164B35]"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
}

