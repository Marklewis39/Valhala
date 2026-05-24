import React, { useState } from 'react';
import { auth, db, createUserWithEmailAndPassword, setDoc, doc } from '../../services/firebase';
import { ShieldCheck, Mail, User, Plus, X, Trash2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageAdmins = ({ admins = [], onAdminAdded }) => {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate
    if (!formData.name.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      setLoading(false);
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (!formData.password) {
      setError('Password is required');
      setLoading(false);
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Save admin data to Firestore users collection
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'admin',
        createdBy: auth.currentUser?.uid,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      toast.success(`Admin ${formData.name} created successfully!`);
      setShowModal(false);
      setFormData({ name: '', email: '', password: '' });
      if (onAdminAdded) onAdminAdded();
      
    } catch (err) {
      console.error('Registration error:', err);
      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('Email already registered');
          break;
        case 'auth/invalid-email':
          setError('Invalid email format');
          break;
        case 'auth/weak-password':
          setError('Password is too weak');
          break;
        default:
          setError('Failed to create admin. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Add Admin Button */}
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-gradient-to-r from-valhala-accent to-valhala-nordic text-white py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
      >
        <Plus size={18} />
        Add New Admin
      </button>

      {/* Current Admins List */}
      {admins.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs text-gray-400 mb-2">Current Administrators</p>
          {admins.map((admin) => (
            <div key={admin.id} className="flex items-center justify-between p-2 bg-valhala-primary rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <ShieldCheck size={14} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">{admin.name}</p>
                  <p className="text-xs text-gray-400">{admin.email}</p>
                </div>
              </div>
              {admin.isFirstAdmin && (
                <span className="text-xs text-valhala-gold">Primary</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-valhala-secondary rounded-xl w-full max-w-md">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-valhala-accent" />
                <h2 className="text-lg font-bold">Add New Admin</h2>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCreateAdmin} className="p-4 space-y-4">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-valhala-accent"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-valhala-accent"
                    placeholder="admin@valhala.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Password</label>
                <div className="relative">
                  <ShieldCheck size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 bg-valhala-primary border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-valhala-accent"
                    placeholder="••••••••"
                    required
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-white/20 rounded-lg text-gray-300 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-valhala-accent text-white py-2 rounded-lg hover:bg-valhala-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      Create Admin
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAdmins;