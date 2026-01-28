import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, Brain, Sparkles } from 'lucide-react';
import { attendanceAPI, usersAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { generateInsights, analyzeTrends } from '../services/aiPredictions';

export const AIVisualization: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [chartData, setChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [trends, setTrends] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    totalUsers: 0,
    totalAttendance: 0,
    avgAttendanceRate: 0,
    totalHours: 0
  });

  useEffect(() => {
    fetchVisualizationData();
  }, []);

  const fetchVisualizationData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Fetch attendance data
      const response = await attendanceAPI.getHistory({
        startDate: startOfMonth.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });

      // Fetch users for admin analytics
      let totalUsers = 1;
      if (isAdmin) {
        try {
          const usersResponse = await usersAPI.getAll();
          totalUsers = usersResponse.users?.filter((u: any) => u.status === 'active').length || 1;
        } catch (error) {
          console.error('Error fetching users:', error);
        }
      }

      if (response.attendance) {
        // Process data for visualization - aggregate by day of week
        const dayMap: Record<string, { present: number; late: number; absent: number; total: number }> = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        dayNames.forEach(day => {
          dayMap[day] = { present: 0, late: 0, absent: 0, total: 0 };
        });

        // Count unique users per day for admin, or single user for employees
        const userDayMap: Record<string, Set<number>> = {};
        dayNames.forEach(day => {
          userDayMap[day] = new Set();
        });

        response.attendance.forEach((record: any) => {
          const date = new Date(record.clock_in);
          const dayName = dayNames[date.getDay()];
          const userId = record.user_id || record.userId;
          
          // Track unique users per day
          if (userId) {
            userDayMap[dayName].add(userId);
          }
          
          if (record.status === 'present' || record.status === 'overtime') {
            dayMap[dayName].present++;
          } else if (record.status === 'late') {
            dayMap[dayName].late++;
          } else if (record.status === 'absent') {
            dayMap[dayName].absent++;
          }
          dayMap[dayName].total++;
        });

        const processedData = dayNames.map(dayName => {
          const dayData = dayMap[dayName];
          const uniqueUsers = userDayMap[dayName].size;
          const attendanceRate = isAdmin && totalUsers > 0 
            ? Math.round((uniqueUsers / totalUsers) * 100)
            : dayData.total > 0 
              ? Math.round((dayData.present / dayData.total) * 100)
              : 0;

          return {
            day: dayName,
            present: dayData.present,
            late: dayData.late,
            absent: dayData.absent,
            total: dayData.total,
            uniqueUsers,
            attendanceRate
          };
        });

        setChartData(processedData);

        // Calculate metrics
        const totalAttendance = response.attendance.length;
        const totalPresent = processedData.reduce((sum, d) => sum + d.present, 0);
        const avgAttendanceRate = processedData.length > 0
          ? Math.round(processedData.reduce((sum, d) => sum + d.attendanceRate, 0) / processedData.length)
          : 0;
        const totalHours = response.attendance.reduce((sum: number, r: any) => 
          sum + (parseFloat(r.hours_worked || 0)), 0
        );

        setMetrics({
          totalUsers,
          totalAttendance,
          avgAttendanceRate,
          totalHours: Math.round(totalHours)
        });

        // Generate AI insights using the AI service
        try {
          const insights = await generateInsights(response.attendance, {});
          setAiInsights(insights);

          // Generate trends
          const trendAnalysis = await analyzeTrends(response.attendance);
          setTrends(trendAnalysis);
        } catch (error) {
          console.error('Error generating AI insights:', error);
          // Fallback insights
          const fallbackInsights: string[] = [];
          if (isAdmin) {
            const totalLate = processedData.reduce((sum, d) => sum + d.late, 0);
            const bestDay = processedData.reduce((best, current) => 
              current.attendanceRate > best.attendanceRate ? current : best
            );
            
            if (bestDay.attendanceRate > 0) {
              fallbackInsights.push(`Best attendance day: ${bestDay.day} with ${bestDay.attendanceRate}% attendance rate`);
            }
            if (totalLate > 0) {
              fallbackInsights.push(`Total late arrivals this month: ${totalLate}. Consider addressing punctuality issues.`);
            }
            fallbackInsights.push(`Average attendance rate: ${avgAttendanceRate}% across all users`);
          } else {
            const totalLate = processedData.reduce((sum, d) => sum + d.late, 0);
            const bestDay = processedData.reduce((best, current) => 
              (current.present / (current.total || 1)) > (best.present / (best.total || 1)) ? current : best
            );
            
            if (bestDay.present > 0) {
              fallbackInsights.push(`Your best attendance day is ${bestDay.day} with ${bestDay.present} present days.`);
            }
            if (totalLate > 0) {
              fallbackInsights.push(`You've been late ${totalLate} times this month. Consider improving punctuality.`);
            }
          }
          setAiInsights(fallbackInsights);
        }
      }
    } catch (error) {
      console.error('Error fetching visualization data:', error);
      setAiInsights(['Unable to load analytics data. Please try again later.']);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...chartData.map(d => d.total), 1);

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-8">
          <Brain className="w-6 h-6 text-blue-400 animate-pulse mr-2" />
          <span className="text-gray-400">AI is processing data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">
            {isAdmin ? 'AI-Powered System Analytics' : 'AI-Powered Analytics'}
          </h3>
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
      </div>

      {/* Metrics Summary */}
      {isAdmin && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-white">{metrics.totalUsers}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Avg. Attendance</p>
            <p className="text-2xl font-bold text-green-400">{metrics.avgAttendanceRate}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total Records</p>
            <p className="text-2xl font-bold text-blue-400">{metrics.totalAttendance}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <p className="text-xs text-gray-400 mb-1">Total Hours</p>
            <p className="text-2xl font-bold text-purple-400">{metrics.totalHours}h</p>
          </div>
        </div>
      )}

      <div className="space-y-4 mb-6">
        {chartData.map((item, index) => (
          <motion.div
            key={item.day}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-300 w-12">{item.day}</span>
              <div className="flex-1 mx-4">
                <div className="flex items-center space-x-1 h-6 bg-gray-700 rounded-full overflow-hidden">
                  {item.present > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.present / maxValue) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className="h-full bg-gradient-to-r from-green-400 to-green-500"
                    />
                  )}
                  {item.late > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.late / maxValue) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.2 }}
                      className="h-full bg-gradient-to-r from-yellow-400 to-orange-500"
                    />
                  )}
                  {item.absent > 0 && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(item.absent / maxValue) * 100}%` }}
                      transition={{ duration: 1, delay: index * 0.1 + 0.4 }}
                      className="h-full bg-gradient-to-r from-red-400 to-red-500"
                    />
                  )}
                </div>
              </div>
              <div className="text-sm text-gray-300 w-20 text-right">
                {isAdmin ? `${item.attendanceRate}%` : (item.total > 0 ? `${Math.round((item.present / item.total) * 100)}%` : '0%')}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* AI Insights */}
      {aiInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl"
        >
          <div className="flex items-center space-x-2 mb-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">AI-Generated Insights</h4>
            <Sparkles className="w-3 h-3 text-yellow-400" />
          </div>
          <ul className="space-y-2">
            {aiInsights.slice(0, 4).map((insight, idx) => (
              <li key={idx} className="text-xs text-purple-200 flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Trend Analysis */}
      {trends.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
        >
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            <h4 className="text-sm font-semibold text-white">AI Trend Analysis</h4>
          </div>
          <ul className="space-y-2">
            {trends.map((trend, idx) => (
              <li key={idx} className="text-xs text-blue-200">
                <span className="font-medium">{trend.pattern}</span> ({trend.strength}): {trend.description}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-gray-300">Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-300">Late</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-gray-300">Absent</span>
          </div>
        </div>
        <div className="text-gray-400 flex items-center space-x-2">
          <Brain className="w-4 h-4" />
          <span>AI Analysis</span>
        </div>
      </div>
    </div>
  );
};
