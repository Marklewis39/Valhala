import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Truck, UserCheck, UserX, Eye, MapPin, Phone, Car, Trash2, RefreshCw, Search, Filter } from 'lucide-react';
import { db, collection, getDocs, updateDoc, doc, deleteDoc, query, where } from '../../services/firebase';
import RiderRegistration from '../../components/admin/RiderRegistration';
import toast from 'react-hot-toast';

const DriversManagement = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const driversSnapshot = await getDocs(collection(db, 'drivers'));
      const driversData = driversSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
      }));
      setDrivers(driversData);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      toast.error('Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const toggleDriverStatus = async (driverId, currentStatus, driverName) => {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      await updateDoc(driverRef, {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      toast.success(`${driverName} has been ${currentStatus ? 'deactivated' : 'activated'}`);
      fetchDrivers();
    } catch (error) {
      console.error('Error updating driver status:', error);
      toast.error('Failed to update driver status');
    }
  };

  const fireDriver = async (driverId, driverName) => {
    if (window.confirm(`Are you sure you want to fire ${driverName}? This will permanently delete their account and they will no longer be able to log in.`)) {
      try {
        // Option 1: Soft delete (just deactivate)
        const driverRef = doc(db, 'drivers', driverId);
        await updateDoc(driverRef, {
          isActive: false,
          isAvailable: false,
          firedAt: new Date(),
          firedBy: 'admin',
          status: 'fired'
        });
        
        toast.success(`${driverName} has been fired and deactivated`);
        fetchDrivers();
      } catch (error) {
        console.error('Error firing driver:', error);
        toast.error('Failed to fire driver');
      }
    }
  };

  const viewDriverDetails = (driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = driver.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          driver.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          driver.phoneNumber?.includes(searchTerm) ||
                          driver.vehicleNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' ? true :
                          filterStatus === 'active' ? driver.isActive === true :
                          filterStatus === 'inactive' ? driver.isActive === false :
                          true;
    
    return matchesSearch && matchesStatus;
  });

  const activeDrivers = filteredDrivers.filter(d => d.isActive);
  const inactiveDrivers = filteredDrivers.filter(d => !d.isActive);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-valhala-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Register Button */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Drivers Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage delivery drivers and track their performance</p>
        </div>
        <RiderRegistration onDriverAdded={fetchDrivers} />
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Drivers</p>
              <p className="text-2xl font-bold">{drivers.length}</p>
            </div>
            <Truck size={28} className="text-valhala-accent opacity-70" />
          </div>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Active Drivers</p>
              <p className="text-2xl font-bold text-green-500">{drivers.filter(d => d.isActive).length}</p>
            </div>
            <UserCheck size={28} className="text-green-500 opacity-70" />
          </div>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Inactive Drivers</p>
              <p className="text-2xl font-bold text-red-500">{drivers.filter(d => !d.isActive).length}</p>
            </div>
            <UserX size={28} className="text-red-500 opacity-70" />
          </div>
        </div>
        <div className="bg-valhala-secondary rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Deliveries</p>
              <p className="text-2xl font-bold">{drivers.reduce((sum, d) => sum + (d.totalDeliveries || 0), 0)}</p>
            </div>
            <Car size={28} className="text-blue-500 opacity-70" />
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search drivers by name, email, phone, or vehicle..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 bg-valhala-secondary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-8 py-2 bg-valhala-secondary border border-white/10 rounded-lg text-white focus:outline-none focus:border-valhala-accent"
          >
            <option value="all">All Drivers</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>
        <button
          onClick={fetchDrivers}
          className="px-4 py-2 bg-valhala-primary rounded-lg hover:bg-valhala-nordic transition-colors flex items-center gap-2"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Active Drivers List */}
      <div className="bg-valhala-secondary rounded-xl overflow-hidden">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserCheck size={18} className="text-green-500" />
            Active Drivers ({activeDrivers.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-valhala-primary">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Driver</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Vehicle</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Deliveries</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Rating</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {activeDrivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <Truck size={14} className="text-green-500" />
                      </div>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-xs text-gray-500">ID: {driver.id.slice(-8)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{driver.phoneNumber}</div>
                    <div className="text-xs text-gray-500">{driver.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm">{driver.vehicleNumber}</div>
                    <div className="text-xs text-gray-500 capitalize">{driver.vehicleType}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                      driver.isAvailable 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${driver.isAvailable ? 'bg-green-500' : 'bg-yellow-500'}`} />
                      {driver.isAvailable ? 'Available' : 'On Delivery'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{driver.totalDeliveries || 0}</td>
                  <td className="px-4 py-3 text-sm">⭐ {driver.rating || 5.0}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => viewDriverDetails(driver)}
                        className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        onClick={() => toggleDriverStatus(driver.id, driver.isActive, driver.name)}
                        className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                        title="Deactivate Driver"
                      >
                        <UserX size={16} />
                      </button>
                      <button
                        onClick={() => fireDriver(driver.id, driver.name)}
                        className="p-1.5 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-colors"
                        title="Fire Driver"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {activeDrivers.length === 0 && (
            <p className="text-center text-gray-400 py-8">No active drivers found</p>
          )}
        </div>
      </div>

      {/* Inactive Drivers List */}
      {inactiveDrivers.length > 0 && (
        <div className="bg-valhala-secondary rounded-xl overflow-hidden">
          <div className="p-4 border-b border-white/10">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserX size={18} className="text-red-500" />
              Inactive Drivers ({inactiveDrivers.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-valhala-primary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Driver</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Contact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Vehicle</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {inactiveDrivers.map((driver) => (
                  <tr key={driver.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-500/20 rounded-full flex items-center justify-center">
                          <Truck size={14} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-400">{driver.name}</p>
                          <p className="text-xs text-gray-600">ID: {driver.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{driver.phoneNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{driver.vehicleNumber}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => viewDriverDetails(driver)}
                          className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors"
                          title="View Details"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => toggleDriverStatus(driver.id, driver.isActive, driver.name)}
                          className="p-1.5 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                          title="Activate Driver"
                        >
                          <UserCheck size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-valhala-secondary rounded-xl w-full max-w-md"
          >
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <h2 className="text-lg font-bold">Driver Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                  <Truck size={24} className="text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-lg">{selectedDriver.name}</p>
                  <p className="text-sm text-gray-400">Driver ID: {selectedDriver.id?.slice(-8)}</p>
                </div>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-1">Contact Information</p>
                <p className="text-sm">📞 {selectedDriver.phoneNumber}</p>
                <p className="text-sm">✉️ {selectedDriver.email}</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-1">Vehicle Information</p>
                <p className="text-sm">🚗 {selectedDriver.vehicleNumber}</p>
                <p className="text-sm capitalize">Type: {selectedDriver.vehicleType}</p>
                <p className="text-sm">📜 License: {selectedDriver.licenseNumber}</p>
                {selectedDriver.idNumber && <p className="text-sm">🆔 ID: {selectedDriver.idNumber}</p>}
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-1">Performance</p>
                <p className="text-sm">📦 Deliveries: {selectedDriver.totalDeliveries || 0}</p>
                <p className="text-sm">⭐ Rating: {selectedDriver.rating || 5.0} / 5.0</p>
              </div>
              
              <div>
                <p className="text-xs text-gray-400 mb-1">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                  selectedDriver.isActive 
                    ? 'bg-green-500/20 text-green-500' 
                    : 'bg-red-500/20 text-red-500'
                }`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${selectedDriver.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                  {selectedDriver.isActive ? (selectedDriver.isAvailable ? 'Available' : 'On Delivery') : 'Inactive'}
                </span>
              </div>
              
              {selectedDriver.firedAt && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                  <p className="text-xs text-red-400">Fired on: {new Date(selectedDriver.firedAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DriversManagement;