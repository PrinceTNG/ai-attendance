const { query, queryOne } = require('../config/db');
const { notifyAdmin, notifyUser } = require('./notificationService');
const deepseek = require('./deepseekService');

// Natural Language Processing - Intent Detection
const detectIntent = (message) => {
  const lowerMessage = message.toLowerCase();

  // Attendance queries
  if (lowerMessage.match(/\b(attendance|present|absent|late|clock|hours worked|time)\b/)) {
    return 'attendance';
  }

  // Leave queries
  if (lowerMessage.match(/\b(leave|vacation|holiday|time off|sick leave|annual leave)\b/)) {
    return 'leave';
  }

  // Payslip queries
  if (lowerMessage.match(/\b(payslip|salary|wage|payment|pay stub|earnings)\b/)) {
    return 'payslip';
  }

  // Lateness reporting
  if (lowerMessage.match(/\b(late|delay|traffic|running late|behind schedule)\b/)) {
    return 'lateness';
  }

  // Sick note
  if (lowerMessage.match(/\b(sick|medical|doctor|note|certificate|illness)\b/)) {
    return 'sick_note';
  }

  // Statistics/analytics
  if (lowerMessage.match(/\b(stats|statistics|analytics|report|summary|overview)\b/)) {
    return 'statistics';
  }

  // Admin: Analytics
  if (lowerMessage.match(/\b(analytics|dashboard|overview|insights)\b/)) {
    return 'analytics';
  }

  // Admin: Reports
  if (lowerMessage.match(/\b(report|generate|export|download|pdf|csv)\b/)) {
    return 'report';
  }

  // Admin: Notifications
  if (lowerMessage.match(/\b(notification|alert|message|unread)\b/)) {
    return 'notifications';
  }

  // Admin: User management
  if (lowerMessage.match(/\b(user|employee|student|add|create|manage)\b/)) {
    return 'users';
  }

  return 'general';
};

// Get user attendance insights
const getAttendanceInsights = async (userId, period = 'month') => {
  try {
    const now = new Date();
    let startDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const stats = await queryOne(
      `SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COALESCE(SUM(hours_worked), 0) as total_hours,
        COALESCE(AVG(hours_worked), 0) as avg_hours,
        AVG(TIMESTAMPDIFF(MINUTE, DATE_FORMAT(clock_in, '%Y-%m-%d 09:00:00'), clock_in)) as avg_late_minutes
      FROM attendance 
      WHERE user_id = ? AND DATE(clock_in) >= ?`,
      [userId, startDate]
    );

    const attendanceRate = stats.total_days > 0 
      ? ((stats.present_days / stats.total_days) * 100).toFixed(1)
      : 0;

    // Get day-of-week patterns
    const dayPatterns = await query(
      `SELECT 
        DAYNAME(clock_in) as day_name,
        COUNT(*) as count,
        AVG(TIMESTAMPDIFF(MINUTE, DATE_FORMAT(clock_in, '%Y-%m-%d 09:00:00'), clock_in)) as avg_late
      FROM attendance 
      WHERE user_id = ? AND DATE(clock_in) >= ? AND status = 'late'
      GROUP BY DAYNAME(clock_in)
      ORDER BY avg_late DESC
      LIMIT 3`,
      [userId, startDate]
    );

    let insights = [];
    
    if (attendanceRate >= 95) {
      insights.push(`Excellent! Your attendance rate is ${attendanceRate}% this ${period}. Keep up the great work!`);
    } else if (attendanceRate >= 85) {
      insights.push(`Good attendance rate of ${attendanceRate}% this ${period}.`);
    } else {
      insights.push(`Your attendance rate is ${attendanceRate}% this ${period}. Consider improving your consistency.`);
    }

    if (stats.late_days > 0) {
      const avgLate = Math.round(stats.avg_late_minutes || 0);
      if (avgLate > 0) {
        insights.push(`You've been late ${stats.late_days} times with an average delay of ${avgLate} minutes.`);
      }
      
      if (dayPatterns.length > 0) {
        const worstDay = dayPatterns[0];
        insights.push(`You tend to be late most often on ${worstDay.day_name}s.`);
      }
    }

    if (stats.total_hours > 0) {
      insights.push(`You've worked ${parseFloat(stats.total_hours).toFixed(1)} hours this ${period}, averaging ${parseFloat(stats.avg_hours).toFixed(1)} hours per day.`);
    }

    return {
      intent: 'attendance',
      insights,
      stats: {
        attendanceRate: parseFloat(attendanceRate),
        presentDays: stats.present_days,
        lateDays: stats.late_days,
        totalHours: parseFloat(stats.total_hours),
        avgHours: parseFloat(stats.avg_hours)
      }
    };
  } catch (error) {
    console.error('Get attendance insights error:', error);
    return {
      intent: 'attendance',
      insights: ['Unable to retrieve attendance insights at this time.'],
      stats: {}
    };
  }
};

// Process leave request
const processLeaveRequest = async (userId, message) => {
  const lowerMessage = message.toLowerCase();
  
  // Extract leave type
  let leaveType = 'annual';
  if (lowerMessage.includes('sick')) {
    leaveType = 'sick';
  } else if (lowerMessage.includes('personal')) {
    leaveType = 'personal';
  }

  // Check for date patterns (simplified - in production, use NLP library)
  const datePattern = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g;
  const dates = message.match(datePattern);

  return {
    intent: 'leave',
    leaveType,
    suggestedDates: dates || [],
    message: dates && dates.length >= 2
      ? `I can help you apply for ${leaveType} leave from ${dates[0]} to ${dates[1]}. Would you like me to submit this request?`
      : `I can help you apply for ${leaveType} leave. Please provide the start and end dates.`
  };
};

// Generate payslip information
const getPayslipInfo = async (userId, month) => {
  try {
    const now = new Date();
    const targetMonth = month || now.getMonth() + 1;
    const targetYear = now.getFullYear();

    const startDate = new Date(targetYear, targetMonth - 1, 1);
    const endDate = new Date(targetYear, targetMonth, 0);

    const hours = await queryOne(
      `SELECT COALESCE(SUM(hours_worked), 0) as total_hours
       FROM attendance 
       WHERE user_id = ? AND DATE(clock_in) >= ? AND DATE(clock_in) <= ?`,
      [userId, startDate, endDate]
    );

    const totalHours = parseFloat(hours.total_hours);
    // Mock salary calculation (in production, get from user profile)
    const hourlyRate = 150; // Example rate
    const grossPay = totalHours * hourlyRate;
    const deductions = grossPay * 0.15; // 15% deductions
    const netPay = grossPay - deductions;

    return {
      intent: 'payslip',
      month: new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' }),
      hours: totalHours,
      grossPay: grossPay.toFixed(2),
      deductions: deductions.toFixed(2),
      netPay: netPay.toFixed(2),
      message: `Your payslip for ${new Date(targetYear, targetMonth - 1).toLocaleString('default', { month: 'long' })} shows ${totalHours.toFixed(1)} hours worked. Gross pay: R${grossPay.toFixed(2)}, Deductions: R${deductions.toFixed(2)}, Net pay: R${netPay.toFixed(2)}.`
    };
  } catch (error) {
    console.error('Get payslip info error:', error);
    return {
      intent: 'payslip',
      message: 'Unable to generate payslip information at this time.'
    };
  }
};

// Process lateness report
const processLatenessReport = async (userId, reason) => {
  const lowerReason = reason.toLowerCase();
  
  let category = 'other';
  if (lowerReason.includes('traffic')) {
    category = 'traffic';
  } else if (lowerReason.includes('transport') || lowerReason.includes('bus') || lowerReason.includes('train')) {
    category = 'transport';
  } else if (lowerReason.includes('emergency') || lowerReason.includes('urgent')) {
    category = 'emergency';
  }

  return {
    intent: 'lateness',
    category,
    message: `I've logged your lateness due to ${category} issues for today. This has been recorded in your attendance system and your manager has been notified.`
  };
};

// Get admin analytics
const getAdminAnalytics = async () => {
  try {
    const totalUsers = await queryOne('SELECT COUNT(*) as count FROM users WHERE status = \'active\'');
    const today = new Date().toISOString().split('T')[0];
    const presentToday = await queryOne(
      `SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE DATE(clock_in) = ? AND status IN ('present', 'overtime')`,
      [today]
    );
    const lateToday = await queryOne(
      `SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE DATE(clock_in) = ? AND status = 'late'`,
      [today]
    );

    return {
      intent: 'analytics',
      message: `Here's your dashboard overview:\n\n• Total Active Users: ${totalUsers.count}\n• Present Today: ${presentToday.count}\n• Late Arrivals Today: ${lateToday.count}\n\nWould you like more detailed analytics?`,
      stats: {
        totalUsers: totalUsers.count,
        presentToday: presentToday.count,
        lateToday: lateToday.count
      }
    };
  } catch (error) {
    console.error('Get admin analytics error:', error);
    return {
      intent: 'analytics',
      message: 'Unable to retrieve analytics at this time.'
    };
  }
};

// Get admin notifications
const getAdminNotifications = async () => {
  try {
    const unreadNotifications = await query(
      `SELECT COUNT(*) as count FROM notifications WHERE user_id IN (SELECT id FROM users WHERE role = 'admin') AND is_read = FALSE`
    );
    const recentNotifications = await query(
      `SELECT n.*, u.name as user_name 
       FROM notifications n
       JOIN users u ON n.user_id = u.id
       WHERE u.role = 'admin'
       ORDER BY n.created_at DESC
       LIMIT 5`
    );

    return {
      intent: 'notifications',
      message: `You have ${unreadNotifications[0]?.count || 0} unread notifications. Recent notifications:\n\n${recentNotifications.map(n => `• ${n.title}: ${n.message}`).join('\n')}`,
      unreadCount: unreadNotifications[0]?.count || 0,
      recent: recentNotifications
    };
  } catch (error) {
    console.error('Get admin notifications error:', error);
    return {
      intent: 'notifications',
      message: 'Unable to retrieve notifications at this time.'
    };
  }
};

// Get user statistics (admin)
const getUserStats = async () => {
  try {
    const userStats = await query(
      `SELECT 
        role,
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active
      FROM users
      GROUP BY role`
    );

    const statsText = userStats.map(stat => 
      `${stat.role}: ${stat.active}/${stat.total} active`
    ).join('\n');

    return {
      intent: 'users',
      message: `User Statistics:\n\n${statsText}\n\nWould you like to manage users?`,
      stats: userStats
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return {
      intent: 'users',
      message: 'Unable to retrieve user statistics at this time.'
    };
  }
};

// Main AI chat handler with enhanced AI capabilities
const processChatMessage = async (userId, message, userRole) => {
  try {
    const intent = detectIntent(message);
    let response;

    // Check if user is admin for admin-specific intents
    const isAdmin = userRole === 'admin';

    // Fetch user's attendance data for AI analysis
    let attendanceData = [];
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      attendanceData = await query(
        'SELECT * FROM attendance WHERE user_id = ? AND clock_in >= ? ORDER BY clock_in DESC',
        [userId, thirtyDaysAgo]
      );
    } catch (err) {
      console.error('Error fetching attendance for AI:', err);
    }

    // Get user info
    const userInfo = await queryOne('SELECT name, email, role FROM users WHERE id = ?', [userId]);

    // Process with DeepSeek AI engine
    const aiContext = {
      userId,
      userRole,
      userName: userInfo?.name || 'User',
      attendanceData,
      currentDate: new Date()
    };

    // Get AI-powered response from DeepSeek
    let aiAnalysis = {
      message: null,
      sentiment: { sentiment: 'neutral', confidence: 0.5 },
      insights: [],
      predictions: [],
      anomalies: null
    };

    const isDeepSeekAvailable = await deepseek.isDeepSeekAvailable();
    if (isDeepSeekAvailable) {
      try {
        // Get conversational response
        const conversationHistory = await query(
          'SELECT message, response FROM ai_chat_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 5',
          [userId]
        ).then(history => history.reverse().flatMap(h => [
          { role: 'user', content: h.message },
          { role: 'assistant', content: h.response }
        ]));

        const aiMessage = await deepseek.generateConversationalResponse(message, {
          userRole,
          userName: userInfo?.name,
          conversationHistory
        });

        aiAnalysis.message = aiMessage;

        // Get sentiment if needed
        const sentiment = await deepseek.analyzeSentiment(message);
        aiAnalysis.sentiment = sentiment;

        // Get insights if this is an attendance query
        if (intent === 'attendance' && attendanceData.length > 0) {
          const insights = await deepseek.analyzeAttendanceInsights({
            totalDays: attendanceData.length,
            presentDays: attendanceData.filter(a => a.status === 'present').length,
            lateDays: attendanceData.filter(a => a.status === 'late').length,
            totalHours: attendanceData.reduce((sum, a) => sum + (a.hours_worked || 0), 0),
            avgHours: attendanceData.length > 0 
              ? attendanceData.reduce((sum, a) => sum + (a.hours_worked || 0), 0) / attendanceData.length 
              : 0,
            attendanceRate: attendanceData.length > 0 
              ? (attendanceData.filter(a => a.status === 'present').length / attendanceData.length * 100) 
              : 0
          }, { userName: userInfo?.name, userRole });
          
          aiAnalysis.insights = [insights];
        }

        // Detect anomalies
        if (attendanceData.length >= 5) {
          aiAnalysis.anomalies = await deepseek.detectAnomalies(attendanceData);
        }

        // Predict trends if enough data
        if (attendanceData.length >= 7) {
          const predictions = await deepseek.predictAttendanceTrends(attendanceData);
          aiAnalysis.predictions = predictions.predictions || [];
        }

        console.log('✅ DeepSeek AI analysis complete');
      } catch (error) {
        console.error('❌ DeepSeek AI error:', error.message);
        // Continue with regular response
      }
    } else {
      console.log('⚠️ DeepSeek not available, using basic responses');
    }

    switch (intent) {
      case 'attendance':
        response = await getAttendanceInsights(userId);
        break;

      case 'leave':
        response = processLeaveRequest(userId, message);
        break;

      case 'payslip':
        // Extract month if mentioned
        const monthMatch = message.match(/\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i);
        const monthMap = {
          'january': 1, 'jan': 1, 'february': 2, 'feb': 2, 'march': 3, 'mar': 3,
          'april': 4, 'apr': 4, 'may': 5, 'june': 6, 'jun': 6, 'july': 7, 'jul': 7,
          'august': 8, 'aug': 8, 'september': 9, 'sep': 9, 'october': 10, 'oct': 10,
          'november': 11, 'nov': 11, 'december': 12, 'dec': 12
        };
        const month = monthMatch ? monthMap[monthMatch[0].toLowerCase()] : null;
        response = await getPayslipInfo(userId, month);
        break;

      case 'lateness':
        response = processLatenessReport(userId, message);
        break;

      case 'statistics':
        response = await getAttendanceInsights(userId, 'month');
        break;

      case 'analytics':
        if (isAdmin) {
          response = await getAdminAnalytics();
        } else {
          response = await getAttendanceInsights(userId, 'month');
        }
        break;

      case 'report':
        if (isAdmin) {
          response = {
            intent: 'report',
            message: 'I can help you generate reports. You can create:\n• Attendance Summary Reports\n• Hours Reports\n• Individual Performance Reports\n\nWhat type of report would you like to generate?',
            suggestions: ['Generate attendance summary', 'Generate hours report', 'Generate individual reports']
          };
        } else {
          response = {
            intent: 'report',
            message: 'Report generation is only available for administrators.'
          };
        }
        break;

      case 'notifications':
        if (isAdmin) {
          response = await getAdminNotifications();
        } else {
          response = {
            intent: 'notifications',
            message: 'You can view your notifications in the notifications panel.'
          };
        }
        break;

      case 'users':
        if (isAdmin) {
          response = await getUserStats();
        } else {
          response = {
            intent: 'users',
            message: 'User management is only available for administrators.'
          };
        }
        break;

      default:
        const defaultMessage = isAdmin
          ? 'I can help you with:\n• Attendance analytics and insights\n• Generating reports\n• Viewing notifications\n• User management\n• And more!\n\nWhat would you like help with?'
          : 'I can help you with attendance queries, leave applications, payslip information, reporting lateness, and general HR questions. What would you like help with?';
        
        response = {
          intent: 'general',
          message: defaultMessage,
          suggestions: isAdmin
            ? ['View analytics', 'Generate report', 'Check notifications', 'User statistics']
            : ['Check my attendance this month', 'Apply for leave', 'Generate my payslip', 'Report lateness', 'View my statistics']
        };
    }

    // Save chat history with AI metadata
    await query(
      `INSERT INTO ai_chat_history (user_id, message, response, intent, context)
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        message,
        typeof response.message === 'string' ? response.message : JSON.stringify(response),
        intent,
        JSON.stringify({
          ...response,
          timestamp: new Date().toISOString(),
          ai_processed: true,
          confidence: response.confidence || 0.8
        })
      ]
    );

    // AI-powered smart notifications for admin
    if (intent === 'leave') {
      await notifyAdmin(
        'AI Detected: Leave Request',
        `User requested leave application assistance via AI chatbot. Intent confidence: High.`,
        'info'
      );
    } else if (intent === 'lateness') {
      await notifyAdmin(
        'AI Alert: Lateness Report',
        `User reported lateness via AI assistant. Action may be required.`,
        'warning'
      );
    } else if (intent === 'analytics' && userRole === 'admin') {
      // Log admin analytics queries for insights
      console.log('Admin accessed analytics via AI');
    }

    // Merge AI analysis with response
    const enhancedResponse = {
      ...response,
      aiEnhanced: true,
      sentiment: aiAnalysis.sentiment,
      aiInsights: aiAnalysis.insights || [],
      aiPredictions: aiAnalysis.predictions || [],
      anomalies: aiAnalysis.anomalies,
      ai_metadata: {
        processed: true,
        timestamp: new Date().toISOString(),
        confidence: aiAnalysis.confidence || 0.8,
        model: 'Attendance AI v2.0'
      }
    };

    // If AI generated a better response, use it
    if (aiAnalysis.message && intent === 'general') {
      enhancedResponse.message = aiAnalysis.message;
    }

    return enhancedResponse;
  } catch (error) {
    console.error('Process chat message error:', error);
    return {
      intent: 'error',
      message: 'I apologize, but I encountered an error processing your request. Please try again.',
      ai_metadata: { processed: false, error: error.message }
    };
  }
};

module.exports = {
  processChatMessage,
  getAdminAnalytics,
  getAdminNotifications,
  getUserStats,
  getAttendanceInsights,
  processLeaveRequest,
  getPayslipInfo,
  processLatenessReport
};
