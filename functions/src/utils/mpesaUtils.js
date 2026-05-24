// M-Pesa utility functions
const crypto = require('crypto');

// Generate password for STK push
const generatePassword = (shortcode, passkey, timestamp) => {
  const str = `${shortcode}${passkey}${timestamp}`;
  return Buffer.from(str).toString('base64');
};

// Format phone number for M-Pesa
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Remove leading 0 or +254
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('254')) {
    cleaned = cleaned;
  } else if (cleaned.startsWith('+254')) {
    cleaned = cleaned.substring(1);
  }
  
  return cleaned;
};

// Validate M-Pesa response
const validateMpesaResponse = (response) => {
  if (!response) return false;
  
  const requiredFields = ['ResponseCode', 'ResponseDescription', 'MerchantRequestID', 'CheckoutRequestID'];
  return requiredFields.every(field => response[field] !== undefined);
};

// Parse M-Pesa callback metadata
const parseCallbackMetadata = (metadata) => {
  const result = {};
  if (metadata && metadata.Item) {
    metadata.Item.forEach(item => {
      result[item.Name] = item.Value;
    });
  }
  return result;
};

// Generate unique transaction ID
const generateTransactionId = (prefix = 'TXN') => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${timestamp}${random}`;
};

module.exports = {
  generatePassword,
  formatPhoneNumber,
  validateMpesaResponse,
  parseCallbackMetadata,
  generateTransactionId
};