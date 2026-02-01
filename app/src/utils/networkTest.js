import { API_CONFIG } from '../config/env';

// Network connectivity test utility
export const testNetworkConnectivity = async () => {
  // Get the primary API URL from environment
  const primaryApiUrl = API_CONFIG.API_URL;
  
  // Generate fallback URLs based on the primary URL
  const generateFallbackUrls = (primaryUrl) => {
    const fallbackUrls = [primaryUrl]; // Always include the primary URL first
    
    // Add custom fallback IPs from environment if specified
    if (API_CONFIG.DEV_FALLBACK_IPS) {
      const customIps = API_CONFIG.DEV_FALLBACK_IPS.split(',').map(ip => ip.trim());
      customIps.forEach(ip => {
        if (ip && !fallbackUrls.includes(`http://${ip}:3000/api`)) {
          fallbackUrls.push(`http://${ip}:3000/api`);
        }
      });
    }
    
    // Only add default fallback URLs in development mode
    if (API_CONFIG.BASE_URL.includes('localhost') || API_CONFIG.BASE_URL.includes('127.0.0.1')) {
      // For localhost, add common development alternatives
      const defaultFallbacks = [
        'http://localhost:3000/api',      // iOS Simulator
        'http://127.0.0.1:3000/api',      // Alternative localhost
        'http://10.0.2.2:3000/api',       // Android Emulator
      ];
      defaultFallbacks.forEach(url => {
        if (!fallbackUrls.includes(url)) {
          fallbackUrls.push(url);
        }
      });
    } else if (API_CONFIG.BASE_URL.includes('192.168') || API_CONFIG.BASE_URL.includes('10.')) {
      // Add emulator fallback for local network IPs
      if (!fallbackUrls.includes('http://10.0.2.2:3000/api')) {
        fallbackUrls.push('http://10.0.2.2:3000/api');
      }
    }
    
    return [...new Set(fallbackUrls)]; // Remove duplicates
  };

  const urlsToTry = generateFallbackUrls(primaryApiUrl);

  console.log('🔍 Testing network connectivity...');
  console.log('📡 Primary API URL:', primaryApiUrl);
  console.log('🔄 Fallback URLs:', urlsToTry.slice(1));
  
  const results = [];
  
  for (const baseUrl of urlsToTry) {
    try {
      console.log(`Testing: ${baseUrl}`);
      const startTime = Date.now();
      
      // Create a timeout promise
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 8000)
      );
      
      // Create the fetch promise
      const fetchPromise = fetch(`${baseUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });
      
      // Race between fetch and timeout
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (response.ok) {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          data = { status: 'ok' }; // Fallback if response is not JSON
        }
        
        results.push({
          url: baseUrl,
          status: 'success',
          responseTime,
          data,
          isPrimary: baseUrl === primaryApiUrl
        });
        console.log(`✅ ${baseUrl} - ${responseTime}ms ${baseUrl === primaryApiUrl ? '(Primary)' : '(Fallback)'}`);
      } else {
        results.push({
          url: baseUrl,
          status: 'error',
          responseTime,
          error: `HTTP ${response.status}`,
          isPrimary: baseUrl === primaryApiUrl
        });
        console.log(`❌ ${baseUrl} - HTTP ${response.status} ${baseUrl === primaryApiUrl ? '(Primary)' : '(Fallback)'}`);
      }
    } catch (error) {
      results.push({
        url: baseUrl,
        status: 'error',
        error: error.message,
        isPrimary: baseUrl === primaryApiUrl
      });
      console.log(`❌ ${baseUrl} - ${error.message} ${baseUrl === primaryApiUrl ? '(Primary)' : '(Fallback)'}`);
    }
  }
  
  return results;
};

export const findBestApiUrl = async () => {
  try {
    const results = await testNetworkConnectivity();
    const successfulResults = results.filter(r => r.status === 'success');
    
    if (successfulResults.length === 0) {
      console.log('❌ No working API URLs found');
      return null;
    }
    
    // Prioritize the primary URL if it's working
    const primaryResult = successfulResults.find(r => r.isPrimary);
    if (primaryResult) {
      console.log(`🚀 Primary API URL is working: ${primaryResult.url} (${primaryResult.responseTime}ms)`);
      return primaryResult.url;
    }
    
    // If primary is not working, return the fastest working fallback URL
    const fastest = successfulResults.reduce((prev, current) => 
      (prev.responseTime < current.responseTime) ? prev : current
    );
    
    console.log(`🚀 Using fallback API URL: ${fastest.url} (${fastest.responseTime}ms)`);
    console.warn('⚠️  Primary API URL is not working, using fallback. Please check your environment configuration.');
    return fastest.url;
  } catch (error) {
    console.error('❌ Network test failed:', error);
    return null;
  }
};

// Test specific endpoint connectivity
export const testEndpointConnectivity = async (baseUrl, endpoint = '/health') => {
  try {
    console.log(`🔍 Testing endpoint: ${baseUrl}${endpoint}`);
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );
    
    const fetchPromise = fetch(`${baseUrl}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });
    
    const response = await Promise.race([fetchPromise, timeoutPromise]);
    
    if (response.ok) {
      console.log(`✅ Endpoint ${endpoint} is working`);
      return true;
    } else {
      console.log(`❌ Endpoint ${endpoint} returned HTTP ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Endpoint ${endpoint} failed: ${error.message}`);
    return false;
  }
};