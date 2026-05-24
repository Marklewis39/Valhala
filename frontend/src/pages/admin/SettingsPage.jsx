import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import { 
  Settings, Shield, Bell, DollarSign, MapPin, Users, 
  Save, RefreshCw, AlertCircle, CheckCircle, Truck, Clock
} from 'lucide-react';
import { db, doc, getDoc, setDoc, updateDoc } from '../../services/firebase';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    deliveryFees: {
      baseFee: 100,
      feePerKm: 50,
      maxFee: 500,
      freeDeliveryThreshold: 5000
    },
    businessHours: {
      openTime: '08:00',
      closeTime: '23:00',
      is247: true
    },
    commission: {
      percentage: 15,
      minCommission: 50,
      maxCommission: 500
    },
    notifications: {
      emailAlerts: true,
      smsAlerts: true,
      lowStockAlerts: true,
      orderAlerts: true
    },
    deliveryCenters: [
      { name: 'CBD Depot', lat: -1.2921, lng: 36.8219, active: true },
      { name: 'Westlands Hub', lat: -1.2675, lng: 36.8037, active: true }
    ]
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'appSettings'));
      if (settingsDoc.exists()) {
        setSettings(settingsDoc.data());
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'appSettings'), {
        ...settings,
        updatedAt: new Date(),
        updatedBy: 'admin'
      });
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleDeliveryFeeChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      deliveryFees: { ...prev.deliveryFees, [field]: parseFloat(value) || 0 }
    }));
  };

  const handleAddDeliveryCenter = () => {
    setSettings(prev => ({
      ...prev,
      deliveryCenters: [...prev.deliveryCenters, { name: '', lat: 0, lng: 0, active: true }]
    }));
  };

  const handleUpdateDeliveryCenter = (index, field, value) => {
    const updatedCenters = [...settings.deliveryCenters];
    updatedCenters[index][field] = value;
    setSettings(prev => ({ ...prev, deliveryCenters: updatedCenters }));
  };

  const handleRemoveDeliveryCenter = (index) => {
    const updatedCenters = settings.deliveryCenters.filter((_, i) => i !== index);
    setSettings(prev => ({ ...prev, deliveryCenters: updatedCenters }));
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-valhala-dark">
        <AdminSidebar />
        <div className="flex-1 ml-64">
          <AdminHeader />
          <div className="p-6 flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-valhala-accent border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-valhala-dark">
      <AdminSidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <AdminHeader />
        
        <main className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">System Settings</h1>
            <p className="text-gray-400 mt-1">Configure delivery fees, business hours, and system preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar Tabs */}
            <div className="lg:col-span-1">
              <div className="bg-valhala-secondary rounded-xl overflow-hidden sticky top-24">
                <button
                  onClick={() => setActiveTab('general')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    activeTab === 'general' ? 'bg-valhala-accent text-white' : 'text-gray-400 hover:bg-valhala-primary'
                  }`}
                >
                  <Settings size={18} />
                  General Settings
                </button>
                <button
                  onClick={() => setActiveTab('delivery')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    activeTab === 'delivery' ? 'bg-valhala-accent text-white' : 'text-gray-400 hover:bg-valhala-primary'
                  }`}
                >
                  <Truck size={18} />
                  Delivery Fees
                </button>
                <button
                  onClick={() => setActiveTab('centers')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    activeTab === 'centers' ? 'bg-valhala-accent text-white' : 'text-gray-400 hover:bg-valhala-primary'
                  }`}
                >
                  <MapPin size={18} />
                  Delivery Centers
                </button>
                <button
                  onClick={() => setActiveTab('notifications')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    activeTab === 'notifications' ? 'bg-valhala-accent text-white' : 'text-gray-400 hover:bg-valhala-primary'
                  }`}
                >
                  <Bell size={18} />
                  Notifications
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                    activeTab === 'security' ? 'bg-valhala-accent text-white' : 'text-gray-400 hover:bg-valhala-primary'
                  }`}
                >
                  <Shield size={18} />
                  Security
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="lg:col-span-3">
              <div className="bg-valhala-secondary rounded-xl p-6">
                {/* General Settings */}
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">General Settings</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Name
                        </label>
                        <input
                          type="text"
                          value="Valhala Delivery"
                          className="input-primary"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Email
                        </label>
                        <input
                          type="email"
                          value="admin@valhala.com"
                          className="input-primary"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Business Phone
                        </label>
                        <input
                          type="tel"
                          value="+254 700 123 456"
                          className="input-primary"
                          disabled
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Currency
                        </label>
                        <input
                          type="text"
                          value="Kenyan Shilling (KES)"
                          className="input-primary"
                          disabled
                        />
                      </div>
                    </div>

                    <div className="border-t border-valhala-nordic pt-6">
                      <h3 className="font-semibold mb-4">Business Hours</h3>
                      <div className="flex items-center gap-4 mb-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settings.businessHours.is247}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              businessHours: { ...prev.businessHours, is247: e.target.checked }
                            }))}
                            className="w-4 h-4 rounded border-gray-700"
                          />
                          <span>24/7 Operation</span>
                        </label>
                      </div>
                      
                      {!settings.businessHours.is247 && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Opening Time</label>
                            <input
                              type="time"
                              value={settings.businessHours.openTime}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                businessHours: { ...prev.businessHours, openTime: e.target.value }
                              }))}
                              className="input-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-400 mb-1">Closing Time</label>
                            <input
                              type="time"
                              value={settings.businessHours.closeTime}
                              onChange={(e) => setSettings(prev => ({
                                ...prev,
                                businessHours: { ...prev.businessHours, closeTime: e.target.value }
                              }))}
                              className="input-primary"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Delivery Fees Settings */}
                {activeTab === 'delivery' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Delivery Fee Configuration</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Base Delivery Fee (KES)
                        </label>
                        <input
                          type="number"
                          value={settings.deliveryFees.baseFee}
                          onChange={(e) => handleDeliveryFeeChange('baseFee', e.target.value)}
                          className="input-primary"
                        />
                        <p className="text-xs text-gray-400 mt-1">Minimum delivery fee per order</p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Fee Per Kilometer (KES)
                        </label>
                        <input
                          type="number"
                          value={settings.deliveryFees.feePerKm}
                          onChange={(e) => handleDeliveryFeeChange('feePerKm', e.target.value)}
                          className="input-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Maximum Delivery Fee (KES)
                        </label>
                        <input
                          type="number"
                          value={settings.deliveryFees.maxFee}
                          onChange={(e) => handleDeliveryFeeChange('maxFee', e.target.value)}
                          className="input-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Free Delivery Threshold (KES)
                        </label>
                        <input
                          type="number"
                          value={settings.deliveryFees.freeDeliveryThreshold}
                          onChange={(e) => handleDeliveryFeeChange('freeDeliveryThreshold', e.target.value)}
                          className="input-primary"
                        />
                        <p className="text-xs text-gray-400 mt-1">Orders above this amount get free delivery</p>
                      </div>
                    </div>

                    <div className="bg-valhala-primary rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle size={20} className="text-valhala-accent flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-400">
                          <p>Delivery fee calculation: Base Fee + (Distance × Fee Per KM)</p>
                          <p className="mt-1">Maximum fee applies to long-distance deliveries</p>
                          <p className="mt-1">Free delivery for orders over {settings.deliveryFees.freeDeliveryThreshold} KES</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery Centers Settings */}
                {activeTab === 'centers' && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-bold">Delivery Centers</h2>
                      <button
                        onClick={handleAddDeliveryCenter}
                        className="px-3 py-1 bg-valhala-accent text-white rounded-lg text-sm"
                      >
                        + Add Center
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {settings.deliveryCenters.map((center, index) => (
                        <div key={index} className="bg-valhala-primary rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <h3 className="font-semibold">Center {index + 1}</h3>
                            <button
                              onClick={() => handleRemoveDeliveryCenter(index)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                              type="text"
                              placeholder="Center Name"
                              value={center.name}
                              onChange={(e) => handleUpdateDeliveryCenter(index, 'name', e.target.value)}
                              className="input-primary"
                            />
                            <input
                              type="number"
                              placeholder="Latitude"
                              value={center.lat}
                              onChange={(e) => handleUpdateDeliveryCenter(index, 'lat', parseFloat(e.target.value))}
                              className="input-primary"
                              step="any"
                            />
                            <input
                              type="number"
                              placeholder="Longitude"
                              value={center.lng}
                              onChange={(e) => handleUpdateDeliveryCenter(index, 'lng', parseFloat(e.target.value))}
                              className="input-primary"
                              step="any"
                            />
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={center.active}
                                onChange={(e) => handleUpdateDeliveryCenter(index, 'active', e.target.checked)}
                                className="w-4 h-4 rounded border-gray-700"
                              />
                              <span className="text-sm">Active</span>
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notifications Settings */}
                {activeTab === 'notifications' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Notification Preferences</h2>
                    
                    <div className="space-y-4">
                      <label className="flex items-center justify-between cursor-pointer p-3 bg-valhala-primary rounded-lg">
                        <div>
                          <p className="font-semibold">Email Alerts</p>
                          <p className="text-xs text-gray-400">Receive email notifications for important events</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.emailAlerts}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, emailAlerts: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-700"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer p-3 bg-valhala-primary rounded-lg">
                        <div>
                          <p className="font-semibold">SMS Alerts</p>
                          <p className="text-xs text-gray-400">Receive SMS notifications for urgent matters</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.smsAlerts}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, smsAlerts: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-700"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer p-3 bg-valhala-primary rounded-lg">
                        <div>
                          <p className="font-semibold">Low Stock Alerts</p>
                          <p className="text-xs text-gray-400">Get notified when products run low</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.lowStockAlerts}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, lowStockAlerts: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-700"
                        />
                      </label>
                      
                      <label className="flex items-center justify-between cursor-pointer p-3 bg-valhala-primary rounded-lg">
                        <div>
                          <p className="font-semibold">New Order Alerts</p>
                          <p className="text-xs text-gray-400">Get notified for every new order</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={settings.notifications.orderAlerts}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            notifications: { ...prev.notifications, orderAlerts: e.target.checked }
                          }))}
                          className="w-5 h-5 rounded border-gray-700"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {/* Security Settings */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold">Security Settings</h2>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Session Timeout (minutes)
                        </label>
                        <input
                          type="number"
                          defaultValue="30"
                          className="input-primary"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Password Policy
                        </label>
                        <select className="input-primary">
                          <option>Strong (min 8 chars, numbers, symbols)</option>
                          <option>Medium (min 6 chars, numbers)</option>
                          <option>Basic (min 6 chars)</option>
                        </select>
                      </div>
                      
                      <div className="bg-green-500/10 border border-green-500 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={16} className="text-green-500" />
                          <p className="text-sm text-green-500">2-Factor Authentication is enabled</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Save Button */}
                <div className="border-t border-valhala-nordic pt-6 mt-6">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 px-6"
                  >
                    {saving ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Save size={18} />
                    )}
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;