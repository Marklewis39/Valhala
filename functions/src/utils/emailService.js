// Email service (using SendGrid or similar)
// For prototype, this will log emails instead of sending

const sendEmail = async (to, subject, template, data = {}) => {
  // In production, integrate with SendGrid, Mailgun, or similar
  console.log(`
    ========================================
    EMAIL SENT (Production would send actual email)
    To: ${to}
    Subject: ${subject}
    Template: ${template}
    Data: ${JSON.stringify(data, null, 2)}
    ========================================
  `);
  
  // For prototype, return success
  return { success: true };
};

// Send order confirmation email
const sendOrderConfirmation = async (email, orderId, items, total) => {
  const subject = `Order Confirmation #${orderId.slice(-8)} - Valhala`;
  const template = 'order_confirmation';
  const data = {
    orderId,
    items,
    total,
    date: new Date().toISOString()
  };
  
  return sendEmail(email, subject, template, data);
};

// Send payment receipt email
const sendPaymentReceipt = async (email, orderId, amount, transactionId) => {
  const subject = `Payment Receipt for Order #${orderId.slice(-8)} - Valhala`;
  const template = 'payment_receipt';
  const data = {
    orderId,
    amount,
    transactionId,
    date: new Date().toISOString()
  };
  
  return sendEmail(email, subject, template, data);
};

// Send delivery update email
const sendDeliveryUpdate = async (email, orderId, status, eta = null) => {
  const subject = `Delivery Update for Order #${orderId.slice(-8)} - Valhala`;
  const template = 'delivery_update';
  const data = {
    orderId,
    status,
    eta,
    date: new Date().toISOString()
  };
  
  return sendEmail(email, subject, template, data);
};

// Send welcome email to new driver
const sendDriverWelcomeEmail = async (email, name, password) => {
  const subject = 'Welcome to Valhala Delivery Team!';
  const template = 'driver_welcome';
  const data = {
    name,
    email,
    temporaryPassword: password,
    loginUrl: 'https://valhala.com/driver/login'
  };
  
  return sendEmail(email, subject, template, data);
};

// Send low stock alert email
const sendLowStockAlert = async (adminEmail, productName, currentStock) => {
  const subject = `Low Stock Alert: ${productName}`;
  const template = 'low_stock_alert';
  const data = {
    productName,
    currentStock,
    date: new Date().toISOString()
  };
  
  return sendEmail(adminEmail, subject, template, data);
};

// Send issue response email
const sendIssueResponse = async (email, issueId, response) => {
  const subject = `Response to Your Issue #${issueId.slice(-8)} - Valhala Support`;
  const template = 'issue_response';
  const data = {
    issueId,
    response,
    date: new Date().toISOString()
  };
  
  return sendEmail(email, subject, template, data);
};

module.exports = {
  sendEmail,
  sendOrderConfirmation,
  sendPaymentReceipt,
  sendDeliveryUpdate,
  sendDriverWelcomeEmail,
  sendLowStockAlert,
  sendIssueResponse
};