import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

/**
 * Paginación estandarizada para todas las tablas del sistema — SIGEMUN Nicoya
 */
export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: PaginationProps) {
  const safeTotalPages = Math.max(1, totalPages);
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(totalItems, currentPage * pageSize);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E5E7EB] bg-[#F8FAFC] px-5 py-3 text-xs text-[#4B5563] sm:flex-row">
      <div>
        Mostrando <strong className="font-semibold text-[#171717]">{startItem}</strong> a{' '}
        <strong className="font-semibold text-[#171717]">{endItem}</strong> de{' '}
        <strong className="font-semibold text-[#171717]">{totalItems}</strong> registro(s)
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          className="px-3"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </Button>
        <span className="px-2 font-semibold text-[#171717]">
          Página {currentPage} de {safeTotalPages}
        </span>
        <Button
          type="button"
          variant="secondary"
          disabled={currentPage >= safeTotalPages}
          onClick={() => onPageChange(Math.min(safeTotalPages, currentPage + 1))}
          className="px-3"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

