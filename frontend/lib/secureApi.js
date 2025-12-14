import { encryptPayload, decryptPayload } from './encryption';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Secure API client with automatic encryption/decryption
 */
export const secureAPI = {
  /**
   * POST request with encryption
   */
  async post(endpoint, data, options = {}) {
    const { token, encrypt = true } = options;

    // Prepare request body
    const body = encrypt ? JSON.stringify(encryptPayload(data)) : JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(encrypt && { 'X-Encrypt-Response': 'true' }),
      },
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    const result = await response.json();

    // Decrypt response if encrypted
    if (result.encrypted) {
      return decryptPayload(result.encrypted);
    }

    return result;
  },

  /**
   * GET request
   */
  async get(endpoint, options = {}) {
    const { token, encrypt = false } = options;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(encrypt && { 'X-Encrypt-Response': 'true' }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    const result = await response.json();

    // Decrypt response if encrypted
    if (result.encrypted) {
      return decryptPayload(result.encrypted);
    }

    return result;
  },

  /**
   * PUT request with encryption
   */
  async put(endpoint, data, options = {}) {
    const { token, encrypt = true } = options;

    const body = encrypt ? JSON.stringify(encryptPayload(data)) : JSON.stringify(data);

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(encrypt && { 'X-Encrypt-Response': 'true' }),
      },
      body,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    const result = await response.json();

    if (result.encrypted) {
      return decryptPayload(result.encrypted);
    }

    return result;
  },

  /**
   * DELETE request
   */
  async delete(endpoint, options = {}) {
    const { token } = options;

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.message || 'Request failed');
    }

    const result = await response.json();

    if (result.encrypted) {
      return decryptPayload(result.encrypted);
    }

    return result;
  },
};

// Regular API without encryption (for non-sensitive endpoints)
export const regularAPI = {
  async post(endpoint, data, token) {
    return secureAPI.post(endpoint, data, { token, encrypt: false });
  },

  async get(endpoint, token) {
    return secureAPI.get(endpoint, { token, encrypt: false });
  },

  async put(endpoint, data, token) {
    return secureAPI.put(endpoint, data, { token, encrypt: false });
  },

  async delete(endpoint, token) {
    return secureAPI.delete(endpoint, { token });
  },
};
