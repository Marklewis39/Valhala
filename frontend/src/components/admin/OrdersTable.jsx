import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Eye, CheckCircle, XCircle, Truck, Clock, Filter } from 'lucide-react';
import { ORDER_STATUS, ORDER_STATUS_LABELS } from '../../utils/constants';

const OrdersTable = ({ orders, onViewDetails, onAssignDriver, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'cancelled':
        return <XCircle size={16} className="text-red-500" />;
      case 'en_route':
      case 'picked_up':
        return <Truck size={16} className="text-blue-500" />;
      default:
        return <Clock size={16} className="text-yellow-500" />;
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending_payment: 'bg-yellow-500/20 text-yellow-500',
      awaiting_driver: 'bg-purple-500/20 text-purple-500',
      picked_up: 'bg-blue-500/20 text-blue-500',
      en_route: 'bg-orange-500/20 text-orange-500',
      delivered: 'bg-green-500/20 text-green-500',
      cancelled: 'bg-red-500/20 text-red-500'
    };
    return colors[status] || 'bg-gray-500/20 text-gray-500';
  };

  return (
    <div className="bg-valhala-secondary rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-valhala-nordic flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search by Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-valhala-accent"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-valhala-primary border border-gray-700 rounded-lg text-sm"
          >
            <option value="all">All Status</option>
            {Object.entries(ORDER_STATUS_LABELS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
        <p className="text-sm text-gray-400">{filteredOrders.length} orders found</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-valhala-primary">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Order ID</th>
              <th className="text-left p-4 text-sm font-semibold">Date</th>
              <th className="text-left p-4 text-sm font-semibold">Customer</th>
              <th className="text-left p-4 text-sm font-semibold">Items</th>
              <th className="text-left p-4 text-sm font-semibold">Total</th>
              <th className="text-left p-4 text-sm font-semibold">Status</th>
              <th className="text-left p-4 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => (
              <tr key={order.id} className="border-t border-valhala-nordic hover:bg-valhala-primary/50 transition-colors">
                <td className="p-4">
                  <p className="font-mono text-sm">#{order.id.slice(-8)}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm">{formatDate(order.createdAt)}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm">{order.userName || 'N/A'}</p>
                  <p className="text-xs text-gray-400">{order.userEmail}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm">{order.items.length} items</p>
                  <p className="text-xs text-gray-400">{order.items[0]?.name}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm font-semibold text-valhala-gold">
                    {formatCurrency(order.total)}
                  </p>
                  <p className="text-xs text-gray-400">
                    Paid: {formatCurrency(order.paidUpfront)}
                  </p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(order.status)}
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                      {ORDER_STATUS_LABELS[order.status]?.label || order.status}
                    </span>
                  </div>
                </td>
                <td className="p-4">
                  <button
                    onClick={() => onViewDetails(order)}
                    className="p-2 hover:bg-valhala-primary rounded-lg transition-colors"
                    title="View Details"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredOrders.length === 0 && (
        <div className="text-center py-12">
          <Filter size={48} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No orders found</p>
        </div>
      )}
    </div>
  );
};

export default OrdersTable;