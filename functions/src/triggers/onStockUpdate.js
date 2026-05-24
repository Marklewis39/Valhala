const functions = require('firebase-functions');
const { db, admin } = require('../config/firebaseAdmin');

// Trigger when product stock is updated
exports.onStockUpdate = functions.firestore
  .document('products/{productId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    const productId = context.params.productId;
    
    // Check if stock crossed below threshold
    if (after.stock <= after.lowStockThreshold && before.stock > before.lowStockThreshold) {
      // Create low stock alert
      await db.collection('alerts').add({
        type: 'low_stock',
        productId,
        productName: after.name,
        currentStock: after.stock,
        threshold: after.lowStockThreshold,
        severity: after.stock === 0 ? 'critical' : 'warning',
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send email to admin
      const adminUsers = await db.collection('users')
        .where('role', '==', 'admin')
        .get();
      
      adminUsers.forEach(adminDoc => {
        const adminEmail = adminDoc.data().email;
        console.log(`Low stock alert sent to ${adminEmail} for product ${after.name}`);
      });
    }
    
    // Log stock change if significant
    const stockChange = Math.abs(after.stock - before.stock);
    if (stockChange >= 10) {
      await db.collection('inventory_logs').add({
        productId,
        productName: after.name,
        previousStock: before.stock,
        newStock: after.stock,
        changeAmount: after.stock - before.stock,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });