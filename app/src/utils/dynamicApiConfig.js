import { API_CONFIG } from '../config/env';
import * as Network from 'expo-network';

/**
 * Dynamic API Configuration
 * Automatically detects and uses the best available API endpoint
 */

let cachedWorkingUrl = null;
let lastCheckTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get local IP addresses to try
 */
const getLocalIpAddresses = async () => {
  const ips = [];
  
  try {
    // Get device's IP address
    const networkState = await Network.getIpAddressAsync();
    if (networkState) {
      // Extract network prefix (e.g., 192.168.0.x or 192.168.1.x)
      const parts = networkState.split('.');
      if (parts.length === 4) {
        const prefix = `${parts[0]}.${parts[1]}.${parts[2]}`;
        
        // Try common host IPs in the same subnet
        for (let i = 1; i <= 255; i++) {
          ips.push(`${prefix}.${i}`);
        }
      }
    }
  } catch (error) {
    console.log('Could not get device IP:', error.message);
  }
  
  return ips;
};

/**
 * Get list of API URLs to try
 */
const getApiUrlsToTry = async () => {
  const urls = [];
  
  // 1. Primary configured URL
  urls.push(API_CONFIG.BASE_URL);
  
  // 2. Fallback IPs from config
  if (API_CONFIG.DEV_FALLBACK_IPS) {
    const fallbackIps = API_CONFIG.DEV_FALLBACK_IPS.split(',').map(ip => ip.trim());
    fallbackIps.forEach(ip => {
      if (ip) {
        urls.push(`http://${ip}:3000`);
      }
    });
  }
  
  // 3. Common development IPs
  const commonIps = [
    'localhost',
    '127.0.0.1',
    '10.0.2.2', // Android emulator
    '192.168.0.102', // Current configured IP
    '192.168.1.39', // Previous IP
    '192.168.0.100',
    '192.168.1.100',
  ];
  
  commonIps.forEach(ip => {
    urls.push(`http://${ip}:3000`);
  });
  
  // 4. Try to detect local network IPs (only in development)
  if (__DEV__) {
    try {
      const localIps = await getLocalIpAddresses();
      // Only add first 10 IPs to avoid too many requests
      localIps.slice(0, 10).forEach(ip => {
        urls.push(`http://${ip}:3000`);
      });
    } catch (error) {
      console.log('Could not detect local IPs:', error.message);
    }
  }
  
  // Remove duplicates and return
  return [...new Set(urls)];
};

/**
 * Test if a URL is reachable
 */
const testUrl = async (baseUrl, timeout = 3000) => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const startTime = Date.now();
    const response = await fetch(`${baseUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      return { success: true, baseUrl, responseTime };
    }
    
    return { success: false, baseUrl, error: `HTTP ${response.status}` };
  } catch (error) {
    if (error.name === 'AbortError') {
      return { success: false, baseUrl, error: 'Timeout' };
    }
    return { success: false, baseUrl, error: error.message };
  }
};

/**
 * Find working API URL
 */
export const findWorkingApiUrl = async (forceRefresh = false) => {
  // Return cached URL if still valid
  if (!forceRefresh && cachedWorkingUrl && lastCheckTime) {
    const timeSinceCheck = Date.now() - lastCheckTime;
    if (timeSinceCheck < CACHE_DURATION) {
      console.log(`✅ Using cached API URL: ${cachedWorkingUrl}`);
      return cachedWorkingUrl;
    }
  }
  
  console.log('🔍 Finding working API URL...');
  
  const urlsToTry = await getApiUrlsToTry();
  console.log(`📡 Testing ${urlsToTry.length} potential URLs...`);
  
  // Test URLs in parallel (in batches to avoid overwhelming the network)
  const batchSize = 5;
  const results = [];
  
  for (let i = 0; i < urlsToTry.length; i += batchSize) {
    const batch = urlsToTry.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(url => testUrl(url, 3000))
    );
    results.push(...batchResults);
    
    // If we found a working URL, stop testing
    const workingUrl = batchResults.find(r => r.success);
    if (workingUrl) {
      console.log(`✅ Found working API URL: ${workingUrl.baseUrl} (${workingUrl.responseTime}ms)`);
      cachedWorkingUrl = workingUrl.baseUrl;
      lastCheckTime = Date.now();
      return workingUrl.baseUrl;
    }
  }
  
  // No working URL found
  console.error('❌ No working API URL found');
  console.log('Tested URLs:', results.map(r => `${r.baseUrl}: ${r.error || 'OK'}`));
  
  // Return primary URL as fallback
  return API_CONFIG.BASE_URL;
};

/**
 * Get current API configuration
 */
export const getCurrentApiConfig = async () => {
  const baseUrl = await findWorkingApiUrl();
  
  return {
    BASE_URL: baseUrl,
    API_URL: `${baseUrl}/api`,
    UPLOADS_BASE_URL: baseUrl,
  };
};

/**
 * Clear cached URL (useful for testing or when network changes)
 */
export const clearApiUrlCache = () => {
  cachedWorkingUrl = null;
  lastCheckTime = null;
  console.log('🔄 API URL cache cleared');
};

/**
 * Test current API connection
 */
export const testCurrentApiConnection = async () => {
  const baseUrl = cachedWorkingUrl || API_CONFIG.BASE_URL;
  const result = await testUrl(baseUrl, 5000);
  
  if (!result.success) {
    console.warn('⚠️  Current API URL is not working, finding new one...');
    return await findWorkingApiUrl(true);
  }
  
  return baseUrl;
};

export default {
  findWorkingApiUrl,
  getCurrentApiConfig,
  clearApiUrlCache,
  testCurrentApiConnection,
};
