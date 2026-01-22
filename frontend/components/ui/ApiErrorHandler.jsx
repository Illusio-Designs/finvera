import { Alert, AlertDescription } from './Alert';

/**
 * Enhanced API Error Handler Component
 * Provides user-friendly error messages for different API failure scenarios
 */
export const ApiErrorHandler = ({ error, context, onRetry }) => {
  if (!error) return null;

  const getErrorMessage = (error) => {
    const message = error.message || 'An unexpected error occurred';
    
    // Handle specific error types
    if (message.includes('Authorization header requires')) {
      return {
        title: 'Premium Feature Access Required',
        description: 'This feature requires premium API access. Please contact support to upgrade your account.',
        type: 'warning',
        showRetry: false
      };
    }
    
    if (message.includes('Insufficient permissions')) {
      return {
        title: 'Access Denied',
        description: 'You do not have permission to access this feature. Please contact your administrator.',
        type: 'error',
        showRetry: false
      };
    }
    
    if (message.includes('Network error')) {
      return {
        title: 'Connection Error',
        description: 'Unable to connect to the server. Please check your internet connection and try again.',
        type: 'error',
        showRetry: true
      };
    }
    
    if (message.includes('Authentication required')) {
      return {
        title: 'Session Expired',
        description: 'Your session has expired. Please login again to continue.',
        type: 'warning',
        showRetry: false
      };
    }
    
    if (message.includes('Bad Request')) {
      return {
        title: 'Invalid Request',
        description: message.replace('Bad Request: ', ''),
        type: 'error',
        showRetry: false
      };
    }
    
    if (message.includes('Server error')) {
      return {
        title: 'Server Error',
        description: 'A server error occurred. Please try again later or contact support if the problem persists.',
        type: 'error',
        showRetry: true
      };
    }
    
    return {
      title: 'Error',
      description: message,
      type: 'error',
      showRetry: true
    };
  };

  const errorInfo = getErrorMessage(error);

  return (
    <Alert variant={errorInfo.type} className="mb-4">
      <AlertDescription>
        <div className="flex flex-col space-y-2">
          <div className="font-semibold">{errorInfo.title}</div>
          <div>{errorInfo.description}</div>
          {context && (
            <div className="text-sm text-gray-600">
              Context: {context}
            </div>
          )}
          {errorInfo.showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors w-fit"
            >
              Try Again
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ApiErrorHandler;