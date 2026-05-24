import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, Search, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminHeader = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, title: 'New order #VAL-1234', time: '2 min ago', read: false },
    { id: 2, title: 'Low stock alert: Jack Daniels', time: '15 min ago', read: false },
    { id: 3, title: 'New issue reported', time: '1 hour ago', read: true },
  ];

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/admin/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="bg-valhala-primary border-b border-valhala-nordic fixed top-0 right-0 left-64 z-30">
      <div className="px-6 py-4 flex justify-between items-center">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search orders, products, drivers..."
              className="w-full pl-10 pr-4 py-2 bg-valhala-secondary border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-valhala-accent text-white"
            />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 hover:bg-valhala-secondary rounded-lg transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-valhala-secondary rounded-lg shadow-xl z-50">
                <div className="p-3 border-b border-valhala-nordic">
                  <h3 className="font-semibold">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notif => (
                    <div key={notif.id} className={`p-3 border-b border-valhala-nordic hover:bg-valhala-primary cursor-pointer ${!notif.read ? 'bg-valhala-accent/10' : ''}`}>
                      <p className="text-sm">{notif.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-3 p-2 hover:bg-valhala-secondary rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-valhala-accent rounded-full flex items-center justify-center">
                <User size={16} className="text-white" />
              </div>
              <div className="text-left hidden md:block">
                <p className="text-sm font-semibold">Admin</p>
                <p className="text-xs text-gray-400">admin@valhala.com</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-valhala-secondary rounded-lg shadow-xl z-50">
                <div className="py-2">
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-valhala-primary flex items-center gap-2">
                    <User size={16} />
                    Profile Settings
                  </button>
                  <button className="w-full px-4 py-2 text-left text-sm hover:bg-valhala-primary flex items-center gap-2">
                    <Settings size={16} />
                    System Settings
                  </button>
                  <hr className="my-2 border-valhala-nordic" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-valhala-primary flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;