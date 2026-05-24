import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ProductGrid from '../../components/customer/ProductGrid';
import SearchBar from '../../components/customer/SearchBar';
import CategoryFilter from '../../components/customer/CategoryFilter';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { getProducts, listenToProducts } from '../../services/products';
import { useCart } from '../../contexts/CartContext';
import { ShoppingBag, Filter } from 'lucide-react';

const ProductsPage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { cartItems } = useCart();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = listenToProducts((productsData) => {
      setProducts(productsData);
      setLoading(false);
    }, { isAvailable: true });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = [...products];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.brand?.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(filtered);
  }, [products, selectedCategory, searchQuery]);

  const cartItemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Our Collection</h1>
          <p className="text-gray-400">Discover premium spirits and beverages</p>
        </div>
        
        {/* Mobile filter button */}
        <button 
          onClick={() => setShowFilters(!showFilters)}
          className="md:hidden btn-secondary flex items-center gap-2"
        >
          <Filter size={20} />
          Filters
        </button>
      </div>

      {/* Filters Section */}
      <div className={`${showFilters ? 'block' : 'hidden'} md:block mb-8`}>
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            <CategoryFilter selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory} />
          </div>
        </div>
      </div>

      {/* Results Stats */}
      <div className="mb-6 flex justify-between items-center">
        <p className="text-gray-400">
          Showing {filteredProducts.length} of {products.length} products
        </p>
        {cartItemCount > 0 && (
          <div className="bg-valhala-accent/20 px-3 py-1 rounded-full text-sm">
            {cartItemCount} items in cart
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <LoadingSpinner />
      ) : (
        <AnimatePresence mode="wait">
          {filteredProducts.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <ShoppingBag size={64} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-gray-400">Try adjusting your filters or search query</p>
            </motion.div>
          ) : (
            <ProductGrid products={filteredProducts} />
          )}
        </AnimatePresence>
      )}
    </div>
  );
};

export default ProductsPage;