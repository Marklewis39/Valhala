import { 
  db, collection, getDocs, getDoc, doc, query, where, orderBy, limit,
  addDoc, updateDoc, deleteDoc, onSnapshot, increment, Timestamp,
  writeBatch
} from './firebase';

const COLLECTION = 'products';

// Get all products with optional filters
export const getProducts = async (filters = {}) => {
  try {
    let constraints = [];
    
    if (filters.category && filters.category !== 'all') {
      constraints.push(where('category', '==', filters.category));
    }
    
    if (filters.isAvailable !== undefined) {
      constraints.push(where('isAvailable', '==', filters.isAvailable));
    }
    
    if (filters.minPrice) {
      constraints.push(where('sellingPrice', '>=', filters.minPrice));
    }
    
    if (filters.maxPrice) {
      constraints.push(where('sellingPrice', '<=', filters.maxPrice));
    }
    
    constraints.push(orderBy('name'));
    
    const q = query(collection(db, COLLECTION), ...constraints);
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products:', error);
    throw error;
  }
};

// Get single product by ID
export const getProductById = async (productId) => {
  try {
    const docRef = doc(db, COLLECTION, productId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting product:', error);
    throw error;
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('category', '==', category),
      where('isAvailable', '==', true),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting products by category:', error);
    throw error;
  }
};

// Search products by name or brand
export const searchProducts = async (searchTerm) => {
  try {
    // Note: For better search, consider using Algolia or Meilisearch
    const q = query(
      collection(db, COLLECTION),
      where('isAvailable', '==', true),
      orderBy('name'),
      limit(50)
    );
    const snapshot = await getDocs(q);
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Filter client-side for search
    const term = searchTerm.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(term) ||
      product.brand?.toLowerCase().includes(term)
    );
  } catch (error) {
    console.error('Error searching products:', error);
    throw error;
  }
};

// Add new product (admin only)
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION), {
      ...productData,
      totalSold: 0,
      totalRevenue: 0,
      totalProfit: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...productData };
  } catch (error) {
    console.error('Error adding product:', error);
    throw error;
  }
};

// Update product (admin only)
export const updateProduct = async (productId, updateData) => {
  try {
    const productRef = doc(db, COLLECTION, productId);
    await updateDoc(productRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
    return true;
  } catch (error) {
    console.error('Error updating product:', error);
    throw error;
  }
};

// Update product stock
export const updateProductStock = async (productId, newStock) => {
  try {
    const productRef = doc(db, COLLECTION, productId);
    const product = await getDoc(productRef);
    const currentStock = product.data()?.stock || 0;
    
    await updateDoc(productRef, {
      stock: newStock,
      isAvailable: newStock > 0,
      updatedAt: Timestamp.now()
    });
    
    // Log stock change
    await addDoc(collection(db, 'inventory_logs'), {
      productId,
      previousStock: currentStock,
      newStock,
      changeAmount: newStock - currentStock,
      timestamp: Timestamp.now()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating stock:', error);
    throw error;
  }
};

// Delete product (admin only)
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, COLLECTION, productId));
    return true;
  } catch (error) {
    console.error('Error deleting product:', error);
    throw error;
  }
};

// Bulk update products (admin only)
export const bulkUpdateProducts = async (updates) => {
  const batch = writeBatch(db);
  
  updates.forEach(update => {
    const productRef = doc(db, COLLECTION, update.id);
    batch.update(productRef, update.data);
  });
  
  await batch.commit();
  return true;
};

// Real-time products listener
export const listenToProducts = (callback, filters = {}) => {
  let constraints = [];
  
  if (filters.category && filters.category !== 'all') {
    constraints.push(where('category', '==', filters.category));
  }
  
  if (filters.isAvailable !== undefined) {
    constraints.push(where('isAvailable', '==', filters.isAvailable));
  }
  
  constraints.push(orderBy('name'));
  
  const q = query(collection(db, COLLECTION), ...constraints);
  
  return onSnapshot(q, (snapshot) => {
    const products = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    callback(products);
  }, (error) => {
    console.error('Error listening to products:', error);
  });
};

// Get low stock products
export const getLowStockProducts = async (threshold = 10) => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('stock', '<=', threshold),
      where('isAvailable', '==', true),
      orderBy('stock', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting low stock products:', error);
    throw error;
  }
};

// Get out of stock products
export const getOutOfStockProducts = async () => {
  try {
    const q = query(
      collection(db, COLLECTION),
      where('stock', '==', 0),
      orderBy('name')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting out of stock products:', error);
    throw error;
  }
};