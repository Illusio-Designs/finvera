const handlebars = require('handlebars');

// Register common helpers
handlebars.registerHelper('add', function(a, b) {
  return a + b;
});

handlebars.registerHelper('subtract', function(a, b) {
  return a - b;
});

handlebars.registerHelper('multiply', function(a, b) {
  return a * b;
});

handlebars.registerHelper('divide', function(a, b) {
  return b !== 0 ? a / b : 0;
});

handlebars.registerHelper('eq', function(a, b) {
  return a === b;
});

handlebars.registerHelper('ne', function(a, b) {
  return a !== b;
});

handlebars.registerHelper('gt', function(a, b) {
  return a > b;
});

handlebars.registerHelper('lt', function(a, b) {
  return a < b;
});

handlebars.registerHelper('formatNumber', function(number, decimals = 2) {
  if (typeof number !== 'number') return number;
  return number.toFixed(decimals);
});

handlebars.registerHelper('formatCurrency', function(amount) {
  if (typeof amount !== 'number') return amount;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount);
});

handlebars.registerHelper('formatDate', function(date, format = 'DD/MM/YYYY') {
  if (!date) return '';
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year);
});

handlebars.registerHelper('uppercase', function(str) {
  return str ? str.toUpperCase() : '';
});

handlebars.registerHelper('lowercase', function(str) {
  return str ? str.toLowerCase() : '';
});

module.exports = handlebars;
