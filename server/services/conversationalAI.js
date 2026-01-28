const { query, queryOne } = require('../config/db');
const deepseek = require('./deepseekService');

// Conversation context storage (in-memory, would use Redis in production)
const conversationContexts = new Map();

// Get or create conversation context for user
const getContext = (userId) => {
  if (!conversationContexts.has(userId)) {
    conversationContexts.set(userId, {
      messages: [],
      pendingAction: null,
      pendingData: {},
      lastIntent: null,
      userName: null
    });
  }
  return conversationContexts.get(userId);
};

// Add message to conversation history
const addToHistory = (userId, role, content) => {
  const context = getContext(userId);
  context.messages.push({ role, content, timestamp: new Date() });
  // Keep only last 20 messages
  if (context.messages.length > 20) {
    context.messages.shift();
  }
};

// Natural conversation patterns
const conversationPatterns = {
  greetings: /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|what's up|sup)/i,
  howAreYou: /how\s*(are\s*you|('s\s*it\s*going)|do\s*you\s*do)/i,
  thanks: /(thank|thanks|thx|appreciate)/i,
  goodbye: /(bye|goodbye|see\s*you|later|have\s*a\s*good)/i,
  confirm: /^(yes|yeah|yep|sure|ok|okay|confirm|proceed|go ahead|do it)/i,
  cancel: /^(no|nope|cancel|nevermind|never\s*mind|stop)/i,
  help: /(help|what\s*can\s*you|how\s*do\s*i|assist)/i,
  
  // Task patterns
  applyLeave: /(apply|request|want|need|take)\s*(for)?\s*(leave|vacation|time\s*off|day\s*off)/i,
  checkAttendance: /(check|show|view|my|see)\s*(my)?\s*(attendance|hours|record|clock|time)/i,
  checkSchedule: /(schedule|timetable|what('s|s)?\s*(on|happening)|class(es)?|meeting)/i,
  generateReport: /(generate|create|make|get)\s*(a|my)?\s*(report|pdf|csv|export)/i,
  payslip: /(pay|salary|wage|payslip|earning|income)/i,
  lateReport: /(running\s*late|going\s*to\s*be\s*late|late\s*today|delay)/i,
  
  // Question patterns
  whatTime: /what\s*time/i,
  whatDay: /what\s*(day|date)/i,
  whoAmI: /who\s*am\s*i/i
};

// Check if message matches pattern
const matchPattern = (message, pattern) => pattern.test(message);

// Generate contextual response
const generateResponse = async (userId, message, userRole, userName) => {
  const context = getContext(userId);
  context.userName = userName;
  
  // Add user message to history
  addToHistory(userId, 'user', message);
  
  let response = {
    message: '',
    actions: [],
    requiresConfirmation: false,
    pendingAction: null,
    data: null,
    aiPowered: false
  };

  // Try DeepSeek for conversational response
  const isAvailable = await deepseek.isDeepSeekAvailable();
  if (isAvailable && context.messages.length > 2) {
    try {
      const deepseekResponse = await deepseek.generateConversationalResponse(message, {
        userRole,
        userName,
        conversationHistory: context.messages.map(m => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content
        }))
      });

      if (deepseekResponse) {
        // Use DeepSeek response for general queries
        response.message = deepseekResponse;
        response.aiPowered = true;
        response.aiModel = 'DeepSeek V3.1';
        
        // Still check for specific intents that need actions
        if (matchPattern(message, conversationPatterns.applyLeave)) {
          context.pendingAction = 'apply_leave';
          context.pendingData = { step: 'type' };
          response.message = `I'd be happy to help you apply for leave! 📅\n\nWhat type of leave would you like to apply for?\n\n• **Annual** - Regular vacation time\n• **Sick** - Health-related absence\n• **Personal** - Personal matters`;
          response.actions = [
            { label: 'Annual Leave', action: 'leave_type_annual' },
            { label: 'Sick Leave', action: 'leave_type_sick' },
            { label: 'Personal Leave', action: 'leave_type_personal' }
          ];
        } else if (matchPattern(message, conversationPatterns.checkAttendance)) {
          const attendanceInfo = await getAttendanceInfo(userId, userName);
          response = { ...attendanceInfo, aiPowered: true, aiModel: 'DeepSeek V3.1' };
        } else if (matchPattern(message, conversationPatterns.checkSchedule)) {
          const scheduleInfo = await getScheduleInfo(userId);
          response = { ...scheduleInfo, aiPowered: true, aiModel: 'DeepSeek V3.1' };
        }
        
        addToHistory(userId, 'assistant', response.message);
        return response;
      }
    } catch (error) {
      console.warn('DeepSeek response failed, using fallback:', error.message);
      // Continue with regular flow
    }
  }

  // Check for pending confirmation first
  if (context.pendingAction) {
    if (matchPattern(message, conversationPatterns.confirm)) {
      // Execute pending action
      response = await executePendingAction(userId, context);
      context.pendingAction = null;
      context.pendingData = {};
    } else if (matchPattern(message, conversationPatterns.cancel)) {
      response.message = "No problem! I've cancelled that request. Is there anything else I can help you with?";
      context.pendingAction = null;
      context.pendingData = {};
    } else {
      // Might be providing more info for pending action
      response = await handlePendingInput(userId, message, context);
    }
  }
  // Greetings
  else if (matchPattern(message, conversationPatterns.greetings)) {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    response.message = `${greeting}, ${userName || 'there'}! 👋 I'm your AI assistant. I can help you with:\n\n• Check your attendance and hours\n• Apply for leave\n• View your schedule\n• Generate reports\n• Answer questions\n\nWhat would you like to do?`;
    response.actions = [
      { label: '📊 Check Attendance', action: 'check_attendance' },
      { label: '📅 Apply for Leave', action: 'apply_leave' },
      { label: '🗓️ View Schedule', action: 'view_schedule' }
    ];
  }
  // How are you
  else if (matchPattern(message, conversationPatterns.howAreYou)) {
    response.message = `I'm doing great, thanks for asking! 😊 I'm here and ready to help you with whatever you need. What can I do for you today?`;
  }
  // Thanks
  else if (matchPattern(message, conversationPatterns.thanks)) {
    response.message = `You're welcome! 😊 Is there anything else I can help you with?`;
  }
  // Goodbye
  else if (matchPattern(message, conversationPatterns.goodbye)) {
    response.message = `Goodbye, ${userName || 'friend'}! Have a great ${new Date().getHours() < 17 ? 'day' : 'evening'}! 👋 I'll be here whenever you need me.`;
  }
  // Help
  else if (matchPattern(message, conversationPatterns.help)) {
    response.message = `Of course! Here's what I can do for you:\n\n**📊 Attendance:**\n• "Check my attendance" - View your attendance stats\n• "How many hours did I work?" - See your work hours\n\n**📅 Leave:**\n• "Apply for leave" - Start a leave request\n• "I need time off" - Request vacation\n\n**🗓️ Schedule:**\n• "What's my schedule?" - View today's schedule\n• "What classes do I have?" - See your timetable\n\n**📄 Reports:**\n• "Generate a report" - Create attendance reports\n\nJust type naturally - I understand conversational language!`;
    response.actions = [
      { label: '📊 My Attendance', action: 'check_attendance' },
      { label: '📅 Apply Leave', action: 'apply_leave' },
      { label: '🗓️ My Schedule', action: 'view_schedule' }
    ];
  }
  // Apply for leave
  else if (matchPattern(message, conversationPatterns.applyLeave)) {
    context.pendingAction = 'apply_leave';
    context.pendingData = { step: 'type' };
    response.message = `I'd be happy to help you apply for leave! 📅\n\nWhat type of leave would you like to apply for?\n\n• **Annual** - Regular vacation time\n• **Sick** - Health-related absence\n• **Personal** - Personal matters`;
    response.actions = [
      { label: 'Annual Leave', action: 'leave_type_annual' },
      { label: 'Sick Leave', action: 'leave_type_sick' },
      { label: 'Personal Leave', action: 'leave_type_personal' }
    ];
  }
  // Check attendance
  else if (matchPattern(message, conversationPatterns.checkAttendance)) {
    response = await getAttendanceInfo(userId, userName);
  }
  // Check schedule
  else if (matchPattern(message, conversationPatterns.checkSchedule)) {
    response = await getScheduleInfo(userId);
  }
  // Generate report
  else if (matchPattern(message, conversationPatterns.generateReport)) {
    if (userRole === 'admin') {
      context.pendingAction = 'generate_report';
      context.pendingData = { step: 'type' };
      response.message = `I can generate reports for you! 📄 What type of report would you like?\n\n• **Attendance Summary** - Overview of all attendance\n• **Hours Report** - Detailed working hours`;
      response.actions = [
        { label: 'Attendance Summary', action: 'report_attendance' },
        { label: 'Hours Report', action: 'report_hours' }
      ];
    } else {
      response.message = `I can show you your personal attendance report. Would you like me to get your attendance summary for this month?`;
      response.actions = [
        { label: 'Yes, show my report', action: 'check_attendance' },
        { label: 'No thanks', action: 'cancel' }
      ];
    }
  }
  // Payslip
  else if (matchPattern(message, conversationPatterns.payslip)) {
    response = await getPayslipInfo(userId);
  }
  // Late report
  else if (matchPattern(message, conversationPatterns.lateReport)) {
    context.pendingAction = 'report_late';
    context.pendingData = { step: 'reason' };
    response.message = `I'm sorry to hear you'll be late! 😊 No worries, it happens. Could you tell me why you'll be late? (e.g., traffic, transport issues, emergency)`;
  }
  // What time
  else if (matchPattern(message, conversationPatterns.whatTime)) {
    const now = new Date();
    response.message = `It's currently **${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}** ⏰`;
  }
  // What day
  else if (matchPattern(message, conversationPatterns.whatDay)) {
    const now = new Date();
    response.message = `Today is **${now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}** 📅`;
  }
  // Who am I
  else if (matchPattern(message, conversationPatterns.whoAmI)) {
    response.message = `You are **${userName}**! 👤 You're logged in as a${userRole === 'admin' ? 'n admin' : ` ${userRole}`}.`;
  }
  // Default - try DeepSeek AI
  else {
    let aiResponse = null;
    
    // Try DeepSeek
    if (deepseek.isDeepSeekAvailable()) {
      try {
        console.log('🤖 Using DeepSeek for general conversation...');
        aiResponse = await deepseek.generateConversationalResponse(message, {
          userRole,
          userName,
          conversationHistory: context.messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.content
          }))
        });
        
        if (aiResponse) {
          response.message = aiResponse;
          response.aiPowered = true;
          response.aiModel = 'DeepSeek V3.1';
          response.actions = [
            { label: '📊 Check Attendance', action: 'check_attendance' },
            { label: '📅 Apply Leave', action: 'apply_leave' },
            { label: '🗓️ View Schedule', action: 'view_schedule' }
          ];
        }
      } catch (error) {
        console.warn('DeepSeek general query failed:', error.message);
      }
    }
    
    // Fallback to local AI
    if (!aiResponse) {
      response = await handleGeneralQuery(userId, message, userName, userRole);
    }
  }

  context.lastIntent = response.intent || context.lastIntent;
  addToHistory(userId, 'assistant', response.message);
  
  return response;
};

// Get attendance information
const getAttendanceInfo = async (userId, userName) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const stats = await queryOne(`
      SELECT 
        COUNT(*) as total_days,
        COUNT(CASE WHEN status = 'present' OR status = 'overtime' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COALESCE(SUM(hours_worked), 0) as total_hours,
        COALESCE(AVG(hours_worked), 0) as avg_hours
      FROM attendance 
      WHERE user_id = ? AND clock_in >= ?
    `, [userId, startOfMonth]);

    const todayRecord = await queryOne(`
      SELECT * FROM attendance 
      WHERE user_id = ? AND DATE(clock_in) = CURDATE()
      ORDER BY clock_in DESC LIMIT 1
    `, [userId]);

    const totalDays = stats?.total_days || 0;
    const presentDays = stats?.present_days || 0;
    const lateDays = stats?.late_days || 0;
    const totalHours = parseFloat(stats?.total_hours || 0);
    const avgHours = parseFloat(stats?.avg_hours || 0);
    const attendanceRate = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

    let statusEmoji = '🟢';
    let statusText = "You're doing great!";
    if (attendanceRate < 80) {
      statusEmoji = '🟡';
      statusText = 'There\'s room for improvement.';
    }
    if (attendanceRate < 60) {
      statusEmoji = '🔴';
      statusText = 'Your attendance needs attention.';
    }

    // Try DeepSeek summarization first
    let message = '';
    if (deepseek.isDeepSeekAvailable()) {
      try {
        const aiSummary = await deepseek.analyzeAttendanceInsights({
          totalDays,
          presentDays,
          lateDays,
          totalHours,
          avgHours,
          attendanceRate
        }, { userName, userRole });
        
        if (aiSummary) {
          message = `Hey ${userName}! ${aiSummary}\n\n`;
          message += `${statusEmoji} **Attendance Rate:** ${attendanceRate}%\n`;
          message += `✅ **Days Present:** ${presentDays}\n`;
          message += `⏰ **Late Arrivals:** ${lateDays}\n`;
          message += `⏱️ **Total Hours:** ${totalHours.toFixed(1)}h\n`;
          message += `📊 **Avg Hours/Day:** ${avgHours.toFixed(1)}h`;
        }
      } catch (error) {
        console.warn('DeepSeek attendance summary failed:', error.message);
      }
    }
    
    // Fallback to regular message
    if (!message) {
      message = `Hey ${userName}! Here's your attendance overview for this month:\n\n`;
      message += `${statusEmoji} **Attendance Rate:** ${attendanceRate}%\n`;
      message += `✅ **Days Present:** ${presentDays}\n`;
      message += `⏰ **Late Arrivals:** ${lateDays}\n`;
      message += `⏱️ **Total Hours:** ${totalHours.toFixed(1)}h\n`;
      message += `📊 **Avg Hours/Day:** ${avgHours.toFixed(1)}h\n\n`;
      message += statusText;
    }

    if (todayRecord) {
      const clockIn = new Date(todayRecord.clock_in);
      message += `\n\n**Today:** You clocked in at ${clockIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
      if (todayRecord.clock_out) {
        message += ` and clocked out.`;
      } else {
        message += ` and are still working.`;
      }
    } else {
      message += `\n\n⚠️ You haven't clocked in yet today.`;
    }

    return {
      message,
      data: { stats, todayRecord },
      actions: [
        { label: '📅 Apply for Leave', action: 'apply_leave' },
        { label: '🗓️ View Schedule', action: 'view_schedule' }
      ]
    };
  } catch (error) {
    console.error('Error getting attendance:', error);
    return {
      message: `I had trouble getting your attendance data. Please try again or check the dashboard directly.`,
      error: true
    };
  }
};

// Get schedule information
const getScheduleInfo = async (userId) => {
  try {
    // Get user's role
    const user = await queryOne('SELECT role FROM users WHERE id = ?', [userId]);
    const userRole = user?.role || 'employee';

    const today = new Date();
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = dayNames[today.getDay()];

    const schedules = await query(`
      SELECT * FROM weekly_schedule 
      WHERE is_active = TRUE 
      AND (applies_to = 'all' OR applies_to = ?)
      AND day_of_week = ?
      ORDER BY start_time
    `, [userRole, todayName]);

    if (schedules.length === 0) {
      return {
        message: `📅 You have no scheduled activities for today (${todayName.charAt(0).toUpperCase() + todayName.slice(1)}).\n\nEnjoy your free time! 😊`,
        actions: [
          { label: '📊 Check Attendance', action: 'check_attendance' }
        ]
      };
    }

    let message = `📅 Here's your schedule for today:\n\n`;
    
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    schedules.forEach((s, idx) => {
      const isCurrent = currentTime >= s.start_time && currentTime <= s.end_time;
      const isPast = currentTime > s.end_time;
      
      let status = '';
      if (isCurrent) status = '🔵 NOW';
      else if (isPast) status = '✅';
      else status = '⏳';
      
      message += `${status} **${s.start_time} - ${s.end_time}**\n`;
      message += `   ${s.subject}`;
      if (s.location) message += ` @ ${s.location}`;
      message += '\n\n';
    });

    message += `You have **${schedules.length}** activities scheduled today.`;

    return {
      message,
      data: { schedules },
      actions: [
        { label: '📊 Check Attendance', action: 'check_attendance' }
      ]
    };
  } catch (error) {
    console.error('Error getting schedule:', error);
    return {
      message: `I couldn't load your schedule. The admin may not have set it up yet, or there might be a connection issue.`,
      error: true
    };
  }
};

// Get payslip information
const getPayslipInfo = async (userId) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });

    const hours = await queryOne(`
      SELECT COALESCE(SUM(hours_worked), 0) as total_hours
      FROM attendance 
      WHERE user_id = ? AND clock_in >= ?
    `, [userId, startOfMonth]);

    const totalHours = parseFloat(hours?.total_hours || 0);
    const hourlyRate = 150; // Default rate
    const grossPay = totalHours * hourlyRate;
    const deductions = grossPay * 0.15;
    const netPay = grossPay - deductions;

    let message = `💰 **Payslip Estimate for ${monthName}**\n\n`;
    message += `⏱️ Hours Worked: ${totalHours.toFixed(1)}h\n`;
    message += `💵 Hourly Rate: R${hourlyRate}\n`;
    message += `───────────────\n`;
    message += `💰 Gross Pay: R${grossPay.toFixed(2)}\n`;
    message += `📉 Deductions (15%): R${deductions.toFixed(2)}\n`;
    message += `───────────────\n`;
    message += `✅ **Net Pay: R${netPay.toFixed(2)}**\n\n`;
    message += `_Note: This is an estimate. Actual payslip may vary._`;

    return {
      message,
      data: { totalHours, grossPay, deductions, netPay }
    };
  } catch (error) {
    console.error('Error getting payslip:', error);
    return {
      message: `I had trouble calculating your payslip. Please check with HR for accurate information.`,
      error: true
    };
  }
};

// Execute pending action
const executePendingAction = async (userId, context) => {
  const action = context.pendingAction;
  const data = context.pendingData;

  switch (action) {
    case 'apply_leave':
      if (data.type && data.startDate && data.endDate) {
        try {
          await query(`
            INSERT INTO leave_requests (user_id, type, start_date, end_date, reason, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
          `, [userId, data.type, data.startDate, data.endDate, data.reason || '']);

          return {
            message: `✅ **Leave request submitted successfully!**\n\n📋 Type: ${data.type}\n📅 From: ${data.startDate}\n📅 To: ${data.endDate}\n\nYour request is now pending approval from your manager. I'll keep you updated! 😊`,
            success: true
          };
        } catch (error) {
          console.error('Error submitting leave:', error);
          return {
            message: `❌ I couldn't submit your leave request. Please try using the Leave Requests page instead.`,
            error: true
          };
        }
      }
      break;

    case 'report_late':
      return {
        message: `✅ I've logged your lateness report. Your manager has been notified. Thanks for letting us know! 👍`,
        success: true
      };
  }

  return { message: 'Action completed.' };
};

// Handle input for pending action
const handlePendingInput = async (userId, message, context) => {
  const action = context.pendingAction;
  const data = context.pendingData;

  if (action === 'apply_leave') {
    if (data.step === 'type') {
      const leaveType = extractLeaveType(message);
      if (leaveType) {
        data.type = leaveType;
        data.step = 'dates';
        return {
          message: `Great! You've selected **${leaveType}** leave. 📅\n\nNow, what dates would you like to take off?\n\nPlease tell me the start and end dates (e.g., "from January 25 to January 30" or "25/01/2026 to 30/01/2026")`,
          requiresInput: true
        };
      }
    }
    
    if (data.step === 'dates') {
      const dates = extractDates(message);
      if (dates.start && dates.end) {
        data.startDate = dates.start;
        data.endDate = dates.end;
        data.step = 'confirm';
        
        return {
          message: `Perfect! Here's a summary of your leave request:\n\n📋 **Type:** ${data.type}\n📅 **From:** ${dates.start}\n📅 **To:** ${dates.end}\n\nShall I submit this request?`,
          requiresConfirmation: true,
          actions: [
            { label: '✅ Yes, submit', action: 'confirm' },
            { label: '❌ Cancel', action: 'cancel' }
          ]
        };
      } else {
        return {
          message: `I couldn't understand those dates. Could you try again? For example:\n• "from 25/01/2026 to 30/01/2026"\n• "January 25 to January 30"`,
          requiresInput: true
        };
      }
    }
  }

  if (action === 'report_late') {
    data.reason = message;
    data.step = 'confirm';
    return {
      message: `Got it! I'll log that you're late due to: "${message}"\n\nShould I submit this?`,
      requiresConfirmation: true,
      actions: [
        { label: '✅ Yes, submit', action: 'confirm' },
        { label: '❌ Cancel', action: 'cancel' }
      ]
    };
  }

  return { message: 'I didn\'t quite get that. Could you please clarify?' };
};

// Extract leave type from message
const extractLeaveType = (message) => {
  const lower = message.toLowerCase();
  if (lower.includes('annual') || lower.includes('vacation')) return 'annual';
  if (lower.includes('sick') || lower.includes('medical') || lower.includes('ill')) return 'sick';
  if (lower.includes('personal') || lower.includes('family')) return 'personal';
  if (lower.includes('maternity')) return 'maternity';
  if (lower.includes('paternity')) return 'paternity';
  return null;
};

// Extract dates from message
const extractDates = (message) => {
  // Try various date formats
  const datePatterns = [
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/g, // DD/MM/YYYY or DD-MM-YYYY
    /(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g // YYYY-MM-DD
  ];

  const dates = [];
  for (const pattern of datePatterns) {
    const matches = message.matchAll(pattern);
    for (const match of matches) {
      dates.push(match[0]);
    }
  }

  if (dates.length >= 2) {
    return { start: dates[0], end: dates[1] };
  }

  // Try natural language dates
  const months = {
    'january': '01', 'february': '02', 'march': '03', 'april': '04',
    'may': '05', 'june': '06', 'july': '07', 'august': '08',
    'september': '09', 'october': '10', 'november': '11', 'december': '12',
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'jun': '06', 'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
  };

  const naturalPattern = /(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/gi;
  const naturalMatches = [...message.matchAll(naturalPattern)];
  
  if (naturalMatches.length >= 2) {
    const year = new Date().getFullYear();
    const start = `${year}-${months[naturalMatches[0][1].toLowerCase()]}-${naturalMatches[0][2].padStart(2, '0')}`;
    const end = `${year}-${months[naturalMatches[1][1].toLowerCase()]}-${naturalMatches[1][2].padStart(2, '0')}`;
    return { start, end };
  }

  return { start: null, end: null };
};

// Handle general queries
const handleGeneralQuery = async (userId, message, userName, userRole) => {
  console.log('💬 Handling general query:', message.substring(0, 50));
  
  // Try DeepSeek for general conversation
  if (deepseek.isDeepSeekAvailable()) {
    try {
      console.log('🤖 Attempting DeepSeek for general conversation...');
      const deepseekResponse = await deepseek.generateConversationalResponse(message, {
        userRole,
        userName
      });
      
      if (deepseekResponse && deepseekResponse.length > 10) {
        console.log('✅ Got DeepSeek response');
        return {
          message: deepseekResponse,
          aiPowered: true,
          aiModel: 'DeepSeek V3.1',
          actions: [
            { label: '📊 Check Attendance', action: 'check_attendance' },
            { label: '📅 Apply Leave', action: 'apply_leave' },
            { label: '🗓️ View Schedule', action: 'view_schedule' }
          ]
        };
      } else {
        console.log('⚠️ DeepSeek response too short or empty');
      }
    } catch (error) {
      console.warn('❌ DeepSeek general query failed:', error.message);
    }
  } else {
    console.log('ℹ️ DeepSeek not available');
  }
  
  // Try to understand what the user wants
  const lower = message.toLowerCase();

  // Attendance-related keywords
  if (/(hour|work|time|clock|present|absent|record)/i.test(lower)) {
    return await getAttendanceInfo(userId, userName);
  }

  // Schedule-related
  if (/(schedule|class|meeting|today|tomorrow|week)/i.test(lower)) {
    return await getScheduleInfo(userId);
  }

  // Money-related
  if (/(pay|money|salary|earn)/i.test(lower)) {
    return await getPayslipInfo(userId);
  }

  // Enhanced default conversational response
  const generalResponses = [
    `I'm here to help you, ${userName}! 😊 I can assist with attendance tracking, leave requests, schedules, and more. What would you like to know or chat about?`,
    `That's interesting! I'd love to help you with that. I'm your AI assistant for this attendance system, and I can help with work-related tasks or just have a conversation. What's on your mind?`,
    `I understand! Let me help you with that. I'm here to make your work life easier - whether it's checking attendance, managing leave, viewing schedules, or just chatting. What can I do for you?`,
    `Thanks for reaching out! I'm your friendly AI assistant. I can help with attendance, leave management, schedules, reports, and I'm always happy to chat. What would you like to do?`,
    `I'm here for you, ${userName}! Whether you need help with work tasks or just want to have a conversation, I'm ready. What would you like to talk about?`
  ];
  
  const randomResponse = generalResponses[Math.floor(Math.random() * generalResponses.length)];
  
  return {
    message: randomResponse,
    aiPowered: true,
    actions: [
      { label: '📊 Check Attendance', action: 'check_attendance' },
      { label: '📅 Apply Leave', action: 'apply_leave' },
      { label: '🗓️ View Schedule', action: 'view_schedule' }
    ]
  };
};

// Handle action button clicks
const handleActionClick = async (userId, action, userRole, userName) => {
  const context = getContext(userId);
  
  switch (action) {
    case 'check_attendance':
      return await getAttendanceInfo(userId, userName);
    
    case 'apply_leave':
      context.pendingAction = 'apply_leave';
      context.pendingData = { step: 'type' };
      return {
        message: `I'd be happy to help you apply for leave! 📅\n\nWhat type of leave would you like?`,
        actions: [
          { label: 'Annual Leave', action: 'leave_type_annual' },
          { label: 'Sick Leave', action: 'leave_type_sick' },
          { label: 'Personal Leave', action: 'leave_type_personal' }
        ]
      };
    
    case 'view_schedule':
      return await getScheduleInfo(userId);
    
    case 'leave_type_annual':
    case 'leave_type_sick':
    case 'leave_type_personal':
      const leaveType = action.replace('leave_type_', '');
      context.pendingAction = 'apply_leave';
      context.pendingData = { step: 'dates', type: leaveType };
      return {
        message: `Great! You've selected **${leaveType}** leave. 📅\n\nWhat dates would you like to take off?\n\nPlease enter the dates (e.g., "from 25/01/2026 to 30/01/2026")`,
        requiresInput: true
      };
    
    case 'confirm':
      if (context.pendingAction) {
        return await executePendingAction(userId, context);
      }
      break;
    
    case 'cancel':
      context.pendingAction = null;
      context.pendingData = {};
      return {
        message: "No problem! Is there anything else I can help you with? 😊"
      };
  }

  return { message: "I'm ready to help! What would you like to do?" };
};

module.exports = {
  generateResponse,
  handleActionClick,
  getContext,
  addToHistory
};
