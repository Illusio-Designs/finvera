// Polyfill for global object in browser
// This ensures global is available in all environments
// This MUST run synchronously before any other imports

(function() {
  'use strict';
  
  // Get the appropriate global object
  var root;
  
  if (typeof globalThis !== 'undefined') {
    root = globalThis;
  } else if (typeof window !== 'undefined') {
    root = window;
  } else if (typeof global !== 'undefined') {
    root = global;
  } else if (typeof self !== 'undefined') {
    root = self;
  } else {
    root = {};
  }
  
  // Assign global if it doesn't exist
  if (typeof root.global === 'undefined') {
    // Use Object.defineProperty to make it non-enumerable
    try {
      Object.defineProperty(root, 'global', {
        value: root,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (e) {
      // Fallback for environments that don't support defineProperty
      root.global = root;
    }
  }
  
  // Also ensure 'global' variable is available in the current scope
  // This is needed for code that references 'global' directly
  if (typeof global === 'undefined') {
    // Use eval in a way that creates a global variable
    // This is necessary for webpack's module system
    try {
      (function() {
        this.global = root;
      }).call(root);
    } catch (e) {
      // Silent fail - root.global should be enough
    }
  }
})();

// Export for module systems that need it
if (typeof module !== 'undefined' && module.exports) {
  module.exports = typeof global !== 'undefined' ? global : (typeof window !== 'undefined' ? window : globalThis);
}

