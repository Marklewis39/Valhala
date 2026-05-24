import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { CATEGORIES } from '../../utils/constants';
import toast from 'react-hot-toast';

const ProductForm = ({ isOpen, onClose, onSubmit, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    category: 'whiskey',
    description: '',
    buyPrice: '',
    sellingPrice: '',
    stock: '',
    lowStockThreshold: '10',
    alcoholPercentage: '',
    volume: '',
    imageUrl: '',
    isAvailable: true
  });

  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        brand: initialData.brand || '',
        category: initialData.category || 'whiskey',
        description: initialData.description || '',
        buyPrice: initialData.buyPrice || '',
        sellingPrice: initialData.sellingPrice || '',
        stock: initialData.stock || '',
        lowStockThreshold: initialData.lowStockThreshold || '10',
        alcoholPercentage: initialData.alcoholPercentage || '',
        volume: initialData.volume || '',
        imageUrl: initialData.imageUrl || '',
        isAvailable: initialData.isAvailable !== false
      });
      setImagePreview(initialData.imageUrl || '');
    } else {
      setFormData({
        name: '',
        brand: '',
        category: 'whiskey',
        description: '',
        buyPrice: '',
        sellingPrice: '',
        stock: '',
        lowStockThreshold: '10',
        alcoholPercentage: '',
        volume: '',
        imageUrl: '',
        isAvailable: true
      });
      setImagePreview('');
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (!formData.sellingPrice || formData.sellingPrice <= 0) {
      toast.error('Valid selling price is required');
      return;
    }
    if (!formData.buyPrice || formData.buyPrice <= 0) {
      toast.error('Valid buy price is required');
      return;
    }
    if (formData.buyPrice >= formData.sellingPrice) {
      toast.error('Selling price must be higher than buy price');
      return;
    }

    setLoading(true);
    
    // Simulate image upload
    let imageUrl = formData.imageUrl;
    if (imageFile) {
      // In production, upload to Firebase Storage here
      imageUrl = URL.createObjectURL(imageFile);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    const productData = {
      ...formData,
      buyPrice: parseFloat(formData.buyPrice),
      sellingPrice: parseFloat(formData.sellingPrice),
      stock: parseInt(formData.stock) || 0,
      lowStockThreshold: parseInt(formData.lowStockThreshold),
      alcoholPercentage: parseFloat(formData.alcoholPercentage),
      volume: parseInt(formData.volume),
      imageUrl,
      isAvailable: formData.stock > 0 ? formData.isAvailable : false
    };
    
    await onSubmit(productData, initialData?.id);
    setLoading(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-valhala-secondary rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-valhala-secondary border-b border-valhala-nordic p-4 flex justify-between items-center">
                <h2 className="text-xl font-bold">
                  {initialData ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={onClose} className="p-2 hover:bg-valhala-primary rounded-lg">
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Image
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-24 bg-valhala-primary rounded-lg overflow-hidden flex items-center justify-center">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon size={32} className="text-gray-600" />
                      )}
                    </div>
                    <label className="cursor-pointer px-4 py-2 bg-valhala-primary rounded-lg hover:bg-valhala-nordic transition-colors">
                      <Upload size={18} className="inline mr-2" />
                      Upload Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="input-primary"
                      required
                    />
                  </div>

                  {/* Brand */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Brand
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className="input-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="input-primary"
                    >
                      {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Volume */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Volume (ml)
                    </label>
                    <input
                      type="number"
                      name="volume"
                      value={formData.volume}
                      onChange={handleChange}
                      className="input-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Buy Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Buy Price (Admin Only) *
                    </label>
                    <input
                      type="number"
                      name="buyPrice"
                      value={formData.buyPrice}
                      onChange={handleChange}
                      className="input-primary"
                      placeholder="Cost price"
                      required
                    />
                  </div>

                  {/* Selling Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Selling Price *
                    </label>
                    <input
                      type="number"
                      name="sellingPrice"
                      value={formData.sellingPrice}
                      onChange={handleChange}
                      className="input-primary"
                      placeholder="Customer price"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Initial Stock *
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      className="input-primary"
                      required
                    />
                  </div>

                  {/* Low Stock Threshold */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Low Stock Alert at
                    </label>
                    <input
                      type="number"
                      name="lowStockThreshold"
                      value={formData.lowStockThreshold}
                      onChange={handleChange}
                      className="input-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Alcohol Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Alcohol % ABV
                    </label>
                    <input
                      type="number"
                      name="alcoholPercentage"
                      value={formData.alcoholPercentage}
                      onChange={handleChange}
                      className="input-primary"
                      step="0.1"
                    />
                  </div>

                  {/* Available */}
                  <div className="flex items-center mt-8">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="isAvailable"
                        checked={formData.isAvailable}
                        onChange={handleChange}
                        className="w-4 h-4 rounded border-gray-700"
                      />
                      <span className="text-sm text-gray-300">Available for sale</span>
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className="input-primary"
                    rows="3"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-valhala-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      initialData ? 'Update Product' : 'Add Product'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductForm;