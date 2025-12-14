// Runtime polyfill for global object - must be executed first
// This ensures global is available before any other code runs
// This file must NOT use ES6 modules - it must be plain JavaScript

(function() {
  'use strict';
  
  // Get the root global object
  var root = (function() {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;
    if (typeof self !== 'undefined') return self;
    return {};
  })();
  
  // Assign global to root object
  if (typeof root.global === 'undefined') {
    try {
      Object.defineProperty(root, 'global', {
        value: root,
        writable: true,
        enumerable: false,
        configurable: true
      });
    } catch (e) {
      root.global = root;
    }
  }
  
  // For webpack and other tools that expect 'global' as a variable
  // We need to make it available in the module scope
  // Since we can't create true globals in strict mode modules,
  // we'll assign it to all possible global objects
  if (typeof window !== 'undefined' && typeof window.global === 'undefined') {
    window.global = root;
  }
  if (typeof globalThis !== 'undefined' && typeof globalThis.global === 'undefined') {
    globalThis.global = root;
  }
  if (typeof self !== 'undefined' && typeof self.global === 'undefined') {
    self.global = root;
  }
  
  // Export for CommonJS (in case this file is imported)
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = root;
  }
})();

// Create a global variable using eval (only way in strict mode)
// This is necessary for webpack's runtime code
try {
  (function() {
    var root = typeof globalThis !== 'undefined' ? globalThis : 
               typeof window !== 'undefined' ? window : 
               typeof self !== 'undefined' ? self : {};
    if (typeof root.global === 'undefined') {
      root.global = root;
    }
    // Use Function constructor to create global variable
    (new Function('root', 'root.global = root; if (typeof window !== "undefined") window.global = root; if (typeof globalThis !== "undefined") globalThis.global = root'))(root);
  })();
} catch (e) {
  // Silent fail - the root.global assignment above should be sufficient
}
