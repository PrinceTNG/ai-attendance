import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Brain, Sparkles } from 'lucide-react';
import { attendanceAPI } from '../services/api';
import { generateInsights } from '../services/aiPredictions';

export const AttendanceChart: React.FC = () => {
  const [data, setData] = useState([
    { day: 'Mon', present: 0, absent: 0, percentage: 0 },
    { day: 'Tue', present: 0, absent: 0, percentage: 0 },
    { day: 'Wed', present: 0, absent: 0, percentage: 0 },
    { day: 'Thu', present: 0, absent: 0, percentage: 0 },
    { day: 'Fri', present: 0, absent: 0, percentage: 0 },
    { day: 'Sat', present: 0, absent: 0, percentage: 0 },
    { day: 'Sun', present: 0, absent: 0, percentage: 0 }
  ]);
  const [loading, setLoading] = useState(true);
  const [aiInsights, setAiInsights] = useState<string[]>([]);

  useEffect(() => {
    fetchWeeklyData();
  }, []);

  const fetchWeeklyData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      
      const response = await attendanceAPI.getHistory({
        startDate: startOfWeek.toISOString().split('T')[0],
        endDate: today.toISOString().split('T')[0]
      });

      if (response.attendance && response.attendance.length > 0) {
        const dayMap: { [key: number]: { present: number; absent: number; total: number; users: Set<number> } } = {};
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Initialize all days
        for (let i = 0; i < 7; i++) {
          dayMap[i] = { present: 0, absent: 0, total: 0, users: new Set() };
        }

        // Count attendance by day
        response.attendance.forEach((record: any) => {
          const date = new Date(record.clock_in);
          const dayOfWeek = date.getDay();
          const userId = record.user_id || record.userId;
          
          if (userId) {
            dayMap[dayOfWeek].users.add(userId);
          }
          
          if (record.status === 'present' || record.status === 'overtime') {
            dayMap[dayOfWeek].present++;
          } else if (record.status === 'absent') {
            dayMap[dayOfWeek].absent++;
          }
          dayMap[dayOfWeek].total++;
        });

        // Get total users for percentage calculation
        const { usersAPI } = await import('../services/api');
        const usersResponse = await usersAPI.getAll();
        const activeUsers = usersResponse.users?.filter((u: any) => u.status === 'active') || [];
        const totalUsers = activeUsers.length || 1;

        const chartData = dayNames.map((dayName, index) => {
          const dayData = dayMap[index];
          const presentCount = dayData.present;
          const absentCount = dayData.absent;
          const uniqueUsers = dayData.users.size;
          // Calculate percentage based on unique users who attended vs total active users
          const percentage = totalUsers > 0 ? Math.round((uniqueUsers / totalUsers) * 100) : 0;

          return {
            day: dayName,
            present: presentCount,
            absent: absentCount,
            percentage,
            uniqueUsers
          };
        });

        setData(chartData);

        // Generate AI insights
        try {
          const insights = await generateInsights(response.attendance, {
            totalUsers,
            activeUsers: activeUsers.length
          });
          setAiInsights(insights);
        } catch (error) {
          console.error('Error generating AI insights:', error);
          // Fallback insights
          const totalPresent = chartData.reduce((sum, d) => sum + d.present, 0);
          const avgPercentage = Math.round(chartData.reduce((sum, d) => sum + d.percentage, 0) / chartData.length);
          setAiInsights([
            `Average weekly attendance: ${avgPercentage}%`,
            `Total attendance records: ${totalPresent}`,
            `Active users tracked: ${totalUsers}`
          ]);
        }
      } else {
        // No data available
        setAiInsights(['No attendance data available for this week. Data will appear as users clock in.']);
      }
    } catch (error) {
      console.error('Error fetching weekly data:', error);
      setAiInsights(['Unable to load attendance data. Please try again later.']);
    } finally {
      setLoading(false);
    }
  };

  const maxValue = Math.max(...data.map(d => d.present + d.absent), 1);
  const avgPercentage = Math.round(data.reduce((sum, d) => sum + d.percentage, 0) / data.length);

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/20">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-white flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
          AI-Powered Weekly Overview
          <Sparkles className="w-4 h-4 ml-2 text-yellow-400" />
        </h3>
        <div className="flex items-center space-x-2 px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-full">
          <Brain className="w-3 h-3 text-purple-400" />
          <span className="text-xs text-purple-300">AI Analysis</span>
        </div>
      </div>
      
      <div className="space-y-4">
        {data.map((item, index) => (
          <motion.div
            key={item.day}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex items-center space-x-4"
          >
            <div className="w-12 text-sm font-medium text-gray-300">
              {item.day}
            </div>
            <div className="flex-1 flex items-center space-x-2">
              <div className="flex-1 bg-gray-700 rounded-full h-6 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(item.percentage / 100) * 100}%` }}
                  transition={{ duration: 1, delay: index * 0.1 }}
                  className="h-full bg-gradient-to-r from-green-400 to-green-500"
                />
              </div>
              <div className="text-sm text-gray-300 w-16 text-right">
                {item.percentage}%
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            <span className="text-gray-300">Present</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full"></div>
            <span className="text-gray-300">Absent</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-gray-400">
            {loading ? 'AI Analyzing...' : `Average: ${avgPercentage}% attendance`}
          </div>
          {!loading && aiInsights.length > 0 && (
            <div className="flex items-center space-x-2 text-xs text-purple-300">
              <Brain className="w-3 h-3" />
              <span>AI Insights Available</span>
            </div>
          )}
        </div>
      </div>

      {/* AI Insights */}
      {!loading && aiInsights.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl"
        >
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-semibold text-white">AI-Generated Insights</h4>
          </div>
          <ul className="space-y-1">
            {aiInsights.slice(0, 3).map((insight, idx) => (
              <li key={idx} className="text-xs text-purple-200 flex items-start space-x-2">
                <span className="text-purple-400 mt-1">•</span>
                <span>{insight}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}
    </div>
  );
};