const CryptoJS = require('crypto-js');

// Use a strong secret key (store in .env)
const SECRET_KEY =
  process.env.PAYLOAD_ENCRYPTION_KEY || 'finvera-default-encryption-key-change-this-in-production';

/**
 * Encrypt payload
 */
function encryptPayload(data) {
  try {
    const jsonString = JSON.stringify(data);
    const encrypted = CryptoJS.AES.encrypt(jsonString, SECRET_KEY).toString();
    return { encrypted: encrypted };
  } catch (error) {
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt payload
 */
function decryptPayload(encryptedData) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY);
    const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
    
    if (!jsonString) {
      throw new Error('Decryption produced empty result');
    }
    
    return JSON.parse(jsonString);
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
}

module.exports = {
  encryptPayload,
  decryptPayload,
};
