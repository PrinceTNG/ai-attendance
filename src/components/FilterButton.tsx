import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, X, Calendar } from 'lucide-react';

interface FilterButtonProps {
  onFilterChange: (filters: any) => void;
}

export const FilterButton: React.FC<FilterButtonProps> = ({ onFilterChange }) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'week',
    role: 'all',
    status: 'all',
    startDate: '',
    endDate: ''
  });

  const handleApplyFilter = () => {
    onFilterChange(filters);
    setShowFilter(false);
  };

  const handleReset = () => {
    const resetFilters = {
      dateRange: 'week',
      role: 'all',
      status: 'all',
      startDate: '',
      endDate: ''
    };
    setFilters(resetFilters);
    onFilterChange(resetFilters);
    setShowFilter(false);
  };

  return (
    <>
      <button 
        onClick={() => setShowFilter(true)}
        className="flex items-center px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
      >
        <Filter className="w-4 h-4 mr-2" />
        Filter
      </button>

      <AnimatePresence>
        {showFilter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFilter(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-blue-400" />
                  Filter Options
                </h3>
                <button
                  onClick={() => setShowFilter(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Date Range
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters({ ...filters, dateRange: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="today" className="bg-slate-800">Today</option>
                    <option value="week" className="bg-slate-800">This Week</option>
                    <option value="month" className="bg-slate-800">This Month</option>
                    <option value="custom" className="bg-slate-800">Custom Range</option>
                  </select>
                </div>

                {filters.dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Role
                  </label>
                  <select
                    value={filters.role}
                    onChange={(e) => setFilters({ ...filters, role: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="all" className="bg-slate-800">All Roles</option>
                    <option value="admin" className="bg-slate-800">Admin</option>
                    <option value="employee" className="bg-slate-800">Employee</option>
                    <option value="student" className="bg-slate-800">Student</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  >
                    <option value="all" className="bg-slate-800">All Status</option>
                    <option value="present" className="bg-slate-800">Present</option>
                    <option value="late" className="bg-slate-800">Late</option>
                    <option value="absent" className="bg-slate-800">Absent</option>
                  </select>
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  onClick={handleReset}
                  className="flex-1 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={handleApplyFilter}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
                >
                  Apply Filter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
