import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Filter } from 'lucide-react';
import { attendanceAPI } from '../services/api';

interface AttendanceRecord {
  id: number;
  clock_in: string;
  clock_out: string | null;
  hours_worked: number | null;
  status: string;
  location_verified: boolean;
}

export const AttendanceHistory: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [stats, setStats] = useState({
    present_days: 0,
    late_days: 0,
    absent_days: 0,
    total_hours: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceData();
    
    // Auto-refresh every 30 seconds to show new clock in/out records
    const interval = setInterval(() => {
      fetchAttendanceData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [selectedPeriod]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let startDate: string;
      let endDate = today.toISOString().split('T')[0];

      switch (selectedPeriod) {
        case 'week':
          const weekAgo = new Date(today);
          weekAgo.setDate(weekAgo.getDate() - 7);
          startDate = weekAgo.toISOString().split('T')[0];
          break;
        case 'month':
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
          break;
        case 'quarter':
          const quarterStart = new Date(today.getFullYear(), Math.floor(today.getMonth() / 3) * 3, 1);
          startDate = quarterStart.toISOString().split('T')[0];
          break;
        default:
          startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
      }

      console.log('📊 Fetching attendance history:', { startDate, endDate });

      const [historyResponse, statsResponse] = await Promise.all([
        attendanceAPI.getHistory({ startDate, endDate }),
        attendanceAPI.getStats({ startDate, endDate })
      ]);

      console.log('📊 History response:', {
        hasData: !!historyResponse.attendance,
        count: historyResponse.attendance?.length || 0
      });

      if (historyResponse.attendance) {
        setAttendanceData(historyResponse.attendance);
      }
      if (statsResponse.stats) {
        setStats(statsResponse.stats);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'late':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'overtime':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'absent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return '✓';
      case 'late':
        return '⚠';
      case 'overtime':
        return '↗';
      case 'absent':
        return '✗';
      default:
        return '-';
    }
  };

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <h3 className="text-lg sm:text-xl font-semibold text-white flex items-center">
          <Calendar className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-400" />
          Attendance History
        </h3>
        
        <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="flex-1 sm:flex-initial px-2 sm:px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-xs sm:text-sm focus:outline-none focus:border-blue-400 transition-all"
          >
            <option value="week" className="bg-slate-800">This Week</option>
            <option value="month" className="bg-slate-800">This Month</option>
            <option value="quarter" className="bg-slate-800">This Quarter</option>
          </select>
          <button className="flex items-center px-2 sm:px-3 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors text-xs sm:text-sm">
            <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Filter</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="text-green-400 text-xs sm:text-sm font-medium">Present Days</div>
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.present_days || 0}</div>
        </div>
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="text-yellow-400 text-xs sm:text-sm font-medium">Late Days</div>
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.late_days || 0}</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="text-blue-400 text-xs sm:text-sm font-medium">Total Hours</div>
          <div className="text-xl sm:text-2xl font-bold text-white">{parseFloat(String(stats.total_hours || 0)).toFixed(1)}</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4">
          <div className="text-red-400 text-xs sm:text-sm font-medium">Absent Days</div>
          <div className="text-xl sm:text-2xl font-bold text-white">{stats.absent_days || 0}</div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300">Date</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300">Clock In</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300">Clock Out</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300">Hours</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300">Status</th>
              <th className="text-left px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-300">Location</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-2 sm:px-4 py-6 sm:py-8 text-center text-gray-400 text-xs sm:text-sm">
                  Loading attendance data...
                </td>
              </tr>
            ) : attendanceData.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-2 sm:px-4 py-6 sm:py-8 text-center text-gray-400 text-xs sm:text-sm">
                  No attendance records found for the selected period.
                </td>
              </tr>
            ) : (
              attendanceData.map((record, index) => (
                <motion.tr
                  key={record.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-2 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-white font-medium text-xs sm:text-sm">
                        {formatDate(record.clock_in)}
                      </span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-300 text-xs sm:text-sm">{formatTime(record.clock_in)}</span>
                    </div>
                  </td>
                  <td className="px-2 sm:px-4 py-3 sm:py-4">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-gray-300">{formatTime(record.clock_out)}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-white font-medium">
                      {record.hours_worked ? `${parseFloat(record.hours_worked.toString()).toFixed(1)}h` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(record.status)}`}>
                      <span className="mr-1">{getStatusIcon(record.status)}</span>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center space-x-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">
                        {record.location_verified ? 'Verified' : 'Not verified'}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};