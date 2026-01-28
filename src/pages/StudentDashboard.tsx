import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { 
  Clock, 
  Calendar, 
  BookOpen, 
  MessageCircle,
  Timer,
  Target,
  Award,
  GraduationCap
} from 'lucide-react';
import { DashboardLayout } from '../components/DashboardLayout';
import { ClockInOut } from '../components/ClockInOut';
import { AttendanceHistory } from '../components/AttendanceHistory';
import { AIChatbot } from '../components/AIChatbot';
import { AIPredictionsPanel } from '../components/AIPredictionsPanel';
import { AIVisualization } from '../components/AIVisualization';
import { MyLeaveRequests } from '../components/MyLeaveRequests';
import { WeeklyScheduleView } from '../components/WeeklyScheduleView';
import { attendanceAPI } from '../services/api';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showChatbot, setShowChatbot] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'leave'>('dashboard');
  const [todayStats, setTodayStats] = useState({
    clockedIn: false,
    clockInTime: null as string | null,
    hoursAttended: '0',
    classesAttended: 0,
    status: 'Not Clocked In'
  });
  const [weeklySchedule, setWeeklySchedule] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchTodayStatus();
    fetchWeeklyStats();
  }, []);

  const fetchTodayStatus = async () => {
    try {
      const response = await attendanceAPI.getTodayStatus();
      if (response.attendance) {
        const attendance = response.attendance;
        const isClockedIn = attendance.clock_out === null;
        const clockInTime = attendance.clock_in ? new Date(attendance.clock_in) : null;
        
        let hoursAttended = 0;
        if (isClockedIn && clockInTime) {
          hoursAttended = (new Date().getTime() - clockInTime.getTime()) / (1000 * 60 * 60);
        } else if (attendance.hours_worked) {
          hoursAttended = parseFloat(attendance.hours_worked.toString());
        }

        // Estimate classes (assuming 1.5 hours per class)
        const classesAttended = Math.floor(hoursAttended / 1.5);
        
        setTodayStats({
          clockedIn: isClockedIn,
          clockInTime: clockInTime ? clockInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
          hoursAttended: hoursAttended.toFixed(1),
          classesAttended,
          status: isClockedIn ? (attendance.status === 'late' ? 'Late' : 'Present') : 'Not Clocked In'
        });
      }
    } catch (error) {
      console.error('Error fetching today status:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWeeklyStats = async () => {
    try {
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      
      const response = await attendanceAPI.getHistory({
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });

      if (response.attendance) {
        const dayMap: { [key: string]: { hours: number; count: number } } = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        response.attendance.forEach((record: any) => {
          const date = new Date(record.clock_in);
          const dayName = dayNames[date.getDay()];
          const hours = parseFloat(record.hours_worked || 0);
          
          if (!dayMap[dayName]) {
            dayMap[dayName] = { hours: 0, count: 0 };
          }
          dayMap[dayName].hours += hours;
          dayMap[dayName].count += 1;
        });

        const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const todayDay = dayNames[today.getDay()];
        
        const schedule = weekDays.map(day => {
          const data = dayMap[day] || { hours: 0, count: 0 };
          const estimatedClasses = Math.floor(data.hours / 1.5);
          const targetClasses = 6; // Assuming 6 classes per day
          const percentage = targetClasses > 0 ? Math.min(100, Math.round((estimatedClasses / targetClasses) * 100)) : 0;
          
          return {
            day,
            classes: targetClasses,
            attended: estimatedClasses,
            percentage
          };
        });

        setWeeklySchedule(schedule);
      }
    } catch (error) {
      console.error('Error fetching weekly stats:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('leave')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === 'leave'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              Leave Requests
            </button>
          </div>
        </div>

        {activeTab === 'leave' ? (
          <MyLeaveRequests />
        ) : (
          <>
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Good {currentTime.getHours() < 12 ? 'morning' : currentTime.getHours() < 18 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-400 mt-1 flex items-center">
                  <GraduationCap className="w-4 h-4 mr-2" />
                  {currentTime.toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {currentTime.toLocaleTimeString('en-US', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="text-sm text-gray-400">
                  Current Time
                </div>
              </div>
            </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-500/20 to-teal-500/20 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Status</p>
                <p className="text-2xl font-bold text-white">{todayStats.status}</p>
                <p className="text-xs text-gray-400">
                  {todayStats.clockInTime ? `Since ${todayStats.clockInTime}` : 'Not clocked in yet'}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-400 text-sm font-medium">Hours Today</p>
                <p className="text-2xl font-bold text-white">{todayStats.hoursAttended}h</p>
                <p className="text-xs text-gray-400">Learning time</p>
              </div>
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                <Timer className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-orange-400/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-400 text-sm font-medium">Classes Today</p>
                <p className="text-2xl font-bold text-white">{todayStats.classesAttended}/6</p>
                <p className="text-xs text-gray-400">Attendance rate</p>
              </div>
              <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-2xl p-6 border border-purple-400/20"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Weekly Goal</p>
                <p className="text-2xl font-bold text-white">
                  {weeklySchedule.length > 0 
                    ? Math.round(weeklySchedule.reduce((sum, d) => sum + d.percentage, 0) / weeklySchedule.length)
                    : 0}%
                </p>
                <p className="text-xs text-gray-400">Attendance target</p>
              </div>
              <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                <Target className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Clock In/Out Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="lg:col-span-1"
          >
            <ClockInOut onStatusChange={() => {
              fetchTodayStatus();
              fetchWeeklyStats();
            }} />
          </motion.div>

          {/* Weekly Class Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className="lg:col-span-2"
          >
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-blue-400" />
                This Week's Class Attendance
              </h3>
              <div className="space-y-4">
                {weeklySchedule.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    No attendance data for this week yet
                  </div>
                ) : (
                  weeklySchedule.map((day, index) => (
                  <div key={day.day} className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className={`w-3 h-3 rounded-full ${
                        day.percentage === 100 ? 'bg-green-400' :
                        day.percentage >= 80 ? 'bg-yellow-400' :
                        day.percentage > 0 ? 'bg-orange-400' :
                        'bg-gray-600'
                      }`} />
                      <span className="text-white font-medium">{day.day}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-gray-300">{day.attended}/{day.classes}</span>
                      <div className="w-32 bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${
                            day.percentage === 100 ? 'bg-green-400' :
                            day.percentage >= 80 ? 'bg-yellow-400' :
                            day.percentage > 0 ? 'bg-orange-400' :
                            'bg-gray-600'
                          }`}
                          style={{ width: `${day.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-400 w-12">{day.percentage}%</span>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Weekly Schedule (from Admin) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <WeeklyScheduleView />
        </motion.div>

        {/* Attendance History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <AttendanceHistory />
        </motion.div>

        {/* AI Assistant Button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.0 }}
          onClick={() => setShowChatbot(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/25 hover:scale-110 transition-all duration-300 flex items-center justify-center z-40"
          style={{ boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)' }}
        >
          <MessageCircle className="w-8 h-8" />
        </motion.button>

        {/* AI Chatbot */}
        {showChatbot && (
          <AIChatbot onClose={() => setShowChatbot(false)} />
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};