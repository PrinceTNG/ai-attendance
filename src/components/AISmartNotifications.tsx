import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Brain, AlertCircle, CheckCircle, Info, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { notificationsAPI, aiAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-toastify';

interface SmartNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  is_read: boolean;
  priority: 'high' | 'medium' | 'low';
  ai_insight?: string;
  created_at: string;
}

export const AISmartNotifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const [allResponse, unreadResponse, aiSmartNotifs] = await Promise.all([
        notificationsAPI.getAll(),
        notificationsAPI.getUnreadCount(),
        aiAPI.getSmartNotifications().catch(() => ({ notifications: [] }))
      ]);

      if (allResponse.notifications) {
        // AI-powered notification prioritization
        const prioritized = prioritizeNotifications(allResponse.notifications);
        
        // Merge AI-generated smart notifications
        if (aiSmartNotifs?.notifications && aiSmartNotifs.notifications.length > 0) {
          const aiNotifs = aiSmartNotifs.notifications.map((n: any, idx: number) => ({
            id: -idx - 1, // Negative IDs for AI-generated notifications
            title: n.title,
            message: n.message,
            type: n.type || 'info',
            is_read: false,
            priority: n.priority || 'medium',
            ai_insight: n.actionable ? `Actionable: ${n.action}` : 'AI-generated insight',
            created_at: new Date().toISOString(),
            isAI: true
          }));
          
          // Add AI notifications to the beginning
          setNotifications([...aiNotifs, ...prioritized]);
        } else {
          setNotifications(prioritized);
        }
      }

      if (unreadResponse.count !== undefined) {
        setUnreadCount(unreadResponse.count);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // AI-powered notification prioritization
  const prioritizeNotifications = (notifs: any[]): SmartNotification[] => {
    return notifs.map(notif => {
      let priority: 'high' | 'medium' | 'low' = 'medium';
      let aiInsight: string | undefined;

      // Analyze notification content with AI logic
      const lowerTitle = notif.title.toLowerCase();
      const lowerMessage = notif.message.toLowerCase();

      if (lowerTitle.includes('late') || lowerTitle.includes('urgent') || lowerTitle.includes('important')) {
        priority = 'high';
        aiInsight = 'High priority: Requires immediate attention';
      } else if (lowerTitle.includes('success') || lowerMessage.includes('completed')) {
        priority = 'low';
        aiInsight = 'Informational: Action completed successfully';
      }

      // Detect patterns
      if (lowerMessage.includes('clock') && lowerMessage.includes('late')) {
        aiInsight = 'AI Insight: Late arrival detected. Consider adjusting morning routine.';
      } else if (lowerMessage.includes('overtime')) {
        aiInsight = 'AI Insight: Overtime detected. Maintain work-life balance.';
      }

      return {
        ...notif,
        priority,
        ai_insight: aiInsight
      };
    }).sort((a, b) => {
      // Sort by priority and read status
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      if (a.is_read !== b.is_read) {
        return a.is_read ? 1 : -1; // Unread first
      }
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  const markAsRead = async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id.toString());
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Info className="w-5 h-5 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-500/30 bg-red-500/10';
      case 'medium':
        return 'border-yellow-500/30 bg-yellow-500/10';
      default:
        return 'border-blue-500/30 bg-blue-500/10';
    }
  };

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-center py-8">
          <Brain className="w-5 h-5 text-blue-400 animate-pulse mr-2" />
          <span className="text-gray-400">AI is analyzing notifications...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">AI Smart Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount} new
            </span>
          )}
          <Sparkles className="w-4 h-4 text-yellow-400" />
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No notifications</p>
          </div>
        ) : (
          notifications.slice(0, 10).map((notification, index) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 rounded-xl border ${getPriorityColor(notification.priority)} ${
                !notification.is_read ? 'ring-2 ring-blue-400/30' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-white">{notification.title}</h4>
                      {!notification.is_read && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      )}
                      {notification.priority === 'high' && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          High Priority
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-300 mb-2">{notification.message}</p>
                    {notification.ai_insight && (
                      <div className="mt-2 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Brain className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                          <p className="text-xs text-purple-300">{notification.ai_insight}</p>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="ml-2 p-1 text-gray-400 hover:text-white transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
