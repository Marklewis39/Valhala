import { REGEX } from './constants';

// Validate email
export const isValidEmail = (email) => {
  if (!email) return false;
  return REGEX.EMAIL.test(email);
};

// Validate phone number
export const isValidPhone = (phone) => {
  if (!phone) return false;
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Kenyan phone numbers: 10-12 digits, starting with 0 or 254
  return cleaned.length >= 10 && cleaned.length <= 12;
};

// Format phone number to standard format
export const formatPhoneNumber = (phone) => {
  if (!phone) return '';
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+254${cleaned.substring(1)}`;
  }
  return `+254${cleaned}`;
};

// Validate password strength
export const isStrongPassword = (password) => {
  if (!password) return false;
  // At least 6 characters, contains letter and number
  return REGEX.PASSWORD.test(password);
};

// Validate name
export const isValidName = (name) => {
  if (!name) return false;
  return REGEX.NAME.test(name);
};

// Validate address
export const isValidAddress = (address) => {
  if (!address) return false;
  return address.trim().length >= 5;
};

// Validate price
export const isValidPrice = (price) => {
  const num = parseFloat(price);
  return !isNaN(num) && num >= 0;
};

// Validate quantity
export const isValidQuantity = (quantity, maxStock = Infinity) => {
  const num = parseInt(quantity);
  return !isNaN(num) && num >= 1 && num <= maxStock;
};

// Validate date
export const isValidDate = (date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d);
};

// Validate future date
export const isFutureDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) > new Date();
};

// Validate past date
export const isPastDate = (date) => {
  if (!isValidDate(date)) return false;
  return new Date(date) < new Date();
};

// Validate age (minimum 18 years)
export const isOfLegalAge = (birthDate) => {
  if (!isValidDate(birthDate)) return false;
  const today = new Date();
  const birth = new Date(birthDate);
  const age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

// Validate product stock
export const hasEnoughStock = (product, quantity) => {
  if (!product) return false;
  return product.stock >= quantity;
};

// Validate product availability
export const isProductAvailable = (product) => {
  if (!product) return false;
  return product.isAvailable && product.stock > 0;
};

// Validate promo code
export const isValidPromoCode = (code, validCodes) => {
  if (!code) return false;
  return validCodes.includes(code.toUpperCase());
};

// Validate delivery fee calculation
export const isValidDeliveryFee = (fee) => {
  const num = parseFloat(fee);
  return !isNaN(num) && num >= 0 && num <= 1000;
};

// Validate coordinates
export const isValidCoordinates = (lat, lng) => {
  return typeof lat === 'number' && 
         typeof lng === 'number' && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
};

// Validate object has required fields
export const hasRequiredFields = (obj, requiredFields) => {
  return requiredFields.every(field => {
    const value = obj[field];
    return value !== undefined && value !== null && value !== '';
  });
};

// Validate email domain
export const isValidEmailDomain = (email, allowedDomains) => {
  if (!isValidEmail(email)) return false;
  const domain = email.split('@')[1];
  return allowedDomains.includes(domain);
};

// Validate credit card number (Luhn algorithm)
export const isValidCreditCard = (cardNumber) => {
  const cleaned = cardNumber.replace(/\D/g, '');
  if (cleaned.length < 13 || cleaned.length > 19) return false;
  
  // Luhn algorithm
  let sum = 0;
  let isEven = false;
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned.charAt(i), 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

// Validate expiry date (MM/YY format)
export const isValidExpiryDate = (expiryDate) => {
  if (!expiryDate) return false;
  const [month, year] = expiryDate.split('/');
  if (!month || !year) return false;
  
  const monthNum = parseInt(month);
  const yearNum = parseInt(year);
  const currentYear = new Date().getFullYear() % 100;
  const currentMonth = new Date().getMonth() + 1;
  
  if (monthNum < 1 || monthNum > 12) return false;
  if (yearNum < currentYear) return false;
  if (yearNum === currentYear && monthNum < currentMonth) return false;
  
  return true;
};

// Validate CVV
export const isValidCVV = (cvv, cardType = 'visa') => {
  const cleaned = cvv.replace(/\D/g, '');
  if (cardType === 'amex') {
    return cleaned.length === 4;
  }
  return cleaned.length === 3;
};

// Validate ZIP/Postal code
export const isValidPostalCode = (postalCode, country = 'KE') => {
  if (!postalCode) return false;
  if (country === 'KE') {
    // Kenyan postal codes are 5 digits
    return /^\d{5}$/.test(postalCode);
  }
  return postalCode.trim().length >= 3;
};

// Validate URL
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Validate image URL
export const isValidImageUrl = (url) => {
  if (!isValidUrl(url)) return false;
  return /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url);
};

// Validate rating (1-5)
export const isValidRating = (rating) => {
  const num = parseFloat(rating);
  return !isNaN(num) && num >= 1 && num <= 5;
};

// Validate order status transition
export const isValidStatusTransition = (currentStatus, newStatus) => {
  const validTransitions = {
    pending_payment: ['awaiting_driver', 'cancelled'],
    awaiting_driver: ['picked_up', 'cancelled'],
    picked_up: ['en_route'],
    en_route: ['delivered'],
    delivered: [],
    cancelled: []
  };
  
  return validTransitions[currentStatus]?.includes(newStatus) || false;
};

// Validate user role
export const isValidRole = (role) => {
  const validRoles = ['customer', 'driver', 'admin'];
  return validRoles.includes(role);
};

// Validate file type
export const isValidFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};

// Validate file size
export const isValidFileSize = (file, maxSizeMB = 5) => {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
};

// Validate form data with custom rules
export const validateForm = (data, rules) => {
  const errors = {};
  
  Object.keys(rules).forEach(field => {
    const value = data[field];
    const fieldRules = rules[field];
    
    // Required validation
    if (fieldRules.required && (!value || value === '')) {
      errors[field] = fieldRules.requiredMessage || `${field} is required`;
      return;
    }
    
    // Custom validation function
    if (fieldRules.validate && !fieldRules.validate(value, data)) {
      errors[field] = fieldRules.message || `Invalid ${field}`;
    }
    
    // Min length validation
    if (fieldRules.minLength && value && value.length < fieldRules.minLength) {
      errors[field] = fieldRules.minLengthMessage || `${field} must be at least ${fieldRules.minLength} characters`;
    }
    
    // Max length validation
    if (fieldRules.maxLength && value && value.length > fieldRules.maxLength) {
      errors[field] = fieldRules.maxLengthMessage || `${field} must be at most ${fieldRules.maxLength} characters`;
    }
    
    // Pattern validation
    if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
      errors[field] = fieldRules.patternMessage || `Invalid ${field} format`;
    }
  });
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};