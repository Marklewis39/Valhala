import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Edit, Trash2, Eye, EyeOff, 
  Package, AlertCircle, ChevronDown, ChevronUp, 
  DollarSign, TrendingUp, Clock
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import { CATEGORIES } from '../../utils/constants';
import ProductForm from './ProductForm';
import toast from 'react-hot-toast';

const ProductsManager = ({ products, onAddProduct, onUpdateProduct, onDeleteProduct, onUpdateStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [bulkAction, setBulkAction] = useState('');

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStock = stockFilter === 'all' || 
                        (stockFilter === 'low' && product.stock <= product.lowStockThreshold) ||
                        (stockFilter === 'out' && product.stock === 0) ||
                        (stockFilter === 'in' && product.stock > 0);
    return matchesSearch && matchesCategory && matchesStock;
  });

  // Statistics
  const stats = {
    total: products.length,
    totalValue: products.reduce((sum, p) => sum + (p.sellingPrice * p.stock), 0),
    lowStock: products.filter(p => p.stock <= p.lowStockThreshold).length,
    outOfStock: products.filter(p => p.stock === 0).length
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowProductForm(true);
  };

  const handleDeleteProduct = async (productId, productName) => {
    if (window.confirm(`Are you sure you want to delete ${productName}?`)) {
      await onDeleteProduct(productId);
      toast.success(`${productName} deleted successfully`);
    }
  };

  const handleBulkAction = async () => {
    if (bulkAction === 'delete') {
      if (window.confirm(`Delete ${selectedProducts.length} products?`)) {
        for (const productId of selectedProducts) {
          await onDeleteProduct(productId);
        }
        toast.success(`${selectedProducts.length} products deleted`);
        setSelectedProducts([]);
      }
    } else if (bulkAction === 'hide') {
      for (const productId of selectedProducts) {
        await onUpdateProduct(productId, { isAvailable: false });
      }
      toast.success(`${selectedProducts.length} products hidden`);
      setSelectedProducts([]);
    }
    setBulkAction('');
  };

  const toggleProductSelection = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Products</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Package size={24} className="text-valhala-accent" />
          </div>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Inventory Value</p>
              <p className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</p>
            </div>
            <DollarSign size={24} className="text-valhala-gold" />
          </div>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Low Stock Items</p>
              <p className={`text-2xl font-bold ${stats.lowStock > 0 ? 'text-yellow-500' : 'text-green-500'}`}>
                {stats.lowStock}
              </p>
            </div>
            <AlertCircle size={24} className="text-yellow-500" />
          </div>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Out of Stock</p>
              <p className={`text-2xl font-bold ${stats.outOfStock > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {stats.outOfStock}
              </p>
            </div>
            <TrendingUp size={24} className="text-red-500" />
          </div>
        </div>
      </div>

      {/* Header & Filters */}
      <div className="bg-valhala-secondary rounded-xl p-4">
        <div className="flex flex-wrap gap-4 justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Product Management</h2>
          <button
            onClick={() => {
              setEditingProduct(null);
              setShowProductForm(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add New Product
          </button>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-valhala-primary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-valhala-accent"
              />
            </div>
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg"
          >
            <option value="all">All Stock</option>
            <option value="in">In Stock</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
          </select>

          {selectedProducts.length > 0 && (
            <div className="flex gap-2">
              <select
                value={bulkAction}
                onChange={(e) => setBulkAction(e.target.value)}
                className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg"
              >
                <option value="">Bulk Actions</option>
                <option value="delete">Delete Selected</option>
                <option value="hide">Hide Selected</option>
              </select>
              <button
                onClick={handleBulkAction}
                disabled={!bulkAction}
                className="px-4 py-2 bg-valhala-accent text-white rounded-lg disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-gray-400 mt-4">{filteredProducts.length} products found</p>
      </div>

      {/* Products List */}
      <div className="bg-valhala-secondary rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-valhala-primary">
              <tr>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-700"
                  />
                </th>
                <th className="p-3 text-left">Product</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Buy Price</th>
                <th className="p-3 text-left">Sell Price</th>
                <th className="p-3 text-left">Profit</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <React.Fragment key={product.id}>
                  <tr className="border-t border-valhala-nordic hover:bg-valhala-primary/50 transition-colors">
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => toggleProductSelection(product.id)}
                        className="w-4 h-4 rounded border-gray-700"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img 
                          src={product.imageUrl || '/assets/images/product-placeholder.svg'} 
                          alt={product.name}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div>
                          <p className="font-semibold">{product.name}</p>
                          <p className="text-xs text-gray-400">{product.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="capitalize">{product.category}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-gray-400">{formatCurrency(product.buyPrice)}</span>
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-valhala-gold">{formatCurrency(product.sellingPrice)}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-green-500">+{formatCurrency(product.sellingPrice - product.buyPrice)}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${product.stock <= product.lowStockThreshold ? 'text-yellow-500' : 'text-green-500'}`}>
                          {product.stock}
                        </span>
                        {product.stock <= product.lowStockThreshold && (
                          <AlertCircle size={14} className="text-yellow-500" />
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {product.isAvailable ? (
                        <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Available</span>
                      ) : (
                        <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">Hidden</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="p-1 hover:bg-valhala-primary rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id, product.name)}
                          className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                        <button
                          onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                          className="p-1 hover:bg-valhala-primary rounded transition-colors"
                        >
                          {expandedProduct === product.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {/* Expanded Row */}
                  {expandedProduct === product.id && (
                    <tr className="bg-valhala-primary/50">
                      <td colSpan="9" className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-sm font-semibold mb-2">Description</p>
                            <p className="text-sm text-gray-400">{product.description}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-2">Details</p>
                            <p className="text-sm text-gray-400">Volume: {product.volume}ml</p>
                            <p className="text-sm text-gray-400">ABV: {product.alcoholPercentage}%</p>
                            <p className="text-sm text-gray-400">Total Sold: {product.totalSold || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm font-semibold mb-2">Quick Stock Update</p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onUpdateStock(product.id, product.stock + 10)}
                                className="px-3 py-1 bg-green-500/20 text-green-500 rounded text-sm"
                              >
                                +10
                              </button>
                              <button
                                onClick={() => onUpdateStock(product.id, product.stock - 10)}
                                disabled={product.stock < 10}
                                className="px-3 py-1 bg-red-500/20 text-red-500 rounded text-sm disabled:opacity-50"
                              >
                                -10
                              </button>
                              <button
                                onClick={() => onUpdateProduct(product.id, { isAvailable: !product.isAvailable })}
                                className="px-3 py-1 bg-valhala-accent/20 text-valhala-accent rounded text-sm"
                              >
                                {product.isAvailable ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-gray-600 mb-3" />
            <p className="text-gray-400">No products found</p>
          </div>
        )}
      </div>

      {/* Product Form Modal */}
      <ProductForm
        isOpen={showProductForm}
        onClose={() => {
          setShowProductForm(false);
          setEditingProduct(null);
        }}
        onSubmit={editingProduct ? onUpdateProduct : onAddProduct}
        initialData={editingProduct}
      />
    </div>
  );
};

export default ProductsManager;