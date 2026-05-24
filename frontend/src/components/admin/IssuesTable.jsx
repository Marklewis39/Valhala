import React, { useState } from 'react';
import { formatDate } from '../../utils/formatters';
import { ISSUE_TYPES } from '../../utils/constants';
import { AlertCircle, CheckCircle, MessageSquare, Eye, MoreVertical } from 'lucide-react';
import toast from 'react-hot-toast';

const IssuesTable = ({ issues, onViewDetails, onResolve }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          issue.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || issue.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getIssueTypeLabel = (type) => {
    return ISSUE_TYPES.find(t => t.id === type)?.label || type;
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-1 bg-red-500/20 text-red-500 rounded-full text-xs">Open</span>;
      case 'in_review':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs">In Review</span>;
      case 'resolved':
        return <span className="px-2 py-1 bg-green-500/20 text-green-500 rounded-full text-xs">Resolved</span>;
      default:
        return <span className="px-2 py-1 bg-gray-500/20 text-gray-500 rounded-full text-xs">{status}</span>;
    }
  };

  const getPriorityBadge = (type) => {
    const priority = {
      delivery_failed: 'High',
      delayed: 'Medium',
      price_discrepancy: 'Medium',
      wrong_item: 'High',
      other: 'Low'
    };
    const color = {
      High: 'text-red-500 bg-red-500/20',
      Medium: 'text-yellow-500 bg-yellow-500/20',
      Low: 'text-green-500 bg-green-500/20'
    };
    const level = priority[type] || 'Medium';
    return <span className={`px-2 py-1 rounded-full text-xs ${color[level]}`}>{level}</span>;
  };

  return (
    <div className="bg-valhala-secondary rounded-xl overflow-hidden">
      {/* Filters */}
      <div className="p-4 border-b border-valhala-nordic flex flex-wrap gap-4 justify-between items-center">
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search issues..."
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
            <option value="open">Open</option>
            <option value="in_review">In Review</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>
        <p className="text-sm text-gray-400">{filteredIssues.length} issues found</p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-valhala-primary">
            <tr>
              <th className="text-left p-4 text-sm font-semibold">Issue ID</th>
              <th className="text-left p-4 text-sm font-semibold">Order ID</th>
              <th className="text-left p-4 text-sm font-semibold">Type</th>
              <th className="text-left p-4 text-sm font-semibold">Priority</th>
              <th className="text-left p-4 text-sm font-semibold">Description</th>
              <th className="text-left p-4 text-sm font-semibold">Reported</th>
              <th className="text-left p-4 text-sm font-semibold">Status</th>
              <th className="text-left p-4 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredIssues.map((issue) => (
              <tr key={issue.id} className="border-t border-valhala-nordic hover:bg-valhala-primary/50 transition-colors">
                <td className="p-4">
                  <p className="font-mono text-sm">#{issue.id.slice(-8)}</p>
                </td>
                <td className="p-4">
                  <p className="font-mono text-sm">#{issue.orderId?.slice(-8)}</p>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-gray-400" />
                    <span className="text-sm">{getIssueTypeLabel(issue.type)}</span>
                  </div>
                </td>
                <td className="p-4">
                  {getPriorityBadge(issue.type)}
                </td>
                <td className="p-4">
                  <p className="text-sm max-w-xs truncate">{issue.description}</p>
                </td>
                <td className="p-4">
                  <p className="text-sm">{formatDate(issue.createdAt)}</p>
                </td>
                <td className="p-4">
                  {getStatusBadge(issue.status)}
                </td>
                <td className="p-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onViewDetails(issue)}
                      className="p-2 hover:bg-valhala-primary rounded-lg transition-colors"
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    {issue.status !== 'resolved' && (
                      <button
                        onClick={() => onResolve(issue.id)}
                        className="p-2 hover:bg-green-500/20 text-green-500 rounded-lg transition-colors"
                        title="Resolve"
                      >
                        <CheckCircle size={16} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredIssues.length === 0 && (
        <div className="text-center py-12">
          <CheckCircle size={48} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400">No issues reported</p>
        </div>
      )}
    </div>
  );
};

export default IssuesTable;