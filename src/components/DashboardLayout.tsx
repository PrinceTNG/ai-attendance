import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, Settings, Bell, User, UserCog } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationsPanel } from './NotificationsPanel';
import { SettingsModal } from './SettingsModal';
import { ProfileEditModal } from './ProfileEditModal';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { notificationsAPI } = await import('../services/api');
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="bg-white/5 backdrop-blur-sm border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            {/* Logo */}
            <div className="flex items-center flex-1 min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent truncate">
                Initial Venture Solutions
              </h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-1 sm:gap-2 md:gap-3 lg:gap-4">
              <button 
                onClick={() => setShowNotifications(true)}
                className="p-2 text-gray-400 hover:text-white transition-colors relative flex-shrink-0"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </button>
              {isAdmin ? (
                <button 
                  onClick={() => setShowSettings(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  title="Admin Settings"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              ) : (
                <button 
                  onClick={() => setShowProfileEdit(true)}
                  className="p-2 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                  title="Edit Profile"
                  aria-label="Edit Profile"
                >
                  <UserCog className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              
              <div className="hidden md:flex items-center gap-2 lg:gap-3">
                <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
                </div>
                <div className="hidden lg:block min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-white truncate max-w-[120px]">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors flex-shrink-0"
                aria-label="Logout"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline text-xs sm:text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={showNotifications} 
        onClose={() => {
          setShowNotifications(false);
          fetchUnreadCount();
        }} 
      />

      {/* Settings Modal (Admin only) */}
      {isAdmin && (
        <SettingsModal 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {/* Profile Edit Modal (Employees/Students) */}
      {!isAdmin && (
        <ProfileEditModal 
          isOpen={showProfileEdit} 
          onClose={() => setShowProfileEdit(false)} 
        />
      )}
    </div>
  );
};