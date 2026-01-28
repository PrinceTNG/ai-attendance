import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, MapPin, Clock, Building } from 'lucide-react';
import { toast } from 'react-toastify';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getAuthToken = () => localStorage.getItem('token');

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [settings, setSettings] = useState({
    workStartTime: '09:00',
    workEndTime: '17:00',
    lateThresholdMinutes: '15',
    overtimeThresholdHours: '8',
    officeLatitude: '-26.1942',
    officeLongitude: '28.0578',
    locationRadiusMeters: '5000',
    companyName: 'Initium Venture Solutions'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({
            workStartTime: data.settings.work_start_time || '09:00',
            workEndTime: data.settings.work_end_time || '17:00',
            lateThresholdMinutes: data.settings.late_threshold_minutes || '15',
            overtimeThresholdHours: data.settings.overtime_threshold_hours || '8',
            officeLatitude: data.settings.office_latitude || '-26.1942',
            officeLongitude: data.settings.office_longitude || '28.0578',
            locationRadiusMeters: data.settings.location_radius_meters || '5000',
            companyName: data.settings.company_name || 'Initium Venture Solutions'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          settings: {
            work_start_time: settings.workStartTime,
            work_end_time: settings.workEndTime,
            late_threshold_minutes: settings.lateThresholdMinutes,
            overtime_threshold_hours: settings.overtimeThresholdHours,
            office_latitude: settings.officeLatitude,
            office_longitude: settings.officeLongitude,
            location_radius_meters: settings.locationRadiusMeters,
            company_name: settings.companyName
          }
        })
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
        onClose();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save settings');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-slate-900 rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-semibold text-white">Settings</h3>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Work Hours */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-400" />
                Work Hours
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={settings.workStartTime}
                    onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={settings.workEndTime}
                    onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Attendance Rules */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Attendance Rules</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Late Threshold (minutes)
                  </label>
                  <input
                    type="number"
                    value={settings.lateThresholdMinutes}
                    onChange={(e) => setSettings({ ...settings, lateThresholdMinutes: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Overtime Threshold (hours)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settings.overtimeThresholdHours}
                    onChange={(e) => setSettings({ ...settings, overtimeThresholdHours: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>
            </div>

            {/* Office Location */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-blue-400" />
                Office Location
              </h4>
              <div className="space-y-4">
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 mb-4">
                  <p className="text-xs text-blue-300 mb-2">
                    💡 <strong>Tip:</strong> You can get coordinates from Google Maps. Right-click on a location → "What's here?" → Copy the coordinates.
                  </p>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        if (navigator.geolocation) {
                          navigator.geolocation.getCurrentPosition(
                            (position) => {
                              setSettings({
                                ...settings,
                                officeLatitude: position.coords.latitude.toString(),
                                officeLongitude: position.coords.longitude.toString()
                              });
                              toast.success('Current location captured!');
                            },
                            (error) => {
                              toast.error('Unable to get your location. Please enter coordinates manually.');
                            }
                          );
                        } else {
                          toast.error('Geolocation is not supported by your browser.');
                        }
                      } catch (error) {
                        toast.error('Error getting location');
                      }
                    }}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                  >
                    📍 Use My Current Location
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Latitude
                    </label>
                    <input
                      type="text"
                      placeholder="-26.1942"
                      value={settings.officeLatitude}
                      onChange={(e) => setSettings({ ...settings, officeLatitude: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Example: -26.1942</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Longitude
                    </label>
                    <input
                      type="text"
                      placeholder="28.0578"
                      value={settings.officeLongitude}
                      onChange={(e) => setSettings({ ...settings, officeLongitude: e.target.value })}
                      className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Example: 28.0578</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Location Radius (meters)
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="50000"
                    step="100"
                    value={settings.locationRadiusMeters}
                    onChange={(e) => setSettings({ ...settings, locationRadiusMeters: e.target.value })}
                    className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Allowed distance from office (100m - 50km). Current: {parseInt(settings.locationRadiusMeters) / 1000}km
                  </p>
                </div>
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                  <p className="text-xs text-yellow-300">
                    ⚠️ <strong>Important:</strong> After changing location, users must be within this radius to clock in/out. 
                    Make sure the radius is appropriate for your office location.
                  </p>
                </div>
              </div>
            </div>

            {/* Company Info */}
            <div>
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center">
                <Building className="w-5 h-5 mr-2 text-blue-400" />
                Company Information
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end space-x-4 p-6 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
