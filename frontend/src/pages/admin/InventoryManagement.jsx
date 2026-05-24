import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import ProductsManager from '../../components/admin/ProductsManager';
import StockAlert from '../../components/admin/StockAlert';
import { db, collection, getDocs, doc, updateDoc, addDoc, deleteDoc, Timestamp } from '../../services/firebase';
import { Package, TrendingUp, TrendingDown, AlertCircle, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';

const InventoryManagement = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'products'));
      const productsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProducts(productsData);
      
      // Calculate stats
      const totalValue = productsData.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0);
      const lowStockCount = productsData.filter(p => p.stock <= p.lowStockThreshold && p.stock > 0).length;
      const outOfStockCount = productsData.filter(p => p.stock === 0).length;
      
      setStats({
        totalProducts: productsData.length,
        totalValue,
        lowStockCount,
        outOfStockCount
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      await addDoc(collection(db, 'products'), {
        ...productData,
        totalSold: 0,
        totalRevenue: 0,
        totalProfit: 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchProducts();
      toast.success('Product added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add product');
    }
  };

  const handleUpdateProduct = async (productData, productId) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        ...productData,
        updatedAt: Timestamp.now()
      });
      await fetchProducts();
      toast.success('Product updated successfully');
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Failed to update product');
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      await fetchProducts();
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      const productRef = doc(db, 'products', productId);
      const product = products.find(p => p.id === productId);
      
      await updateDoc(productRef, {
        stock: newStock,
        isAvailable: newStock > 0,
        updatedAt: Timestamp.now()
      });
      
      // Log stock change
      await addDoc(collection(db, 'inventory_logs'), {
        productId,
        productName: product?.name,
        previousStock: product?.stock,
        newStock,
        changeAmount: newStock - (product?.stock || 0),
        reason: 'admin_update',
        timestamp: Timestamp.now()
      });
      
      await fetchProducts();
      toast.success('Stock updated successfully');
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-valhala-dark">
        <AdminSidebar />
        <div className="flex-1 ml-64">
          <AdminHeader />
          <div className="p-6 flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-valhala-dark">
      <AdminSidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <AdminHeader />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Inventory Management</h1>
            <p className="text-gray-400 mt-1">Manage products, track stock levels, and update pricing</p>
          </div>

          {/* Stock Alerts */}
          <StockAlert products={products} onUpdateStock={handleUpdateStock} />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-valhala-secondary rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Package size={20} className="text-valhala-accent" />
                <span className="text-xs text-gray-400">Total SKUs</span>
              </div>
              <p className="text-2xl font-bold">{stats.totalProducts}</p>
              <p className="text-xs text-gray-400">Active products</p>
            </div>
            
            <div className="bg-valhala-secondary rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign size={20} className="text-valhala-gold" />
                <span className="text-xs text-gray-400">Inventory Value</span>
              </div>
              <p className="text-2xl font-bold text-valhala-gold">
                KSh {stats.totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">At selling price</p>
            </div>
            
            <div className="bg-valhala-secondary rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingDown size={20} className="text-yellow-500" />
                <span className="text-xs text-gray-400">Low Stock</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500">{stats.lowStockCount}</p>
              <p className="text-xs text-gray-400">Below threshold</p>
            </div>
            
            <div className="bg-valhala-secondary rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle size={20} className="text-red-500" />
                <span className="text-xs text-gray-400">Out of Stock</span>
              </div>
              <p className="text-2xl font-bold text-red-500">{stats.outOfStockCount}</p>
              <p className="text-xs text-gray-400">Need restocking</p>
            </div>
          </div>

          {/* Products Manager */}
          <ProductsManager
            products={products}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateStock={handleUpdateStock}
          />
        </main>
      </div>
    </div>
  );
};

export default InventoryManagement;