import CryptoJS from 'crypto-js';

// IMPORTANT: Use same secret key as backend
const SECRET_KEY =
  process.env.NEXT_PUBLIC_PAYLOAD_ENCRYPTION_KEY ||
  'finvera-default-encryption-key-change-this-in-production';

/**
 * Encrypt payload before sending
 */
export function encryptPayload(data) {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return { encrypted };
  } catch (error) {
    console.error('Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt response from server
 */
export function decryptPayload(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);

    if (!jsonString) {
      throw new Error('Decryption produced empty result');
    }

    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw error;
  }
}
