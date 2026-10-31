import * as React from 'react';
import { EmptyState } from '@/components/common/StateFeedback';
import { SearchInput } from './SearchInput';
import { Pagination } from './Pagination';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  className?: string;
  render: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey: (row: T, index: number) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  selectedRowKey?: string | number | null;
  searchValue?: string;
  onSearchChange?: (val: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  pageSize?: number;
}

/**
 * Tabla estandarizada — Sistema de Gestión Municipal de Nicoya (SIGEMUN)
 * - Encabezados, filas, espaciados, buscador, filtros y paginación uniformes
 */
export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyTitle,
  emptyDescription,
  onRowClick,
  selectedRowKey,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterSlot,
  pageSize = 15,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = React.useState(1);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [data.length, searchValue]);

  const totalItems = data.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedData = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return data.slice(start, start + pageSize);
  }, [data, currentPage, pageSize]);

  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E5E7EB] bg-white shadow-card">
      {(onSearchChange || filterSlot) && (
        <div className="flex flex-col justify-between gap-3 border-b border-[#E5E7EB] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center">
          {onSearchChange && (
            <SearchInput
              value={searchValue ?? ''}
              onChange={onSearchChange}
              placeholder={searchPlaceholder}
              containerClassName="sm:max-w-sm"
            />
          )}
          {filterSlot && <div className="flex flex-wrap items-center gap-2">{filterSlot}</div>}
        </div>
      )}

      {data.length === 0 ? (
        <div className="p-6">
          <EmptyState title={emptyTitle} description={emptyDescription} />
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB] bg-[#F8FAFC] text-[11px] font-bold uppercase tracking-[0.06em] text-[#4B5563]">
                  {columns.map((col) => (
                    <th key={col.key} className={`px-4 py-3.5 ${col.className ?? ''}`}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB] text-sm text-[#171717]">
                {paginatedData.map((row, idx) => {
                  const key = rowKey(row, idx);
                  const isSelected =
                    selectedRowKey !== undefined && selectedRowKey !== null && selectedRowKey === key;
                  return (
                    <tr
                      key={key}
                      onClick={() => onRowClick?.(row)}
                      className={`transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${
                        isSelected
                          ? 'bg-[#EFF6FF] shadow-[inset_3px_0_0_#1D4ED8]'
                          : 'even:bg-[#F8FAFC]/60 hover:bg-[#F3F4F6]/70'
                      }`}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={`px-4 py-3.5 align-middle ${col.className ?? ''}`}
                        >
                          {col.render(row, idx)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalItems > pageSize && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              onPageChange={setCurrentPage}
            />
          )}
        </>
      )}
    </div>
  );
}

