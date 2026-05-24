import { USER_ROLES } from './constants';

// User role definitions
export const ROLES = {
  [USER_ROLES.CUSTOMER]: {
    name: 'Customer',
    level: 1,
    permissions: [
      'view_products',
      'add_to_cart',
      'create_order',
      'view_own_orders',
      'track_order',
      'report_issue',
      'view_own_profile',
      'edit_own_profile'
    ]
  },
  [USER_ROLES.DRIVER]: {
    name: 'Driver',
    level: 2,
    permissions: [
      'view_assigned_orders',
      'update_order_status',
      'update_location',
      'view_own_profile',
      'edit_own_profile',
      'view_delivery_history'
    ]
  },
  [USER_ROLES.ADMIN]: {
    name: 'Administrator',
    level: 3,
    permissions: [
      // Product management
      'view_products',
      'add_product',
      'edit_product',
      'delete_product',
      'update_stock',
      
      // Order management
      'view_all_orders',
      'update_order_status',
      'assign_driver',
      'cancel_order',
      
      // Driver management
      'view_drivers',
      'add_driver',
      'edit_driver',
      'fire_driver',
      'view_driver_locations',
      
      // User management
      'view_all_users',
      'edit_user_role',
      'ban_user',
      'delete_user',
      
      // Issue management
      'view_all_issues',
      'respond_to_issue',
      'resolve_issue',
      
      // Analytics
      'view_analytics',
      'view_sales_reports',
      'view_profit_loss',
      
      // Settings
      'view_settings',
      'edit_settings',
      'edit_delivery_fees',
      'edit_business_hours',
      
      // System
      'view_system_logs',
      'export_data',
      'backup_data'
    ]
  }
};

// Check if user has specific permission
export const hasPermission = (userRole, permission) => {
  const roleConfig = ROLES[userRole];
  if (!roleConfig) return false;
  return roleConfig.permissions.includes(permission);
};

// Check if user has any of the specified permissions
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Check if user has all specified permissions
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};

// Get user role level (higher level = more privileges)
export const getRoleLevel = (userRole) => {
  return ROLES[userRole]?.level || 0;
};

// Check if user role is higher than target role
export const isHigherRole = (userRole, targetRole) => {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
};

// Check if user role is lower than target role
export const isLowerRole = (userRole, targetRole) => {
  return getRoleLevel(userRole) < getRoleLevel(targetRole);
};

// Get available actions based on user role
export const getAvailableActions = (userRole) => {
  const permissions = ROLES[userRole]?.permissions || [];
  
  // Group permissions by category
  const categories = {
    products: permissions.filter(p => p.includes('product')),
    orders: permissions.filter(p => p.includes('order')),
    drivers: permissions.filter(p => p.includes('driver')),
    users: permissions.filter(p => p.includes('user')),
    issues: permissions.filter(p => p.includes('issue')),
    analytics: permissions.filter(p => p.includes('analytics')),
    settings: permissions.filter(p => p.includes('settings')),
    system: permissions.filter(p => p.includes('system'))
  };
  
  return categories;
};

// Get allowed menu items for user role
export const getMenuItems = (userRole) => {
  const baseMenu = [];
  
  switch (userRole) {
    case USER_ROLES.CUSTOMER:
      return [
        { path: '/products', label: 'Products', icon: 'Package' },
        { path: '/my-orders', label: 'My Orders', icon: 'ShoppingBag' },
        { path: '/support', label: 'Support', icon: 'HelpCircle' }
      ];
      
    case USER_ROLES.DRIVER:
      return [
        { path: '/driver/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/driver/orders', label: 'My Deliveries', icon: 'Truck' },
        { path: '/driver/earnings', label: 'Earnings', icon: 'DollarSign' }
      ];
      
    case USER_ROLES.ADMIN:
      return [
        { path: '/admin/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
        { path: '/admin/orders', label: 'Orders', icon: 'ClipboardList' },
        { path: '/admin/drivers', label: 'Drivers', icon: 'Truck' },
        { path: '/admin/inventory', label: 'Inventory', icon: 'Package' },
        { path: '/admin/issues', label: 'Issues', icon: 'AlertCircle' },
        { path: '/admin/analytics', label: 'Analytics', icon: 'TrendingUp' },
        { path: '/admin/settings', label: 'Settings', icon: 'Settings' }
      ];
      
    default:
      return baseMenu;
  }
};

// Check if user can access a specific route
export const canAccessRoute = (userRole, path) => {
  const menuItems = getMenuItems(userRole);
  return menuItems.some(item => path.startsWith(item.path));
};

// Get role badge color
export const getRoleBadgeColor = (role) => {
  switch (role) {
    case USER_ROLES.ADMIN:
      return 'bg-red-500/20 text-red-500';
    case USER_ROLES.DRIVER:
      return 'bg-blue-500/20 text-blue-500';
    case USER_ROLES.CUSTOMER:
      return 'bg-green-500/20 text-green-500';
    default:
      return 'bg-gray-500/20 text-gray-500';
  }
};

// Get role display name
export const getRoleDisplayName = (role) => {
  return ROLES[role]?.name || role;
};

// Validate role transition (e.g., admin cannot demote themselves)
export const canChangeRole = (changerRole, targetRole, isSelf = false) => {
  if (isSelf && changerRole === USER_ROLES.ADMIN) {
    return false; // Admin cannot change their own role
  }
  return isHigherRole(changerRole, targetRole);
};