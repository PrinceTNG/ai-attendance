import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle, XCircle, Clock, FileText, Plus, AlertCircle } from 'lucide-react';
import { leaveAPI } from '../services/api';
import { toast } from 'react-toastify';

interface LeaveRequest {
  id: number;
  type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  approved_by: number | null;
  approver_name: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  document_url: string | null;
  created_at: string;
}

export const MyLeaveRequests: React.FC = () => {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'annual',
    startDate: '',
    endDate: '',
    reason: ''
  });

  useEffect(() => {
    fetchLeaveRequests();
  }, [filter]);

  const fetchLeaveRequests = async () => {
    try {
      setLoading(true);
      console.log('📋 Fetching my leave requests with filter:', filter);
      
      const response = await leaveAPI.getAll({
        status: filter === 'all' ? undefined : filter
      });
      
      console.log('📋 My leave requests response:', {
        success: response.success,
        count: response.requests?.length || 0
      });
      
      if (response.success) {
        setRequests(response.requests || []);
      } else {
        console.error('❌ Leave requests API returned success: false');
        toast.error('Failed to load leave requests');
      }
    } catch (error: any) {
      console.error('❌ Error fetching leave requests:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    try {
      if (!formData.startDate || !formData.endDate) {
        toast.error('Please select start and end dates');
        return;
      }

      const response = await leaveAPI.create({
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || undefined
      });

      if (response.success) {
        toast.success('✅ Leave request submitted successfully');
        setShowCreateModal(false);
        setFormData({ type: 'annual', startDate: '', endDate: '', reason: '' });
        fetchLeaveRequests();
      }
    } catch (error: any) {
      console.error('Error creating leave request:', error);
      toast.error(error.message || 'Failed to submit leave request');
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm('Are you sure you want to cancel this leave request?')) {
      return;
    }

    try {
      console.log('🚫 Cancelling leave request:', id);
      const response = await leaveAPI.cancel(id.toString());
      console.log('🚫 Cancel response:', response);
      if (response.success) {
        toast.success('Leave request cancelled');
        fetchLeaveRequests();
      } else {
        toast.error('Failed to cancel leave request');
      }
    } catch (error: any) {
      console.error('❌ Error cancelling leave:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      toast.error(error.message || 'Failed to cancel leave request');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default:
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'annual':
        return 'bg-blue-500/20 text-blue-400';
      case 'sick':
        return 'bg-red-500/20 text-red-400';
      case 'personal':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateDays = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-400" />
            My Leave Requests
          </h2>
          <p className="text-gray-400 mt-1">View and manage your leave requests</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Requests</p>
              <p className="text-2xl font-bold text-white">{requests.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-yellow-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-400">{pendingCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-green-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Approved</p>
              <p className="text-2xl font-bold text-green-400">{approvedCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-red-500/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Rejected</p>
              <p className="text-2xl font-bold text-red-400">{rejectedCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex space-x-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              filter === status
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading leave requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">No leave requests found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-4">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${getTypeColor(request.type)}`}>
                      {request.type}
                    </span>
                    <span className={`px-3 py-1 rounded text-sm font-medium border ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Date Range</p>
                        <p className="text-sm text-white">
                          {formatDate(request.start_date)} - {formatDate(request.end_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Duration</p>
                        <p className="text-sm text-white">{calculateDays(request.start_date, request.end_date)} days</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-400">Submitted</p>
                        <p className="text-sm text-white">{formatDate(request.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  {request.reason && (
                    <div className="mb-4 p-3 bg-white/5 rounded-lg">
                      <p className="text-xs text-gray-400 mb-1">Reason</p>
                      <p className="text-sm text-white">{request.reason}</p>
                    </div>
                  )}

                  {request.rejection_reason && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-xs text-red-400 mb-1">Rejection Reason</p>
                      <p className="text-sm text-red-300">{request.rejection_reason}</p>
                    </div>
                  )}

                  {request.approver_name && (
                    <p className="text-xs text-gray-400">
                      {request.status === 'approved' ? 'Approved' : 'Rejected'} by {request.approver_name} on{' '}
                      {request.approved_at ? formatDate(request.approved_at) : 'N/A'}
                    </p>
                  )}
                </div>

                {request.status === 'pending' && (
                  <button
                    onClick={() => handleCancel(request.id)}
                    className="ml-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg font-medium transition-all"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl p-6 border border-white/10 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Create Leave Request</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Leave Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="annual">Annual Leave</option>
                  <option value="sick">Sick Leave</option>
                  <option value="personal">Personal Leave</option>
                  <option value="maternity">Maternity Leave</option>
                  <option value="paternity">Paternity Leave</option>
                  <option value="unpaid">Unpaid Leave</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason (Optional)</label>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="Enter reason for leave..."
                  rows={4}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setFormData({ type: 'annual', startDate: '', endDate: '', reason: '' });
                }}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRequest}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Submit Request
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
