import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus, Trash2, Save, Clock, MapPin, Users } from 'lucide-react';
import { scheduleAPI } from '../services/api';
import { toast } from 'react-toastify';

interface ScheduleEntry {
  id?: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  subject: string;
  description: string;
  location: string;
  appliesTo: string;
  isActive?: boolean;
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const DAY_LABELS: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday'
};

export const ScheduleManagement: React.FC = () => {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEntry, setNewEntry] = useState<ScheduleEntry>({
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '10:00',
    subject: '',
    description: '',
    location: 'Main Office',
    appliesTo: 'all'
  });

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await scheduleAPI.getAllSchedules();
      if (response.success) {
        setSchedules(response.schedules.map((s: any) => ({
          id: s.id,
          dayOfWeek: s.day_of_week,
          startTime: s.start_time,
          endTime: s.end_time,
          subject: s.subject || '',
          description: s.description || '',
          location: s.location || 'Main Office',
          appliesTo: s.applies_to || 'all',
          isActive: s.is_active
        })));
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.subject.trim()) {
      toast.error('Please enter a subject/activity name');
      return;
    }

    if (!newEntry.startTime || !newEntry.endTime) {
      toast.error('Please select both start and end times');
      return;
    }

    if (newEntry.startTime >= newEntry.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    setSaving(true);
    try {
      const response = await scheduleAPI.createSchedule(newEntry);
      if (response.success) {
        toast.success('Schedule entry added successfully!');
        setShowAddModal(false);
        setNewEntry({
          dayOfWeek: 'monday',
          startTime: '09:00',
          endTime: '10:00',
          subject: '',
          description: '',
          location: 'Main Office',
          appliesTo: 'all'
        });
        await fetchSchedules();
      } else {
        toast.error((response as any).error || 'Failed to add schedule entry');
      }
    } catch (error: any) {
      console.error('Create schedule error:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Failed to add schedule entry. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this schedule entry?')) {
      return;
    }

    try {
      const response = await scheduleAPI.deleteSchedule(id.toString());
      if (response.success) {
        toast.success('Schedule entry deleted');
        fetchSchedules();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete schedule entry');
    }
  };

  const getSchedulesForDay = (day: string) => {
    return schedules.filter(s => s.dayOfWeek === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getAppliesColor = (appliesTo: string) => {
    switch (appliesTo) {
      case 'employee':
        return 'bg-blue-500/20 text-blue-400';
      case 'student':
        return 'bg-purple-500/20 text-purple-400';
      default:
        return 'bg-green-500/20 text-green-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-200px)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Calendar className="w-6 h-6 mr-2 text-blue-400" />
            Weekly Schedule Management
          </h2>
          <p className="text-gray-400 mt-1">Set the weekly schedule for employees and students</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Schedule Entry</span>
        </motion.button>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {DAYS.slice(0, 5).map((day) => (
          <div key={day} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-400 mr-2"></div>
              {DAY_LABELS[day]}
            </h3>
            
            <div className="space-y-3">
              {getSchedulesForDay(day).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No schedule entries</p>
              ) : (
                getSchedulesForDay(day).map((entry, idx) => (
                  <motion.div
                    key={entry.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white/5 rounded-lg border border-white/10 hover:border-blue-400/30 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-blue-400 font-medium">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>
                        <h4 className="text-white font-medium">{entry.subject}</h4>
                        {entry.description && (
                          <p className="text-xs text-gray-400 mt-1">{entry.description}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="flex items-center text-xs text-gray-400">
                            <MapPin className="w-3 h-3 mr-1" />
                            {entry.location}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getAppliesColor(entry.appliesTo)}`}>
                            {entry.appliesTo === 'all' ? 'All' : entry.appliesTo}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => entry.id && handleDeleteEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Weekend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {DAYS.slice(5).map((day) => (
          <div key={day} className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
              <div className="w-2 h-2 rounded-full bg-orange-400 mr-2"></div>
              {DAY_LABELS[day]}
            </h3>
            
            <div className="space-y-3">
              {getSchedulesForDay(day).length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No schedule entries</p>
              ) : (
                getSchedulesForDay(day).map((entry, idx) => (
                  <motion.div
                    key={entry.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Clock className="w-3 h-3 text-gray-400" />
                          <span className="text-sm text-orange-400 font-medium">
                            {entry.startTime} - {entry.endTime}
                          </span>
                        </div>
                        <h4 className="text-white font-medium">{entry.subject}</h4>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="flex items-center text-xs text-gray-400">
                            <MapPin className="w-3 h-3 mr-1" />
                            {entry.location}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${getAppliesColor(entry.appliesTo)}`}>
                            {entry.appliesTo === 'all' ? 'All' : entry.appliesTo}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => entry.id && handleDeleteEntry(entry.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Entry Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => !saving && setShowAddModal(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-xl p-6 border border-white/10 max-w-md w-full my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center">
                <Plus className="w-5 h-5 mr-2 text-blue-400" />
                Add Schedule Entry
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Day of Week</label>
                <select
                  value={newEntry.dayOfWeek}
                  onChange={(e) => setNewEntry({ ...newEntry, dayOfWeek: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  {DAYS.map(day => (
                    <option key={day} value={day} className="bg-slate-800">{DAY_LABELS[day]}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Start Time</label>
                  <input
                    type="time"
                    value={newEntry.startTime}
                    onChange={(e) => setNewEntry({ ...newEntry, startTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">End Time</label>
                  <input
                    type="time"
                    value={newEntry.endTime}
                    onChange={(e) => setNewEntry({ ...newEntry, endTime: e.target.value })}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject/Activity</label>
                <input
                  type="text"
                  value={newEntry.subject}
                  onChange={(e) => setNewEntry({ ...newEntry, subject: e.target.value })}
                  placeholder="e.g., Team Meeting, Training Session"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Location</label>
                <input
                  type="text"
                  value={newEntry.location}
                  onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                  placeholder="e.g., Conference Room A"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Description (Optional)</label>
                <textarea
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Applies To</label>
                <select
                  value={newEntry.appliesTo}
                  onChange={(e) => setNewEntry({ ...newEntry, appliesTo: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                >
                  <option value="all" className="bg-slate-800">All Users</option>
                  <option value="employee" className="bg-slate-800">Employees Only</option>
                  <option value="student" className="bg-slate-800">Students Only</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleAddEntry}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Entry
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
