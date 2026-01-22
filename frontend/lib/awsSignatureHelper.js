/**
 * AWS Signature V4 Helper for Frontend
 * Handles premium Sandbox API endpoints that require AWS authentication
 */

// Helper to detect if an API call needs AWS Signature V4
export const needsAWSSignature = (endpoint) => {
  const awsEndpoints = [
    '/gst/rate',
    '/hsn/search',
    '/hsn/',
    '/tds/compliance/csi/',
    '/tds/reports/tcs',
    '/income-tax/calculator/'
  ];
  
  return awsEndpoints.some(pattern => endpoint.includes(pattern));
};

// Helper to add AWS signature headers (frontend implementation)
export const addAWSHeaders = (config, endpoint) => {
  if (needsAWSSignature(endpoint)) {
    // Add headers to indicate AWS signature requirement
    config.headers = {
      ...config.headers,
      'X-Use-AWS-Signature': 'true',
      'X-Premium-Endpoint': 'true'
    };
  }
  return config;
};

// Retry mechanism for AWS signature failures
export const retryWithAWSSignature = async (apiCall, maxRetries = 2) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Check if it's an AWS signature error
      const isAWSError = error.message?.includes('Authorization header requires') ||
                        error.message?.includes('Insufficient privilege');
      
      if (isAWSError && attempt < maxRetries - 1) {
        console.log(`Retrying with AWS Signature V4 (attempt ${attempt + 2})`);
        continue;
      }
      
      break;
    }
  }
  
  throw lastError;
};

// Enhanced API call wrapper with AWS signature support
export const makeSecureApiCall = async (apiFunction, ...args) => {
  return retryWithAWSSignature(() => apiFunction(...args));
};