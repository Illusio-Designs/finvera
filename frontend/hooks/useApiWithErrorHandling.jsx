import { useState, useCallback } from 'react';
import { handleApiError } from '../lib/api';

/**
 * Enhanced API Hook with comprehensive error handling
 * Provides loading states, error handling, and retry functionality
 */
export const useApiWithErrorHandling = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const callApi = useCallback(async (apiFunction, context = '', options = {}) => {
    const { 
      showLoading = true, 
      retries = 1,
      onSuccess,
      onError 
    } = options;

    if (showLoading) setLoading(true);
    setError(null);

    let lastError;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await apiFunction();
        
        if (showLoading) setLoading(false);
        
        if (onSuccess) {
          onSuccess(result);
        }
        
        return result;
      } catch (err) {
        lastError = err;
        
        // Don't retry on certain errors
        const shouldNotRetry = err.message?.includes('Insufficient permissions') ||
                              err.message?.includes('Authentication required') ||
                              err.message?.includes('Bad Request');
        
        if (shouldNotRetry || attempt === retries - 1) {
          break;
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      }
    }

    const processedError = handleApiError(lastError, context);
    setError(processedError);
    
    if (showLoading) setLoading(false);
    
    if (onError) {
      onError(processedError);
    }
    
    throw processedError;
  }, []);

  const retry = useCallback((apiFunction, context, options) => {
    return callApi(apiFunction, context, options);
  }, [callApi]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    callApi,
    retry,
    clearError
  };
};

export default useApiWithErrorHandling;