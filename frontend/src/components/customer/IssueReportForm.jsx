import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Send } from 'lucide-react';
import { ISSUE_TYPES } from '../../utils/constants';
import { db, collection, addDoc, Timestamp } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const IssueReportForm = ({ isOpen, onClose, orderId }) => {
  const { user } = useAuth();
  const [issueType, setIssueType] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!issueType) {
      toast.error('Please select an issue type');
      return;
    }
    
    if (!description.trim()) {
      toast.error('Please provide a description');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addDoc(collection(db, 'issues'), {
        userId: user.uid,
        orderId: orderId,
        type: issueType,
        description: description,
        status: 'open',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      toast.success('Issue reported successfully! Our team will contact you soon.');
      onClose();
      setIssueType('');
      setDescription('');
    } catch (error) {
      console.error('Error reporting issue:', error);
      toast.error('Failed to report issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 z-50"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-valhala-secondary rounded-xl max-w-lg w-full">
              {/* Header */}
              <div className="border-b border-valhala-nordic p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-yellow-500" size={24} />
                  <h2 className="text-xl font-bold">Report an Issue</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-valhala-primary rounded-lg">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Issue Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Issue Type *
                  </label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="input-primary"
                    required
                  >
                    <option value="">Select an issue type</option>
                    {ISSUE_TYPES.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="input-primary"
                    rows="5"
                    placeholder="Please provide details about the issue..."
                    required
                  />
                </div>
                
                {/* Info Note */}
                <div className="bg-valhala-primary rounded-lg p-3 text-xs text-gray-400">
                  <p>• Our support team will review your issue within 24 hours</p>
                  <p>• You will receive updates via email</p>
                  <p>• Please provide order ID: <span className="font-mono text-valhala-gold">{orderId?.slice(-8)}</span></p>
                </div>
                
                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-600 rounded-lg hover:bg-valhala-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Send size={18} />
                        Submit Report
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default IssueReportForm;