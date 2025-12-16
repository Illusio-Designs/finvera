import { useState } from 'react';
import LoadingSpinner from '../ui/LoadingSpinner';
import EmptyState from '../ui/EmptyState';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { FiSearch, FiFilter, FiX, FiChevronUp, FiChevronDown, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  onRowClick,
  actions,
  pagination,
  onPageChange,
  onSort,
  sortField,
  sortOrder,
  onFilter,
  filters = {},
  searchable = false,
  searchPlaceholder = 'Search...',
  className = '',
  showFilters = true,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || {});

  const handleSort = (field) => {
    if (onSort) {
      const newOrder = sortField === field && sortOrder === 'asc' ? 'desc' : 'asc';
      onSort(field, newOrder);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onFilter) {
      onFilter({ ...localFilters, search: value });
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    if (onFilter) {
      onFilter(newFilters);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    if (onFilter) {
      onFilter(clearedFilters);
    }
  };

  const renderSortIcon = (field) => {
    if (sortField !== field) {
      return (
        <div className="flex flex-col ml-1">
          <FiChevronUp className="w-3 h-3 text-gray-300 -mb-1" />
          <FiChevronDown className="w-3 h-3 text-gray-300" />
        </div>
      );
    }
    return sortOrder === 'asc' ? (
      <FiChevronUp className="w-4 h-4 text-primary-600 ml-1" />
    ) : (
      <FiChevronDown className="w-4 h-4 text-primary-600 ml-1" />
    );
  };

  const hasActiveFilters = searchTerm || Object.values(localFilters).some(v => v !== '' && v !== null && v !== undefined);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const filteredData = data.filter(row => {
    if (!searchTerm) return true;
    return columns.some(column => {
      const value = row[column.key];
      return value && String(value).toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  const displayData = filteredData.length > 0 ? filteredData : data;

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden ${className}`}>
      {/* Filter Bar */}
      {(searchable || showFilters) && (
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {searchable && (
              <div className="flex-1 w-full sm:max-w-md">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
              </div>
            )}
            
            {showFilters && (
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={showFilterPanel ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setShowFilterPanel(!showFilterPanel)}
                >
                  <FiFilter className="h-4 w-4 mr-2" />
                  Filters
                  {hasActiveFilters && (
                    <span className="ml-2 px-1.5 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      {Object.values(localFilters).filter(v => v !== '' && v !== null && v !== undefined).length + (searchTerm ? 1 : 0)}
                    </span>
                  )}
                </Button>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                  >
                    <FiX className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Filter Panel */}
          {showFilterPanel && showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns
                  .filter(col => col.filterable !== false && col.filterOptions)
                  .map((column) => (
                    <div key={column.key}>
                      <Select
                        label={column.label}
                        name={`filter-${column.key}`}
                        value={localFilters[column.key] || ''}
                        onChange={(e) => handleFilterChange(column.key, e.target.value)}
                        options={column.filterOptions}
                        placeholder={`Filter by ${column.label}`}
                        className="text-sm"
                      />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
                  `}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center">
                    <span>{column.label}</span>
                    {column.sortable && renderSortIcon(column.key)}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {displayData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + (actions ? 1 : 0)} className="px-6 py-12">
                  <EmptyState title="No data found" description="There are no records to display." />
                </td>
              </tr>
            ) : (
              displayData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`
                    transition-colors duration-150
                    ${onRowClick ? 'cursor-pointer hover:bg-gray-50' : 'hover:bg-gray-50/50'}
                  `}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {columns.map((column) => (
                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {column.render ? column.render(row[column.key], row) : row[column.key] || '-'}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        {actions(row)}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && onPageChange && (
        <div className="bg-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
            <span className="font-semibold">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{' '}
            of <span className="font-semibold">{pagination.total}</span> results
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <FiChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`
                      min-w-[2.5rem] px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                      ${pagination.page === pageNum
                        ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Next
              <FiChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

