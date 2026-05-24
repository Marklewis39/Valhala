const functions = require('firebase-functions');
const { db, admin } = require('../config/firebaseAdmin');

/**
 * Add a new product to the inventory
 * Admin only function
 */
exports.addProduct = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  // Extract product data
  const {
    name,
    brand,
    category,
    description,
    buyPrice,
    sellingPrice,
    stock,
    lowStockThreshold,
    alcoholPercentage,
    volume,
    imageUrl,
    isAvailable
  } = data;
  
  // Validation
  if (!name || name.trim() === '') {
    throw new functions.https.HttpsError('invalid-argument', 'Product name is required');
  }
  
  if (!sellingPrice || sellingPrice <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid selling price is required');
  }
  
  if (!buyPrice || buyPrice <= 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Valid buy price is required');
  }
  
  if (buyPrice >= sellingPrice) {
    throw new functions.https.HttpsError('invalid-argument', 'Selling price must be higher than buy price');
  }
  
  if (!category) {
    throw new functions.https.HttpsError('invalid-argument', 'Category is required');
  }
  
  try {
    // Prepare product data
    const productData = {
      name: name.trim(),
      brand: brand?.trim() || '',
      category: category.toLowerCase(),
      description: description?.trim() || '',
      buyPrice: parseFloat(buyPrice),
      sellingPrice: parseFloat(sellingPrice),
      stock: parseInt(stock) || 0,
      lowStockThreshold: parseInt(lowStockThreshold) || 10,
      alcoholPercentage: parseFloat(alcoholPercentage) || 0,
      volume: parseInt(volume) || 0,
      imageUrl: imageUrl || '',
      isAvailable: isAvailable !== undefined ? isAvailable : (parseInt(stock) || 0) > 0,
      totalSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      views: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
      updatedBy: context.auth.uid
    };
    
    // Add product to Firestore
    const productRef = await db.collection('products').add(productData);
    
    // Log the action
    await db.collection('admin_logs').add({
      action: 'add_product',
      adminId: context.auth.uid,
      adminEmail: userDoc.data().email,
      productId: productRef.id,
      productName: name,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Return success response
    return {
      success: true,
      message: 'Product added successfully',
      productId: productRef.id,
      product: {
        id: productRef.id,
        ...productData
      }
    };
    
  } catch (error) {
    console.error('Error adding product:', error);
    throw new functions.https.HttpsError('internal', 'Failed to add product: ' + error.message);
  }
});

/**
 * Update an existing product
 */
exports.updateProduct = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { productId, updates } = data;
  
  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Product ID is required');
  }
  
  try {
    // Check if product exists
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Product not found');
    }
    
    // Prepare updates
    const updateData = {
      ...updates,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    };
    
    // If stock is being updated, check availability
    if (updates.stock !== undefined) {
      updateData.isAvailable = updates.stock > 0;
    }
    
    // If selling price is being updated, ensure it's higher than buy price
    if (updates.sellingPrice !== undefined && productDoc.data().buyPrice) {
      if (updates.sellingPrice <= productDoc.data().buyPrice) {
        throw new functions.https.HttpsError('invalid-argument', 'Selling price must be higher than buy price');
      }
    }
    
    // Update product
    await productRef.update(updateData);
    
    // Log the action
    await db.collection('admin_logs').add({
      action: 'update_product',
      adminId: context.auth.uid,
      adminEmail: userDoc.data().email,
      productId,
      productName: productDoc.data().name,
      updates: Object.keys(updates),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: 'Product updated successfully'
    };
    
  } catch (error) {
    console.error('Error updating product:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update product: ' + error.message);
  }
});

/**
 * Delete a product (soft delete)
 */
exports.deleteProduct = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in');
  }
  
  // Verify admin role
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  const userRole = userDoc.data()?.role;
  
  if (userRole !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Admin access required');
  }
  
  const { productId, hardDelete = false } = data;
  
  if (!productId) {
    throw new functions.https.HttpsError('invalid-argument', 'Product ID is required');
  }
  
  try {
    const productRef = db.collection('products').doc(productId);
    const productDoc = await productRef.get();
    
    if (!productDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Product not found');
    }
    
    if (hardDelete) {
      // Hard delete - remove completely
      await productRef.delete();
    } else {
      // Soft delete - mark as unavailable
      await productRef.update({
        isAvailable: false,
        deletedAt: admin.firestore.FieldValue.serverTimestamp(),
        deletedBy: context.auth.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // Log the action
    await db.collection('admin_logs').add({
      action: hardDelete ? 'hard_delete_product' : 'soft_delete_product',
      adminId: context.auth.uid,
      adminEmail: userDoc.data().email,
      productId,
      productName: productDoc.data().name,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return {
      success: true,
      message: hardDelete ? 'Product permanently deleted' : 'Product has been removed from sale'
    };
    
  } catch (error) {
    console.error('Error deleting product:', error);
    throw new functions.https.HttpsError('internal', 'Failed to delete product: ' + error.message);
  }
});