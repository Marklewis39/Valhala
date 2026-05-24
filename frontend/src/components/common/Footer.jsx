import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-valhala-primary border-t border-valhala-secondary mt-auto">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <img src="/assets/images/logo.svg" alt="Valhala" className="h-10 w-10" />
              <span className="text-2xl font-norse font-bold text-valhala-gold">Valhala</span>
            </div>
            <p className="text-gray-400 text-sm">
              Premium alcohol delivery service. Get your favorite drinks delivered to your doorstep.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-bold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/products" className="text-gray-400 hover:text-valhala-gold text-sm">Products</Link></li>
              <li><Link to="/my-orders" className="text-gray-400 hover:text-valhala-gold text-sm">My Orders</Link></li>
              <li><Link to="/support" className="text-gray-400 hover:text-valhala-gold text-sm">Support</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-valhala-gold text-sm">Terms & Conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-bold text-white mb-4">Contact Us</h3>
            <ul className="space-y-2">
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <Phone size={16} />
                <span>+254 700 123 456</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <Mail size={16} />
                <span>support@valhala.com</span>
              </li>
              <li className="flex items-center space-x-2 text-gray-400 text-sm">
                <MapPin size={16} />
                <span>Nairobi, Kenya</span>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h3 className="font-bold text-white mb-4">Follow Us</h3>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-valhala-gold transition-colors">
                <Facebook size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-valhala-gold transition-colors">
                <Twitter size={24} />
              </a>
              <a href="#" className="text-gray-400 hover:text-valhala-gold transition-colors">
                <Instagram size={24} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-valhala-secondary mt-8 pt-8 text-center text-gray-400 text-sm">
          <p>&copy; {new Date().getFullYear()} Valhala. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;