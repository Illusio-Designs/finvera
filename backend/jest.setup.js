// Jest setup file
// Set test timeout for property-based tests
jest.setTimeout(30000);

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.E_INVOICE_THRESHOLD = '50000';
process.env.SANDBOX_API_KEY = 'test-api-key';
process.env.SANDBOX_API_SECRET = 'test-api-secret';
process.env.SANDBOX_ENVIRONMENT = 'test';