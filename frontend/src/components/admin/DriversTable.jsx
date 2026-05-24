import React, { useState } from 'react';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { Eye, Edit, Ban, CheckCircle, Truck, Phone, Mail, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const DriversTable = ({ drivers, onViewDetails, onEdit, onToggleStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          driver.phoneNumber.includes(searchTerm) ||
                          driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                          (statusFilter === 'active' && driver.isActive) ||
                          (statusFilter === 'inactive' && !driver.isActive);
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (isActive, isAvailable) => {
    if (!isActive) {
      return <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">Inactive</span>;
    }
    if (isAvailable) {
      return <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Available</span>;
    }
    return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs">On Delivery</span>;
  };

  return (
    <div className="bg-valhala-secondary rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-valhala-nordic flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search drivers..."
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
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
        <p className="text-sm text-gray-400">{filteredDrivers.length} drivers found</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-valhala-primary">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Driver</th>
              <th className="text-left p-4 text-sm font-semibold">Contact</th>
              <th className="text-left p-4 text-sm font-semibold">Vehicle</th>
              <th className="text-left p-4 text-sm font-semibold">Stats</th>
              <th className="text-left p-4 text-sm font-semibold">Status</th>
              <th className="text-left p-4 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((driver) => (
              <tr key={driver.id} className="border-t border-valhala-nordic hover:bg-valhala-primary/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-valhala-accent/20 rounded-full flex items-center justify-center">
                      <Truck size={20} className="text-valhala-accent" />
                    </div>
                    <div>
                      <p className="font-semibold">{driver.name}</p>
                      <p className="text-xs text-gray-400">ID: {driver.id.slice(-8)}</p>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <div className="space-y-1">
                    <p className="text-sm flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      {driver.phoneNumber}
                    </p>
                    <p className="text-sm flex items-center gap-1">
                      <Mail size={12} className="text-gray-400" />
                      {driver.email}
                    </p>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="text-sm font-semibold">{driver.vehicleType}</p>
                    <p className="text-xs text-gray-400">{driver.vehicleNumber}</p>
                  </div>
                </td>
                <td className="p-4">
                  <div>
                    <p className="text-sm">Deliveries: {driver.totalDeliveries}</p>
                    <p className="text-sm">Rating: {driver.rating}⭐</p>
                  </div>
                </td>
                <td className="p-4">
                  {getStatusBadge(driver.isActive, driver.isAvailable)}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(driver)}
                      className="p-2 hover:bg-valhala-primary rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => onEdit(driver)}
                      className="p-2 hover:bg-valhala-primary rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onToggleStatus(driver.id, driver.isActive)}
                      className={`p-2 rounded-lg transition-colors ${
                        driver.isActive 
                          ? 'hover:bg-red-500/20 text-red-400' 
                          : 'hover:bg-green-500/20 text-green-400'
                      }`}
                      title={driver.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {driver.isActive ? <Ban size={16} /> : <CheckCircle size={16} />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredDrivers.length === 0 && (
        <div className="text-center py-12">
          <Truck size={48} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No drivers found</p>
        </div>
      )}
    </div>
  );
};

export default DriversTable;