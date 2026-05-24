import React, { useState, useEffect } from 'react';
import AdminSidebar from '../../components/admin/AdminSidebar';
import AdminHeader from '../../components/admin/AdminHeader';
import IssuesTable from '../../components/admin/IssuesTable';
import { db, collection, getDocs, doc, updateDoc, Timestamp } from '../../services/firebase';
import { formatDate } from '../../utils/formatters';
import { X, MessageSquare, Send, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const IssuesManagement = () => {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchIssues();
  }, []);

  const fetchIssues = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'issues'));
      const issuesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setIssues(issuesData.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Error fetching issues:', error);
      toast.error('Failed to load issues');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIssue = async (issueId) => {
    try {
      const issueRef = doc(db, 'issues', issueId);
      await updateDoc(issueRef, {
        status: 'resolved',
        resolvedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchIssues();
      toast.success('Issue marked as resolved');
    } catch (error) {
      console.error('Error resolving issue:', error);
      toast.error('Failed to resolve issue');
    }
  };

  const handleSendResponse = async () => {
    if (!adminResponse.trim()) {
      toast.error('Please enter a response');
      return;
    }

    setSubmitting(true);
    try {
      const issueRef = doc(db, 'issues', selectedIssue.id);
      await updateDoc(issueRef, {
        status: 'in_review',
        adminResponse: adminResponse,
        respondedAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      await fetchIssues();
      toast.success('Response sent to customer');
      setAdminResponse('');
      setShowDetailsModal(false);
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (type) => {
    const priorities = {
      delivery_failed: 'bg-red-500/20 text-red-500',
      wrong_item: 'bg-red-500/20 text-red-500',
      delayed: 'bg-yellow-500/20 text-yellow-500',
      price_discrepancy: 'bg-yellow-500/20 text-yellow-500',
      other: 'bg-blue-500/20 text-blue-500'
    };
    return priorities[type] || 'bg-gray-500/20 text-gray-500';
  };

  const getPriorityLabel = (type) => {
    const labels = {
      delivery_failed: 'High',
      wrong_item: 'High',
      delayed: 'Medium',
      price_discrepancy: 'Medium',
      other: 'Low'
    };
    return labels[type] || 'Medium';
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
            <h1 className="text-2xl font-bold">Issues Management</h1>
            <p className="text-gray-400 mt-1">Handle customer complaints and support tickets</p>
          </div>

          {/* Stats Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">Total Issues</p>
              <p className="text-2xl font-bold">{issues.length}</p>
            </div>
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">Open</p>
              <p className="text-2xl font-bold text-red-500">
                {issues.filter(i => i.status === 'open').length}
              </p>
            </div>
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">In Review</p>
              <p className="text-2xl font-bold text-yellow-500">
                {issues.filter(i => i.status === 'in_review').length}
              </p>
            </div>
            <div className="bg-valhala-secondary rounded-xl p-4">
              <p className="text-gray-400 text-sm">Resolved</p>
              <p className="text-2xl font-bold text-green-500">
                {issues.filter(i => i.status === 'resolved').length}
              </p>
            </div>
          </div>

          {/* Issues Table */}
          <IssuesTable
            issues={issues}
            onViewDetails={(issue) => {
              setSelectedIssue(issue);
              setShowDetailsModal(true);
            }}
            onResolve={handleResolveIssue}
          />

          {/* Issue Details Modal */}
          <AnimatePresence>
            {showDetailsModal && selectedIssue && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowDetailsModal(false)}
                  className="fixed inset-0 bg-black/80 z-50"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="fixed inset-0 z-50 flex items-center justify-center p-4"
                >
                  <div className="bg-valhala-secondary rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="sticky top-0 bg-valhala-secondary border-b border-valhala-nordic p-4 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={20} className="text-red-500" />
                        <h2 className="text-xl font-bold">Issue Details</h2>
                      </div>
                      <button onClick={() => setShowDetailsModal(false)} className="p-2 hover:bg-valhala-primary rounded-lg">
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Issue Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Issue ID</p>
                          <p className="font-mono font-semibold">#{selectedIssue.id?.slice(-8)}</p>
                        </div>
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Order ID</p>
                          <p className="font-mono font-semibold">#{selectedIssue.orderId?.slice(-8)}</p>
                        </div>
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Reported On</p>
                          <p className="font-semibold">{formatDate(selectedIssue.createdAt)}</p>
                        </div>
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Status</p>
                          <div className="flex items-center gap-2 mt-1">
                            {selectedIssue.status === 'open' && <Clock size={16} className="text-red-500" />}
                            {selectedIssue.status === 'in_review' && <MessageSquare size={16} className="text-yellow-500" />}
                            {selectedIssue.status === 'resolved' && <CheckCircle size={16} className="text-green-500" />}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              selectedIssue.status === 'open' ? 'bg-red-500/20 text-red-500' :
                              selectedIssue.status === 'in_review' ? 'bg-yellow-500/20 text-yellow-500' :
                              'bg-green-500/20 text-green-500'
                            }`}>
                              {selectedIssue.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Issue Type & Priority */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Issue Type</p>
                          <p className="font-semibold capitalize mt-1">{selectedIssue.type?.replace('_', ' ')}</p>
                        </div>
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <p className="text-gray-400 text-sm">Priority</p>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs mt-1 ${getPriorityColor(selectedIssue.type)}`}>
                            {getPriorityLabel(selectedIssue.type)}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="bg-valhala-primary rounded-lg p-4">
                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                          <MessageSquare size={18} className="text-valhala-accent" />
                          Customer Description
                        </h3>
                        <p className="text-gray-300">{selectedIssue.description}</p>
                      </div>

                      {/* Admin Response */}
                      {selectedIssue.adminResponse && (
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <h3 className="font-semibold mb-2 flex items-center gap-2">
                            <Send size={18} className="text-green-500" />
                            Admin Response
                          </h3>
                          <p className="text-gray-300">{selectedIssue.adminResponse}</p>
                          <p className="text-xs text-gray-400 mt-2">
                            Sent on {formatDate(selectedIssue.respondedAt)}
                          </p>
                        </div>
                      )}

                      {/* Response Form */}
                      {selectedIssue.status !== 'resolved' && (
                        <div className="bg-valhala-primary rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Respond to Customer</h3>
                          <textarea
                            value={adminResponse}
                            onChange={(e) => setAdminResponse(e.target.value)}
                            className="input-primary mb-3"
                            rows="4"
                            placeholder="Type your response here..."
                          />
                          <div className="flex gap-3">
                            <button
                              onClick={handleSendResponse}
                              disabled={submitting}
                              className="flex-1 btn-primary flex items-center justify-center gap-2"
                            >
                              {submitting ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <>
                                  <Send size={16} />
                                  Send Response
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleResolveIssue(selectedIssue.id)}
                              className="flex-1 bg-green-500/20 text-green-500 px-4 py-2 rounded-lg hover:bg-green-500/30 transition-colors"
                            >
                              Mark as Resolved
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default IssuesManagement;