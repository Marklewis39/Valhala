// App Constants
export const APP_NAME = 'Valhala';
export const APP_TAGLINE = 'Premium Alcohol Delivery';
export const COMPANY_EMAIL = 'support@valhala.com';
export const COMPANY_PHONE = '+254 700 123 456';
export const COMPANY_ADDRESS = 'Nairobi, Kenya';

// Categories
export const CATEGORIES = [
  { id: 'all', name: 'All Drinks', icon: '🍺', color: 'gray' },
  { id: 'whiskey', name: 'Whiskey', icon: '🥃', color: 'amber' },
  { id: 'beer', name: 'Beer', icon: '🍺', color: 'yellow' },
  { id: 'wine', name: 'Wine', icon: '🍷', color: 'purple' },
  { id: 'gin', name: 'Gin', icon: '🍸', color: 'emerald' },
  { id: 'vodka', name: 'Vodka', icon: '🍹', color: 'blue' },
  { id: 'scotch', name: 'Scotch', icon: '🥃', color: 'brown' },
  { id: 'cocktails', name: 'Cocktails', icon: '🍹', color: 'pink' }
];

// Order Status
export const ORDER_STATUS = {
  PENDING_PAYMENT: 'pending_payment',
  AWAITING_DRIVER: 'awaiting_driver',
  PICKED_UP: 'picked_up',
  EN_ROUTE: 'en_route',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.PENDING_PAYMENT]: { label: 'Pending Payment', color: 'yellow', icon: 'clock' },
  [ORDER_STATUS.AWAITING_DRIVER]: { label: 'Awaiting Driver', color: 'purple', icon: 'user' },
  [ORDER_STATUS.PICKED_UP]: { label: 'Picked Up', color: 'blue', icon: 'package' },
  [ORDER_STATUS.EN_ROUTE]: { label: 'En Route', color: 'orange', icon: 'truck' },
  [ORDER_STATUS.DELIVERED]: { label: 'Delivered', color: 'green', icon: 'check' },
  [ORDER_STATUS.CANCELLED]: { label: 'Cancelled', color: 'red', icon: 'x' }
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PAID_ON_DELIVERY: 'paid_on_delivery'
};

// Payment Methods
export const PAYMENT_METHODS = {
  MPESA: 'mpesa',
  CARD: 'card',
  CASH_ON_DELIVERY: 'cash_on_delivery'
};

// Issue Types
export const ISSUE_TYPES = [
  { id: 'delivery_failed', label: 'Delivery Failed', priority: 'high', icon: 'x-circle' },
  { id: 'delayed', label: 'Order Took Too Long', priority: 'medium', icon: 'clock' },
  { id: 'price_discrepancy', label: 'Exaggerated Prices', priority: 'medium', icon: 'dollar-sign' },
  { id: 'wrong_item', label: 'Wrong Item Delivered', priority: 'high', icon: 'package-x' },
  { id: 'damaged_item', label: 'Damaged Item', priority: 'high', icon: 'alert-triangle' },
  { id: 'driver_issue', label: 'Driver Issue', priority: 'medium', icon: 'user-x' },
  { id: 'other', label: 'Other Issue', priority: 'low', icon: 'help-circle' }
];

// Delivery Configuration
export const DELIVERY_CONFIG = {
  BASE_FEE: 100,
  FEE_PER_KM: 50,
  MAX_FEE: 500,
  FREE_DELIVERY_THRESHOLD: 5000,
  DISTRIBUTION_CENTERS: [
    { name: 'Valhala Main Depot', lat: -1.2921, lng: 36.8219, address: 'CBD, Nairobi' },
    { name: 'Westlands Hub', lat: -1.2675, lng: 36.8037, address: 'Westlands, Nairobi' },
    { name: 'Eastlands Hub', lat: -1.2833, lng: 36.8333, address: 'Eastlands, Nairobi' }
  ]
};

// User Roles
export const USER_ROLES = {
  CUSTOMER: 'customer',
  DRIVER: 'driver',
  ADMIN: 'admin'
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100]
};

// File Upload
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ACCEPTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  MAX_FILES: 5
};

// Timeouts
export const TIMEOUTS = {
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  OTP_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  ORDER_CANCELLATION: 5 * 60 * 1000 // 5 minutes
};

// Regex Patterns
export const REGEX = {
  EMAIL: /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/,
  PHONE: /^\+?[0-9]{10,12}$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
  NAME: /^[a-zA-Z\s]{2,50}$/,
  ZIP_CODE: /^\d{5}$/
};

// Map Settings
export const MAP_CONFIG = {
  DEFAULT_CENTER: [-1.2921, 36.8219],
  DEFAULT_ZOOM: 13,
  MIN_ZOOM: 10,
  MAX_ZOOM: 18,
  TILE_LAYER: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
};

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'valhala_auth_token',
  CART: 'valhala_cart',
  USER_PREFERENCES: 'valhala_preferences',
  RECENT_SEARCHES: 'valhala_recent_searches'
};

// API Endpoints (for future use)
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
    LOGOUT: '/api/auth/logout'
  },
  PRODUCTS: {
    BASE: '/api/products',
    CATEGORY: '/api/products/category',
    SEARCH: '/api/products/search'
  },
  ORDERS: {
    BASE: '/api/orders',
    TRACK: '/api/orders/track'
  }
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  SERVER_ERROR: 'Server error. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  PAYMENT_FAILED: 'Payment failed. Please try again.',
  OUT_OF_STOCK: 'This product is out of stock.',
  INSUFFICIENT_STOCK: 'Insufficient stock available.',
  INVALID_PROMO: 'Invalid promo code.',
  LOCATION_DENIED: 'Location access denied. Please enable location services.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN: 'Welcome back!',
  REGISTER: 'Account created successfully!',
  ORDER_PLACED: 'Order placed successfully!',
  PAYMENT_SUCCESS: 'Payment successful!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  CART_UPDATED: 'Cart updated successfully!'
};