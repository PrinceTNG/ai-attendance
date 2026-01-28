import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Calendar, Filter, FileText, Users, Clock, Loader } from 'lucide-react';
import { reportsAPI } from '../services/api';
import { toast } from 'react-toastify';

export const ReportsSection: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [selectedRole, setSelectedRole] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    calculateDateRange();
    fetchRecentReports();
  }, [selectedPeriod]);

  const calculateDateRange = () => {
    const today = new Date();
    let start: Date;
    let end = new Date(today);

    switch (selectedPeriod) {
      case 'today':
        start = new Date(today);
        break;
      case 'week':
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;
      case 'month':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        start = new Date(today.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(today);
        start.setDate(start.getDate() - 7);
    }

    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const fetchRecentReports = async () => {
    try {
      const response = await reportsAPI.getRecent();
      if (response.reports) {
        setRecentReports(response.reports);
      }
    } catch (error) {
      console.error('Error fetching recent reports:', error);
    }
  };

  const reportTypes = [
    {
      title: 'Attendance Summary',
      description: 'Complete attendance overview with statistics',
      icon: <Users className="w-6 h-6" />,
      color: 'blue',
      type: 'attendance_summary'
    },
    {
      title: 'Hours Report',
      description: 'Detailed working hours and overtime analysis',
      icon: <Clock className="w-6 h-6" />,
      color: 'green',
      type: 'hours_report'
    },
    {
      title: 'Individual Reports',
      description: 'Per-user attendance and performance metrics',
      icon: <FileText className="w-6 h-6" />,
      color: 'purple',
      type: 'individual_performance'
    }
  ];

  const handleGenerateReport = async (reportType: string, fileType: 'pdf' | 'csv' = 'pdf') => {
    if (!startDate || !endDate) {
      toast.error('Please select a date range');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      if (reportType === 'Attendance Summary' || reportType === 'attendance_summary') {
        response = await reportsAPI.generateAttendanceSummary({
          periodStart: startDate,
          periodEnd: endDate,
          role: selectedRole === 'all' ? undefined : selectedRole,
          fileType
        });
      } else if (reportType === 'Hours Report' || reportType === 'hours_report') {
        response = await reportsAPI.generateHoursReport({
          periodStart: startDate,
          periodEnd: endDate,
          role: selectedRole === 'all' ? undefined : selectedRole,
          fileType
        });
      } else if (reportType === 'Individual Reports' || reportType === 'individual_performance') {
        // For individual reports, generate attendance summary for now
        response = await reportsAPI.generateAttendanceSummary({
          periodStart: startDate,
          periodEnd: endDate,
          role: selectedRole === 'all' ? undefined : selectedRole,
          fileType
        });
      } else {
        toast.error('Report type not implemented yet');
        setLoading(false);
        return;
      }

      if (response.success) {
        toast.success('Report generated successfully!');
        
        // Download the file using authenticated fetch
        const filename = response.filename || response.filePath?.split(/[/\\]/).pop();
        if (filename) {
          await handleDownloadReport(filename);
        }
        
        // Refresh recent reports
        setTimeout(() => fetchRecentReports(), 1000);
      }
    } catch (error: any) {
      console.error('Error generating report:', error);
      toast.error(error.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async (filename: string) => {
    try {
      const token = localStorage.getItem('token');
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const response = await fetch(`${API_BASE_URL}/reports/download/${filename}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      // Get the blob from response
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Report downloaded successfully!');
    } catch (error: any) {
      console.error('Download error:', error);
      toast.error(error.message || 'Failed to download report');
    }
  };

  return (
    <div className="space-y-8">
      {/* Filters */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Filter className="w-5 h-5 mr-2 text-blue-400" />
          Report Filters
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time Period
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            >
              <option value="today" className="bg-slate-800">Today</option>
              <option value="week" className="bg-slate-800">This Week</option>
              <option value="month" className="bg-slate-800">This Month</option>
              <option value="quarter" className="bg-slate-800">This Quarter</option>
              <option value="year" className="bg-slate-800">This Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              User Role
            </label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            >
              <option value="all" className="bg-slate-800">All Users</option>
              <option value="employee" className="bg-slate-800">Employees</option>
              <option value="student" className="bg-slate-800">Students</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((report, index) => (
          <motion.div
            key={report.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-blue-400/30 transition-all duration-300 group"
          >
            <div className={`w-12 h-12 bg-${report.color}-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <div className={`text-${report.color}-400`}>
                {report.icon}
              </div>
            </div>
            
            <h4 className="text-lg font-semibold text-white mb-2">
              {report.title}
            </h4>
            <p className="text-gray-400 text-sm mb-6">
              {report.description}
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => handleGenerateReport(report.type || report.title, 'pdf')}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Generate PDF
                  </>
                )}
              </button>
              <button
                onClick={() => handleGenerateReport(report.type || report.title, 'csv')}
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 mr-2" />
                    Export CSV
                  </>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Reports */}
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" />
          Recent Reports
        </h3>
        
        <div className="space-y-4">
          {recentReports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No reports generated yet. Generate a report to see it here.
            </div>
          ) : (
            recentReports.map((report, index) => {
              const filename = report.file_path ? report.file_path.split(/[/\\]/).pop() : 'report';
              const reportDate = new Date(report.created_at).toLocaleDateString();
              
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {report.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                      <p className="text-sm text-gray-400">
                        {reportDate} • {new Date(report.period_start).toLocaleDateString()} to {new Date(report.period_end).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full uppercase">
                      {report.file_type || 'pdf'}
                    </span>
                    <button 
                      onClick={() => handleDownloadReport(filename)}
                      className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                      title="Download report"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};