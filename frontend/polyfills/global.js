// Polyfill for global object - works for browser environment
// This module provides a global object that works in all environments

// Use an IIFE to avoid polluting the global scope during module evaluation
var getGlobal = function() {
  // Prefer globalThis (ES2020 standard, works everywhere)
  if (typeof globalThis !== 'undefined') {
    return globalThis;
  }
  // Browser environment
  if (typeof window !== 'undefined') {
    return window;
  }
  // Node.js environment (for SSR)
  if (typeof global !== 'undefined') {
    return global;
  }
  // Web Worker environment
  if (typeof self !== 'undefined') {
    return self;
  }
  // Fallback: create a minimal object
  return {};
};

// Export the global object
module.exports = getGlobal();
