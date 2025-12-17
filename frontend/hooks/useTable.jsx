import { useState, useEffect, useCallback, useRef } from 'react';

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
  
  // Use refs to store stable references
  const fetchFunctionRef = useRef(fetchFunction);
  const fetchingRef = useRef(false);
  const isMountedRef = useRef(true);
  
  // Update ref when fetchFunction changes
  useEffect(() => {
    fetchFunctionRef.current = fetchFunction;
  }, [fetchFunction]);

  // Track mounted state
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Store filters in ref to avoid dependency issues
  const filtersRef = useRef(filters);
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  const fetchData = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (fetchingRef.current) {
      return;
    }
    
    fetchingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...filtersRef.current,
      };

      if (sort.field) {
        params.sortBy = sort.field;
        params.sortOrder = sort.order;
      }

      const response = await fetchFunctionRef.current(params);
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        fetchingRef.current = false;
        return;
      }
      
      const responseData = response.data || response;
      
      setData(responseData.data || responseData.items || []);
      
      // Handle pagination in nested object or direct format
      if (responseData.pagination) {
        setPagination((prev) => ({
          ...prev,
          total: responseData.pagination.total || 0,
          totalPages: responseData.pagination.totalPages || 0,
        }));
      } else if (responseData.total !== undefined) {
        // Handle direct pagination format (total, page, limit, totalPages)
        setPagination((prev) => ({
          ...prev,
          total: responseData.total || 0,
          totalPages: responseData.totalPages || Math.ceil((responseData.total || 0) / (responseData.limit || prev.limit)),
        }));
      }
    } catch (err) {
      // Only update state if component is still mounted
      if (!isMountedRef.current) {
        fetchingRef.current = false;
        return;
      }
      
      // Don't log 429 errors (rate limiting)
      if (err.response?.status !== 429) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch data');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      fetchingRef.current = false;
    }
  }, [pagination.page, pagination.limit, sort.field, sort.order]);

  // Track previous values to prevent unnecessary refetches
  const prevParamsRef = useRef({
    page: pagination.page,
    limit: pagination.limit,
    sortField: sort.field,
    sortOrder: sort.order,
    filters: JSON.stringify(filters),
  });

  // Single effect to handle all data fetching
  useEffect(() => {
    const currentParams = {
      page: pagination.page,
      limit: pagination.limit,
      sortField: sort.field,
      sortOrder: sort.order,
      filters: JSON.stringify(filters),
    };

    // Only fetch if parameters actually changed
    const paramsChanged = 
      prevParamsRef.current.page !== currentParams.page ||
      prevParamsRef.current.limit !== currentParams.limit ||
      prevParamsRef.current.sortField !== currentParams.sortField ||
      prevParamsRef.current.sortOrder !== currentParams.sortOrder ||
      prevParamsRef.current.filters !== currentParams.filters;

    if (paramsChanged) {
      prevParamsRef.current = currentParams;
      // Call fetchData directly using the ref to avoid dependency issues
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagination.page, pagination.limit, sort.field, sort.order, filters]);

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

