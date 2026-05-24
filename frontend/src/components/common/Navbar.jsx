import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, User, LogOut, Menu, X, Package, LayoutDashboard } from 'lucide-react';
import CartSidebar from '../customer/CartSidebar';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, userData, logout, isAdmin } = useAuth();
  const { getTotalItems, setIsOpen } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const totalItems = getTotalItems();

  return (
    <>
      <nav className="bg-valhala-primary/95 backdrop-blur-md sticky top-0 z-50 shadow-lg border-b border-valhala-accent/20">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img src="/assets/images/logo.svg" alt="Valhala" className="h-10 w-10" />
              <span className="text-2xl font-norse font-bold text-valhala-gold">Valhala</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              <Link to="/products" className="text-gray-300 hover:text-valhala-gold transition-colors">
                Products
              </Link>
              {user ? (
                <>
                  <Link to="/my-orders" className="text-gray-300 hover:text-valhala-gold transition-colors">
                    My Orders
                  </Link>
                  <Link to="/support" className="text-gray-300 hover:text-valhala-gold transition-colors">
                    Support
                  </Link>
                  {isAdmin && (
                    <Link to="/admin/dashboard" className="flex items-center space-x-1 text-valhala-gold hover:text-valhala-accent">
                      <LayoutDashboard size={18} />
                      <span>Admin</span>
                    </Link>
                  )}
                </>
              ) : null}
            </div>

            {/* Right Side */}
            <div className="flex items-center space-x-4">
              {/* Cart Button */}
              {user && !isAdmin && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="relative p-2 text-gray-300 hover:text-valhala-gold transition-colors"
                >
                  <ShoppingCart size={24} />
                  {totalItems > 0 && (
                    <span className="absolute -top-1 -right-1 bg-valhala-accent text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {totalItems}
                    </span>
                  )}
                </button>
              )}

              {/* User Menu */}
              {user ? (
                <div className="relative group">
                  <button className="flex items-center space-x-2 p-2 rounded-lg bg-valhala-secondary hover:bg-valhala-nordic transition-colors">
                    <User size={20} />
                    <span className="hidden md:inline">{userData?.name || user.email?.split('@')[0]}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-valhala-secondary rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-valhala-primary flex items-center space-x-2"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-valhala-accent text-white rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Login
                </Link>
              )}

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-300"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-valhala-secondary">
              <div className="flex flex-col space-y-3">
                <Link to="/products" className="text-gray-300 hover:text-valhala-gold" onClick={() => setIsMobileMenuOpen(false)}>
                  Products
                </Link>
                {user ? (
                  <>
                    <Link to="/my-orders" className="text-gray-300 hover:text-valhala-gold" onClick={() => setIsMobileMenuOpen(false)}>
                      My Orders
                    </Link>
                    <Link to="/support" className="text-gray-300 hover:text-valhala-gold" onClick={() => setIsMobileMenuOpen(false)}>
                      Support
                    </Link>
                    {isAdmin && (
                      <Link to="/admin/dashboard" className="text-valhala-gold hover:text-valhala-accent" onClick={() => setIsMobileMenuOpen(false)}>
                        Admin Dashboard
                      </Link>
                    )}
                    <button onClick={handleLogout} className="text-red-400 text-left">
                      Logout
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="text-valhala-gold" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Cart Sidebar */}
      <CartSidebar />
    </>
  );
};

export default Navbar;