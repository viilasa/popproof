import { ReactNode, useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from './Skeleton';

// Table Types
interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  render?: (value: any, row: T, index: number) => ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  hoverable?: boolean;
  striped?: boolean;
  compact?: boolean;
  stickyHeader?: boolean;
  selectedRows?: number[];
  onSelectRow?: (index: number) => void;
  selectable?: boolean;
}

export function Table<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data available',
  onRowClick,
  hoverable = true,
  striped = false,
  compact = false,
  stickyHeader = false,
  selectedRows = [],
  onSelectRow,
  selectable = false,
}: TableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        const modifier = sortDirection === 'asc' ? 1 : -1;
        
        if (typeof aVal === 'string') {
          return aVal.localeCompare(bVal) * modifier;
        }
        return (aVal - bVal) * modifier;
      })
    : data;

  const cellPadding = compact ? 'px-4 py-2' : 'px-5 py-4';
  const headerPadding = compact ? 'px-4 py-2.5' : 'px-5 py-3.5';

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-surface-200/60 bg-white shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className={`bg-surface-50/80 ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th className={`${headerPadding} w-12`}>
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                    checked={selectedRows.length === data.length && data.length > 0}
                    onChange={() => {
                      if (selectedRows.length === data.length) {
                        data.forEach((_, i) => onSelectRow?.(i));
                      } else {
                        data.forEach((_, i) => {
                          if (!selectedRows.includes(i)) onSelectRow?.(i);
                        });
                      }
                    }}
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={String(column.key)}
                  className={`
                    ${headerPadding}
                    text-left text-xs font-semibold text-surface-600 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer select-none hover:bg-surface-100/50' : ''}
                    ${column.align === 'center' ? 'text-center' : ''}
                    ${column.align === 'right' ? 'text-right' : ''}
                  `}
                  style={{ width: column.width }}
                  onClick={() => column.sortable && handleSort(String(column.key))}
                >
                  <div className={`flex items-center gap-1.5 ${column.align === 'right' ? 'justify-end' : column.align === 'center' ? 'justify-center' : ''}`}>
                    {column.header}
                    {column.sortable && (
                      <span className="text-surface-400">
                        {sortKey === column.key ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-4 h-4 opacity-50" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100">
            {loading ? (
              // Loading skeleton rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {selectable && (
                    <td className={cellPadding}>
                      <Skeleton width={16} height={16} rounded="sm" />
                    </td>
                  )}
                  {columns.map((column, j) => (
                    <td key={j} className={cellPadding}>
                      <Skeleton 
                        width={j === 0 ? 150 : j === columns.length - 1 ? 80 : 100} 
                        height={16} 
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : sortedData.length === 0 ? (
              // Empty state
              <tr>
                <td 
                  colSpan={columns.length + (selectable ? 1 : 0)} 
                  className="px-5 py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center">
                      <svg className="w-6 h-6 text-surface-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                    </div>
                    <p className="text-sm text-surface-500">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data rows
              sortedData.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={`
                    transition-colors duration-150
                    ${hoverable ? 'hover:bg-surface-50/50' : ''}
                    ${striped && rowIndex % 2 === 1 ? 'bg-surface-50/30' : ''}
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${selectedRows.includes(rowIndex) ? 'bg-brand-50/50' : ''}
                  `}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {selectable && (
                    <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                        checked={selectedRows.includes(rowIndex)}
                        onChange={() => onSelectRow?.(rowIndex)}
                      />
                    </td>
                  )}
                  {columns.map((column, colIndex) => {
                    const value = row[column.key as keyof T];
                    return (
                      <td
                        key={colIndex}
                        className={`
                          ${cellPadding}
                          text-sm text-surface-700
                          ${column.align === 'center' ? 'text-center' : ''}
                          ${column.align === 'right' ? 'text-right' : ''}
                        `}
                      >
                        {column.render ? column.render(value, row, rowIndex) : String(value ?? '')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Table Action Menu
interface TableActionMenuProps {
  actions: { label: string; onClick: () => void; icon?: ReactNode; danger?: boolean }[];
}

export function TableActionMenu({ actions }: TableActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
      >
        <MoreHorizontal className="w-4 h-4 text-surface-500" />
      </button>
      
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-soft-lg border border-surface-200 py-1 min-w-[140px] animate-scale-in">
            {actions.map((action, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick();
                  setIsOpen(false);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm flex items-center gap-2
                  transition-colors
                  ${action.danger 
                    ? 'text-danger-600 hover:bg-danger-50' 
                    : 'text-surface-700 hover:bg-surface-50'
                  }
                `}
              >
                {action.icon}
                {action.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Pagination Component
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageNumbers?: boolean;
  compact?: boolean;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageNumbers = true,
  compact = false,
}: PaginationProps) {
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const showEllipsis = totalPages > 7;
    
    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return pages;
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-sm text-surface-600">
          {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {showPageNumbers && getPageNumbers().map((page, i) => (
        typeof page === 'number' ? (
          <button
            key={i}
            onClick={() => onPageChange(page)}
            className={`
              min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors
              ${currentPage === page 
                ? 'bg-brand-600 text-white' 
                : 'hover:bg-surface-100 text-surface-600'
              }
            `}
          >
            {page}
          </button>
        ) : (
          <span key={i} className="px-2 text-surface-400">...</span>
        )
      ))}
      
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="p-2 rounded-lg hover:bg-surface-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// Data Table with built-in pagination
interface DataTableProps<T> extends TableProps<T> {
  pageSize?: number;
  showPagination?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  pageSize = 10,
  showPagination = true,
  ...tableProps
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / pageSize);
  
  const paginatedData = data.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="space-y-4">
      <Table data={paginatedData} {...tableProps} />
      
      {showPagination && totalPages > 1 && (
        <div className="flex items-center justify-between px-2">
          <p className="text-sm text-surface-500">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, data.length)} of {data.length} results
          </p>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}
