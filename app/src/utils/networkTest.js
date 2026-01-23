// Network connectivity test utility
export const testNetworkConnectivity = async () => {
  const urlsToTry = [
    'http://192.168.1.39:3000/api',  // Computer IP (WiFi)
    'http://192.168.1.100:3000/api', // Alternative WiFi IP
    'http://192.168.0.100:3000/api', // Alternative WiFi IP
    'http://10.0.2.2:3000/api',      // Android Emulator
    'http://localhost:3000/api',      // iOS Simulator
  ];

  console.log('🔍 Testing network connectivity...');
  
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
          data
        });
        console.log(`✅ ${baseUrl} - ${responseTime}ms`);
      } else {
        results.push({
          url: baseUrl,
          status: 'error',
          responseTime,
          error: `HTTP ${response.status}`
        });
        console.log(`❌ ${baseUrl} - HTTP ${response.status}`);
      }
    } catch (error) {
      results.push({
        url: baseUrl,
        status: 'error',
        error: error.message
      });
      console.log(`❌ ${baseUrl} - ${error.message}`);
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
    
    // Return the fastest working URL
    const fastest = successfulResults.reduce((prev, current) => 
      (prev.responseTime < current.responseTime) ? prev : current
    );
    
    console.log(`🚀 Best API URL: ${fastest.url} (${fastest.responseTime}ms)`);
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