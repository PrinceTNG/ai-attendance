import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar } from 'lucide-react';
import { attendanceAPI, usersAPI } from '../services/api';

interface ActivityItem {
  user: string;
  action: string;
  time: string;
  status: string;
}

export const RecentActivity: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivity();
    
    // Auto-refresh every 30 seconds to show new clock in/out activities
    const interval = setInterval(() => {
      fetchRecentActivity();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchRecentActivity = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);

      console.log('📊 Fetching recent activity...');
      
      const [attendanceResponse, usersResponse] = await Promise.all([
        attendanceAPI.getHistory({
          startDate: weekAgo.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0]
        }),
        usersAPI.getAll()
      ]);

      console.log('📊 Attendance response:', {
        hasAttendance: !!attendanceResponse.attendance,
        count: attendanceResponse.attendance?.length || 0
      });
      console.log('👥 Users response:', {
        hasUsers: !!usersResponse.users,
        count: usersResponse.users?.length || 0
      });

      const usersMap = new Map();
      if (usersResponse.users) {
        usersResponse.users.forEach((user: any) => {
          usersMap.set(user.id, user.name);
        });
      }

      const activityList: Array<ActivityItem & { timestamp: Date }> = [];
      
      if (attendanceResponse.attendance && attendanceResponse.attendance.length > 0) {
        // Process all attendance records
        attendanceResponse.attendance.forEach((record: any) => {
          // Use user_name from joined query if available, otherwise lookup
          const userName = record.user_name || usersMap.get(record.user_id) || 'Unknown User';
          
          // Add clock in activity
          if (record.clock_in) {
            const clockInTime = new Date(record.clock_in);
            const status = record.status === 'late' ? 'late' : 
                          record.status === 'present' || record.status === 'overtime' ? 'on-time' : 
                          record.status || 'on-time';
            
            activityList.push({
              user: userName,
              action: 'Clocked In',
              time: clockInTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              status,
              timestamp: clockInTime
            });
          }

          // Add clock out activity
          if (record.clock_out) {
            const clockOutTime = new Date(record.clock_out);
            activityList.push({
              user: userName,
              action: 'Clocked Out',
              time: clockOutTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
              status: 'on-time',
              timestamp: clockOutTime
            });
          }
        });
      }

      // Sort by timestamp (most recent first) and limit to 10
      activityList.sort((a, b) => {
        return b.timestamp.getTime() - a.timestamp.getTime();
      });

      // Remove timestamp before setting state
      const finalActivities = activityList.slice(0, 10).map(({ timestamp, ...rest }) => rest);
      console.log('✅ Processed activities:', finalActivities.length);
      setActivities(finalActivities);
    } catch (error: any) {
      console.error('❌ Error fetching recent activity:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack
      });
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-400" />
          Recent Activity
        </h3>
        <button
          onClick={fetchRecentActivity}
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-gray-400">
            <div className="animate-spin w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-2"></div>
            Loading recent activity...
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No recent activity</p>
            <p className="text-xs mt-1">Activity will appear here as users clock in/out</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={`${activity.user}-${activity.action}-${activity.time}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{activity.user}</p>
                <p className="text-sm text-gray-400">{activity.action}</p>
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-sm text-white font-medium">{activity.time}</p>
                <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                  activity.status === 'on-time' ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                  activity.status === 'late' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  activity.status === 'overtime' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {activity.status.replace('-', ' ')}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
};
