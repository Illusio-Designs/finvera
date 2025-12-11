import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for table data management with pagination, sorting, and filtering
 */
export const useTable = (fetchFunction, initialParams = {}) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState({ field: null, order: 'asc' });
  const [filters, setFilters] = useState(initialParams);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
      };

      if (sort.field) {
        params.sortBy = sort.field;
        params.sortOrder = sort.order;
      }

      const response = await fetchFunction(params);
      const responseData = response.data || response;
      
      setData(responseData.data || responseData.items || []);
      
      if (responseData.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: responseData.pagination.total || 0,
          totalPages: responseData.pagination.totalPages || 0,
        }));
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, pagination.page, pagination.limit, sort, filters]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePageChange = useCallback((newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  }, []);

  const handleLimitChange = useCallback((newLimit) => {
    setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
  }, []);

  const handleSort = useCallback((field) => {
    setSort((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const handleFilter = useCallback((newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialParams);
    setPagination((prev) => ({ ...prev, page: 1 }));
  }, [initialParams]);

  return {
    data,
    loading,
    error,
    pagination,
    sort,
    filters,
    fetchData,
    handlePageChange,
    handleLimitChange,
    handleSort,
    handleFilter,
    resetFilters,
  };
};

