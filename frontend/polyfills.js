// Polyfill for global object in browser
if (typeof window !== 'undefined' && !window.global) {
  window.global = window;
}
