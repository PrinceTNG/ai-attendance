import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Download, 
  BarChart3, 
  Calendar,
  UserCheck,
  AlertCircle,
  Filter
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { AttendanceChart } from '../components/AttendanceChart';
import { ReportsSection } from '../components/ReportsSection';
import { UserManagement } from '../components/UserManagement';
import { RecentActivity } from '../components/RecentActivity';
import { FilterButton } from '../components/FilterButton';
import { AISmartNotifications } from '../components/AISmartNotifications';
import { AIVisualization } from '../components/AIVisualization';
import { LeaveManagement } from '../components/LeaveManagement';
import { ScheduleManagement } from '../components/ScheduleManagement';
import { usersAPI, attendanceAPI, reportsAPI } from '../services/api';
import { toast } from 'react-toastify';

interface StatItem {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

export const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<StatItem[]>([
    {
      title: "Total Users",
      value: "248",
      change: "+12%",
      trend: "up" as const,
      icon: <Users className="w-6 h-6" />,
      color: "blue" as const
    },
    {
      title: "Present Today",
      value: "186",
      change: "+5%",
      trend: "up" as const,
      icon: <UserCheck className="w-6 h-6" />,
      color: "green" as const
    },
    {
      title: "Avg. Hours/Day",
      value: "7.8h",
      change: "+0.3h",
      trend: "up" as const,
      icon: <Clock className="w-6 h-6" />,
      color: "purple" as const
    },
    {
      title: "Late Arrivals",
      value: "0",
      change: "0%",
      trend: "down" as const,
      icon: <AlertCircle className="w-6 h-6" />,
      color: "orange" as const
    }
  ]);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Get all users
      const usersResponse = await usersAPI.getAll();
      const totalUsers = usersResponse.users?.length || 0;
      const activeUsers = usersResponse.users?.filter((u: any) => u.status === 'active').length || 0;

      // Get today's attendance stats for all users
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Get all attendance records for today
      const attendanceResponse = await attendanceAPI.getHistory({
        startDate: todayStr,
        endDate: todayStr
      });

      const todayRecords = attendanceResponse.attendance || [];
      const presentToday = todayRecords.filter((r: any) => r.status === 'present' || r.status === 'overtime').length;
      const lateToday = todayRecords.filter((r: any) => r.status === 'late').length;
      
      // Calculate average hours
      const totalHours = todayRecords.reduce((sum: number, r: any) => {
        return sum + (parseFloat(r.hours_worked?.toString() || '0'));
      }, 0);
      const avgHours = todayRecords.length > 0 ? (totalHours / todayRecords.length).toFixed(1) : '0';

      // Calculate percentage changes (mock for now, can be improved with historical data)
      const presentPercentage = activeUsers > 0 ? Math.round((presentToday / activeUsers) * 100) : 0;

      setStats([
        {
          title: "Total Users",
          value: totalUsers.toString(),
          change: `${activeUsers} active`,
          trend: "up" as const,
          icon: <Users className="w-6 h-6" />,
          color: "blue" as const
        },
        {
          title: "Present Today",
          value: presentToday.toString(),
          change: `${presentPercentage}%`,
          trend: "up" as const,
          icon: <UserCheck className="w-6 h-6" />,
          color: "green" as const
        },
        {
          title: "Avg. Hours/Day",
          value: `${avgHours}h`,
          change: "Today",
          trend: "up" as const,
          icon: <Clock className="w-6 h-6" />,
          color: "purple" as const
        },
        {
          title: "Late Arrivals",
          value: lateToday.toString(),
          change: presentToday > 0 ? `${Math.round((lateToday / presentToday) * 100)}%` : "0%",
          trend: lateToday > 0 ? "up" as const : "down" as const,
          icon: <AlertCircle className="w-6 h-6" />,
          color: "orange" as const
        }
      ]);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleExportData = async () => {
    try {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      toast.info('Generating export...');
      
      const response = await reportsAPI.generateAttendanceSummary({
        periodStart: startOfMonth.toISOString().split('T')[0],
        periodEnd: today.toISOString().split('T')[0],
        fileType: 'csv'
      });

      if (response.success && response.filePath) {
        const filename = response.filePath.split('/').pop();
        if (filename) {
          window.open(reportsAPI.download(filename), '_blank');
          toast.success('Data exported successfully!');
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'users', label: 'User Management', icon: <Users className="w-4 h-4" /> },
    { id: 'schedule', label: 'Schedule', icon: <Clock className="w-4 h-4" /> },
    { id: 'leave', label: 'Leave Requests', icon: <Calendar className="w-4 h-4" /> },
    { id: 'reports', label: 'Reports', icon: <Download className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <TrendingUp className="w-4 h-4" /> }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 md:gap-6">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <StatCard {...stat} />
                </motion.div>
              ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <AIVisualization />
              </motion.div>

              {/* Recent Activity */}
              <RecentActivity />
            </div>

            {/* AI Smart Notifications */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <AISmartNotifications />
            </motion.div>
          </div>
        );

      case 'users':
        return <UserManagement />;

      case 'schedule':
        return <ScheduleManagement />;

      case 'leave':
        return <LeaveManagement />;

      case 'reports':
        return <ReportsSection />;

      case 'analytics':
        return (
          <div className="space-y-6 sm:space-y-8">
            {/* AI-Powered Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
              <AIVisualization />
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-400" />
                  Advanced Analytics
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">Average Attendance Rate</p>
                    <p className="text-3xl font-bold text-white">
                      {stats.find(s => s.title === 'Present Today')?.value 
                        ? Math.round((parseInt(stats.find(s => s.title === 'Present Today')?.value || '0') / parseInt(stats.find(s => s.title === 'Total Users')?.value || '1')) * 100)
                        : 0}%
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Based on today's data</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">System Health</p>
                    <p className="text-3xl font-bold text-green-400">Optimal</p>
                    <p className="text-xs text-gray-400 mt-1">All systems operational</p>
                  </div>
                  <div className="bg-white/5 rounded-xl p-4">
                    <p className="text-gray-400 text-sm mb-2">Late Arrivals Today</p>
                    <p className="text-3xl font-bold text-orange-400">
                      {stats.find(s => s.title === 'Late Arrivals')?.value || '0'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Requires attention</p>
                  </div>
                </div>
              </div>
            </div>
            <AttendanceChart />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1">
              Welcome back, {user?.name}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 md:gap-4">
            <FilterButton onFilterChange={fetchDashboardStats} />
            <button 
              onClick={handleExportData}
              className="flex items-center px-3 sm:px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all text-sm sm:text-base"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Export Data</span>
              <span className="sm:hidden">Export</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-white/10 overflow-x-auto no-scrollbar">
          <nav className="flex gap-4 sm:gap-6 md:gap-8 min-w-max">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-white hover:border-gray-300'
                }`}
              >
                <span className="scale-90 sm:scale-100">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </DashboardLayout>
  );
};