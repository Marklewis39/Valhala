import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Truck, Package, AlertCircle,
  TrendingUp, Settings, ShoppingBag, Map, ClipboardList
} from 'lucide-react';

const AdminSidebar = () => {
  const menuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/admin/orders', icon: ClipboardList, label: 'Orders' },
    { path: '/admin/drivers', icon: Truck, label: 'Drivers' },
    { path: '/admin/inventory', icon: Package, label: 'Inventory' },
    { path: '/admin/issues', icon: AlertCircle, label: 'Issues' },
    { path: '/admin/analytics', icon: TrendingUp, label: 'Analytics' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-valhala-primary min-h-screen fixed left-0 top-0 z-40 mt-16">
      <div className="p-4">
        {/* Admin Info */}
        <div className="mb-6 p-3 bg-valhala-secondary rounded-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-valhala-accent rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <div>
              <p className="font-semibold text-sm">Admin User</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-valhala-accent text-white'
                    : 'text-gray-400 hover:bg-valhala-secondary hover:text-white'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Quick Stats */}
        <div className="mt-8 pt-6 border-t border-valhala-nordic">
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Today's Orders</span>
              <span className="font-semibold">24</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Drivers</span>
              <span className="font-semibold">8</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Pending Issues</span>
              <span className="font-semibold text-yellow-500">3</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;