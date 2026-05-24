const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

// Export configuration
exports.config = {
  // M-Pesa configuration
  mpesa: {
    consumerKey: functions.config().mpesa?.consumer_key || process.env.MPESA_CONSUMER_KEY,
    consumerSecret: functions.config().mpesa?.consumer_secret || process.env.MPESA_CONSUMER_SECRET,
    shortcode: functions.config().mpesa?.shortcode || process.env.MPESA_SHORTCODE || '174379',
    passkey: functions.config().mpesa?.passkey || process.env.MPESA_PASSKEY,
    environment: functions.config().mpesa?.environment || process.env.MPESA_ENVIRONMENT || 'sandbox'
  },
  
  // Email configuration
  email: {
    sendgridApiKey: functions.config().email?.sendgrid_api_key || process.env.SENDGRID_API_KEY,
    fromEmail: functions.config().email?.from_email || process.env.FROM_EMAIL || 'noreply@valhala.com'
  },
  
  // Google Maps configuration
  maps: {
    apiKey: functions.config().maps?.api_key || process.env.GOOGLE_MAPS_API_KEY
  }
};

// ============================================
// API FUNCTIONS (HTTP Callable)
// ============================================

// Admin functions
exports.createDriver = require('./admin').createDriver;
exports.fireDriver = require('./admin').fireDriver;
exports.activateDriver = require('./admin').activateDriver;
exports.getAllDrivers = require('./admin').getAllDrivers;
exports.addProduct = require('./admin').addProduct;
exports.updateProduct = require('./admin').updateProduct;
exports.updateStock = require('./admin').updateStock;
exports.updateOrderStatus = require('./admin').updateOrderStatus;
exports.assignDriver = require('./admin').assignDriver;
exports.resolveIssue = require('./admin').resolveIssue;
exports.getAnalytics = require('./admin').getAnalytics;
exports.getProfitLoss = require('./admin').getProfitLoss;
exports.getDashboardStats = require('./admin').getDashboardStats;

// M-Pesa functions
exports.mpesaStkPush = require('./mpesa').stkPush;
exports.mpesaStkPushQuery = require('./mpesa').stkPushQuery;
exports.mpesaCallback = require('./mpesa').callback;

// Order functions
exports.createOrder = require('./orders').createOrder;
exports.getOrder = require('./orders').getOrder;
exports.getUserOrders = require('./orders').getUserOrders;
exports.cancelOrder = require('./orders').cancelOrder;

// Tracking functions
exports.updateDriverLocation = require('./tracking').updateDriverLocation;
exports.getDriverLocation = require('./tracking').getDriverLocation;
exports.calculateETA = require('./tracking').calculateETA;
exports.getNearbyDrivers = require('./tracking').getNearbyDrivers;

// ============================================
// TRIGGERS (Firestore Triggers)
// ============================================

// Order triggers
exports.onOrderCreate = require('./triggers/onOrderCreate').handler;
exports.onOrderUpdate = require('./triggers/onOrderCreate').onUpdate;

// Payment triggers
exports.onPaymentComplete = require('./triggers/onPaymentComplete').handler;

// Driver triggers
exports.onDriverLocationUpdate = require('./triggers/onDriverLocationUpdate').handler;

// Stock triggers
exports.onStockUpdate = require('./triggers/onStockUpdate').handler;
exports.onLowStockAlert = require('./triggers/onStockUpdate').onLowStock;

// ============================================
// SCHEDULED FUNCTIONS (Cron Jobs)
// ============================================

// Daily profit/loss calculation
exports.calculateDailyProfitLoss = functions.pubsub
  .schedule('0 0 * * *') // Run at midnight every day
  .timeZone('Africa/Nairobi')
  .onRun(async (context) => {
    const calculators = require('./utils/calculators');
    await calculators.calculateDailyProfitLoss();
    console.log('Daily profit/loss calculated successfully');
  });

// Weekly report generation
exports.generateWeeklyReport = functions.pubsub
  .schedule('0 0 * * 1') // Run at midnight every Monday
  .timeZone('Africa/Nairobi')
  .onRun(async (context) => {
    const emailService = require('./utils/emailService');
    await emailService.sendWeeklyReport();
    console.log('Weekly report sent successfully');
  });

// Cleanup old data (run weekly)
exports.cleanupOldData = functions.pubsub
  .schedule('0 2 * * 0') // Run at 2 AM every Sunday
  .timeZone('Africa/Nairobi')
  .onRun(async (context) => {
    const cleanup = require('./utils/cleanup');
    await cleanup.removeOldNotifications(90); // Remove notifications older than 90 days
    await cleanup.archiveOldOrders(365); // Archive orders older than 365 days
    console.log('Old data cleanup completed');
  });

// Check low stock alerts (every 6 hours)
exports.checkLowStock = functions.pubsub
  .schedule('0 */6 * * *') // Run every 6 hours
  .timeZone('Africa/Nairobi')
  .onRun(async (context) => {
    const stockTrigger = require('./triggers/onStockUpdate');
    await stockTrigger.checkAllProducts();
    console.log('Low stock check completed');
  });

// ============================================
// HTTP FUNCTIONS (REST API Endpoints)
// ============================================

// M-Pesa callback endpoint (needs to be HTTP)
exports.mpesaCallbackEndpoint = functions.https.onRequest(async (req, res) => {
  try {
    const mpesa = require('./mpesa');
    await mpesa.handleCallback(req.body);
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Success' });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(200).json({ ResultCode: 1, ResultDesc: 'Failed' });
  }
});

// Webhook for delivery status updates
exports.deliveryWebhook = functions.https.onRequest(async (req, res) => {
  // Verify webhook secret
  const secret = req.headers['x-webhook-secret'];
  if (secret !== functions.config().webhook?.secret) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  
  try {
    const { orderId, status, location } = req.body;
    const tracking = require('./tracking');
    await tracking.updateDeliveryStatus(orderId, status, location);
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
exports.healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    functions: {
      admin: true,
      mpesa: true,
      orders: true,
      tracking: true,
      triggers: true
    }
  });
});

// ============================================
// UTILITY EXPORTS
// ============================================

// Export utils for use in other functions
exports.mpesaUtils = require('./utils/mpesaUtils');
exports.calculators = require('./utils/calculators');
exports.emailService = require('./utils/emailService');
exports.geoUtils = require('./utils/geoUtils');
exports.notificationService = require('./utils/notificationService');

// ============================================
// ERROR HANDLING
// ============================================

// Global error handler for all functions
process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export Firebase admin instance for use in other files
exports.admin = admin;
exports.db = admin.firestore();
exports.auth = admin.auth();