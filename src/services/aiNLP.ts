// Advanced AI Natural Language Processing Service
// This provides intelligent understanding of user queries with context awareness

export interface AIResponse {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  context: string[];
  response: string;
  actions?: string[];
  data?: any;
}

export interface QueryContext {
  userId: string;
  userRole: 'admin' | 'employee' | 'student';
  previousMessages: Array<{ role: string; content: string }>;
  currentDate: Date;
  userStats?: any;
}

// Advanced intent detection with confidence scoring
export const detectIntentAdvanced = (message: string, context: QueryContext): AIResponse => {
  const lowerMessage = message.toLowerCase().trim();
  const words = lowerMessage.split(/\s+/);
  
  // Intent patterns with confidence scores
  const intentPatterns = [
    {
      intent: 'attendance_check',
      patterns: [
        { pattern: /\b(attendance|present|absent|clock|punch|time in|time out)\b/i, weight: 0.9 },
        { pattern: /\b(how many|how much|count|total)\b.*\b(days|hours|times)\b/i, weight: 0.8 },
        { pattern: /\b(my|me|I)\b.*\b(attendance|record|history)\b/i, weight: 0.95 }
      ],
      keywords: ['attendance', 'present', 'absent', 'clock', 'hours', 'days']
    },
    {
      intent: 'leave_request',
      patterns: [
        { pattern: /\b(leave|vacation|holiday|time off|day off|sick leave)\b/i, weight: 0.9 },
        { pattern: /\b(apply|request|need|want)\b.*\b(leave|off)\b/i, weight: 0.85 },
        { pattern: /\b(annual|sick|personal|emergency)\b.*\b(leave)\b/i, weight: 0.95 }
      ],
      keywords: ['leave', 'vacation', 'holiday', 'off', 'sick']
    },
    {
      intent: 'payslip',
      patterns: [
        { pattern: /\b(payslip|salary|wage|payment|pay stub|earnings|income)\b/i, weight: 0.9 },
        { pattern: /\b(how much|what is|show|get|generate)\b.*\b(pay|salary|wage)\b/i, weight: 0.85 },
        { pattern: /\b(my|me)\b.*\b(payslip|salary|pay)\b/i, weight: 0.95 }
      ],
      keywords: ['payslip', 'salary', 'wage', 'payment', 'pay']
    },
    {
      intent: 'lateness_report',
      patterns: [
        { pattern: /\b(late|delay|tardy|running late|behind)\b/i, weight: 0.9 },
        { pattern: /\b(report|inform|notify)\b.*\b(late|delay|tardy)\b/i, weight: 0.85 },
        { pattern: /\b(traffic|transport|emergency)\b.*\b(late|delay)\b/i, weight: 0.8 }
      ],
      keywords: ['late', 'delay', 'tardy', 'traffic', 'transport']
    },
    {
      intent: 'analytics',
      patterns: [
        { pattern: /\b(analytics|statistics|stats|insights|overview|dashboard)\b/i, weight: 0.9 },
        { pattern: /\b(show|display|view|get)\b.*\b(analytics|stats|insights)\b/i, weight: 0.85 },
        { pattern: /\b(how|what)\b.*\b(performance|trend|pattern)\b/i, weight: 0.8 }
      ],
      keywords: ['analytics', 'statistics', 'stats', 'insights', 'trends']
    },
    {
      intent: 'report_generate',
      patterns: [
        { pattern: /\b(report|generate|create|export|download)\b/i, weight: 0.9 },
        { pattern: /\b(attendance|hours|summary)\b.*\b(report)\b/i, weight: 0.85 },
        { pattern: /\b(pdf|csv|excel)\b.*\b(report|export)\b/i, weight: 0.8 }
      ],
      keywords: ['report', 'generate', 'export', 'download', 'pdf', 'csv']
    },
    {
      intent: 'notifications',
      patterns: [
        { pattern: /\b(notification|alert|message|unread|notify)\b/i, weight: 0.9 },
        { pattern: /\b(show|check|view|get)\b.*\b(notification|alert)\b/i, weight: 0.85 },
        { pattern: /\b(how many|count)\b.*\b(notification|alert|message)\b/i, weight: 0.8 }
      ],
      keywords: ['notification', 'alert', 'message', 'unread']
    },
    {
      intent: 'user_management',
      patterns: [
        { pattern: /\b(user|employee|student|staff|member)\b/i, weight: 0.7 },
        { pattern: /\b(add|create|delete|update|manage)\b.*\b(user|employee)\b/i, weight: 0.9 },
        { pattern: /\b(list|show|view|get)\b.*\b(all|all users|employees)\b/i, weight: 0.85 }
      ],
      keywords: ['user', 'employee', 'student', 'add', 'create', 'manage']
    },
    {
      intent: 'greeting',
      patterns: [
        { pattern: /\b(hi|hello|hey|greetings|good morning|good afternoon|good evening)\b/i, weight: 0.95 },
        { pattern: /\b(how are you|what's up|how's it going)\b/i, weight: 0.9 }
      ],
      keywords: ['hi', 'hello', 'hey', 'greetings']
    },
    {
      intent: 'help',
      patterns: [
        { pattern: /\b(help|assist|support|guide|what can you do)\b/i, weight: 0.95 },
        { pattern: /\b(how|what|tell me)\b.*\b(do|can|help)\b/i, weight: 0.8 }
      ],
      keywords: ['help', 'assist', 'support', 'guide']
    }
  ];

  // Calculate confidence scores for each intent
  const intentScores: Record<string, number> = {};
  
  intentPatterns.forEach(({ intent, patterns, keywords }) => {
    let score = 0;
    let matches = 0;
    
    // Check pattern matches
    patterns.forEach(({ pattern, weight }) => {
      if (pattern.test(message)) {
        score += weight;
        matches++;
      }
    });
    
    // Check keyword matches
    keywords.forEach(keyword => {
      if (lowerMessage.includes(keyword)) {
        score += 0.1;
        matches++;
      }
    });
    
    // Normalize score
    if (matches > 0) {
      score = Math.min(score / matches, 1.0);
    }
    
    intentScores[intent] = score;
  });

  // Find best intent
  const bestIntent = Object.entries(intentScores)
    .sort(([, a], [, b]) => (b as number) - (a as number))[0];
  
  const [intent, confidence] = bestIntent || ['general', 0.5];

  // Extract entities
  const entities = extractEntities(message, intent);

  // Build context
  const contextMessages = context.previousMessages.slice(-3); // Last 3 messages

  return {
    intent,
    confidence: confidence as number,
    entities,
    context: contextMessages.map(m => m.content),
    response: '',
    actions: [],
    data: {}
  };
};

// Extract entities from message
const extractEntities = (message: string, intent: string): Record<string, any> => {
  const entities: Record<string, any> = {};
  const lowerMessage = message.toLowerCase();

  // Date extraction
  const datePatterns = [
    /\b(today|now|current)\b/i,
    /\b(yesterday)\b/i,
    /\b(tomorrow)\b/i,
    /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g,
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+(\d{1,2})/i,
    /\b(this|last|next)\s+(week|month|year|quarter)\b/i
  ];

  datePatterns.forEach(pattern => {
    const match = message.match(pattern);
    if (match) {
      entities.date = match[0];
    }
  });

  // Time period extraction
  if (/\b(week|month|year|quarter|day)\b/i.test(message)) {
    const periodMatch = message.match(/\b(this|last|next)?\s*(week|month|year|quarter|day)\b/i);
    if (periodMatch) {
      entities.period = periodMatch[0];
    }
  }

  // Leave type extraction
  if (intent === 'leave_request') {
    if (/\b(sick|illness|medical)\b/i.test(message)) {
      entities.leaveType = 'sick';
    } else if (/\b(annual|vacation|holiday)\b/i.test(message)) {
      entities.leaveType = 'annual';
    } else if (/\b(personal|family|emergency)\b/i.test(message)) {
      entities.leaveType = 'personal';
    }
  }

  // Report type extraction
  if (intent === 'report_generate') {
    if (/\b(attendance|summary)\b/i.test(message)) {
      entities.reportType = 'attendance_summary';
    } else if (/\b(hours|time)\b/i.test(message)) {
      entities.reportType = 'hours_report';
    } else if (/\b(pdf)\b/i.test(message)) {
      entities.format = 'pdf';
    } else if (/\b(csv|excel)\b/i.test(message)) {
      entities.format = 'csv';
    }
  }

  // Number extraction
  const numberMatch = message.match(/\b(\d+)\b/);
  if (numberMatch) {
    entities.number = parseInt(numberMatch[1]);
  }

  return entities;
};

// Generate intelligent response based on intent and context
export const generateAIResponse = async (
  intent: string,
  entities: Record<string, any>,
  context: QueryContext,
  data?: any
): Promise<string> => {
  const responses: Record<string, (entities: any, context: QueryContext, data?: any) => string> = {
    greeting: () => {
      const hour = new Date().getHours();
      const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
      return `${greeting}! I'm your AI assistant. I can help you with attendance, leave requests, payslips, and more. How can I assist you today?`;
    },
    
    help: () => {
      if (context.userRole === 'admin') {
        return `I can help you with:\n\n• **Analytics & Insights** - View attendance trends and patterns\n• **Generate Reports** - Create PDF/CSV reports\n• **Notifications** - Check system alerts and messages\n• **User Management** - Manage employees and students\n• **Attendance Queries** - Get detailed attendance information\n\nWhat would you like to do?`;
      }
      return `I can help you with:\n\n• **Attendance** - Check your attendance history and stats\n• **Leave Requests** - Apply for leave\n• **Payslips** - View your salary information\n• **Lateness Reports** - Report when you're running late\n• **General Queries** - Ask me anything about your attendance\n\nWhat would you like to know?`;
    },
    
    attendance_check: (entities, context, data) => {
      if (data?.stats) {
        const { attendanceRate = 0, presentDays = 0, lateDays = 0, totalHours = 0 } = data.stats;
        const hoursDisplay = typeof totalHours === 'number' ? totalHours.toFixed(1) : '0.0';
        const rateDisplay = typeof attendanceRate === 'number' ? attendanceRate : 0;
        return `Here's your attendance overview:\n\n📊 **Attendance Rate:** ${rateDisplay}%\n✅ **Present Days:** ${presentDays}\n⏰ **Late Arrivals:** ${lateDays}\n⏱️ **Total Hours:** ${hoursDisplay}h\n\n${data.insights?.join('\n') || ''}`;
      }
      return 'Let me fetch your attendance information...';
    },
    
    leave_request: (entities) => {
      const leaveType = entities.leaveType || 'annual';
      return `I can help you apply for ${leaveType} leave. ${entities.date ? `You mentioned: ${entities.date}` : 'Please provide the start and end dates for your leave request.'}`;
    },
    
    payslip: (entities, context, data) => {
      if (data) {
        const hoursDisplay = typeof data.hours === 'number' ? data.hours.toFixed(1) : '0.0';
        return `Your payslip information:\n\n💰 **Gross Pay:** R${data.grossPay || '0.00'}\n📉 **Deductions:** R${data.deductions || '0.00'}\n💵 **Net Pay:** R${data.netPay || '0.00'}\n⏱️ **Hours Worked:** ${hoursDisplay}h\n\nMonth: ${data.month || 'Current'}`;
      }
      return 'Let me fetch your payslip information...';
    },
    
    lateness_report: (entities) => {
      const reason = entities.reason || 'general';
      return `I've logged your lateness report. The reason has been recorded as: ${reason}. Your manager has been notified.`;
    },
    
    analytics: (entities, context, data) => {
      if (data && context.userRole === 'admin') {
        return `📊 **Dashboard Analytics:**\n\n👥 Total Users: ${data.totalUsers}\n✅ Present Today: ${data.presentToday}\n⏰ Late Today: ${data.lateToday}\n\nWould you like more detailed analytics?`;
      }
      return 'Analytics are only available for administrators.';
    },
    
    report_generate: (entities) => {
      const reportType = entities.reportType || 'attendance_summary';
      const format = entities.format || 'pdf';
      return `I can generate a ${reportType.replace('_', ' ')} report in ${format.toUpperCase()} format. What date range would you like?`;
    },
    
    notifications: (entities, context, data) => {
      if (data) {
        return `You have ${data.unreadCount || 0} unread notifications. ${data.recent?.length > 0 ? `Recent: ${data.recent.map((n: any) => n.title).join(', ')}` : ''}`;
      }
      return 'Let me check your notifications...';
    },
    
    user_management: (entities, context) => {
      if (context.userRole === 'admin') {
        return `I can help you manage users. You can add, update, or view user information. What would you like to do?`;
      }
      return 'User management is only available for administrators.';
    },
    
    general: () => {
      return 'I understand you need help. Could you be more specific? I can assist with attendance, leave, payslips, and more.';
    }
  };

  const responseGenerator = responses[intent] || responses.general;
  return responseGenerator(entities, context, data);
};

// Context-aware conversation memory
export class AIConversationMemory {
  private conversations: Map<string, Array<{ role: string; content: string; timestamp: Date }>> = new Map();

  addMessage(userId: string, role: 'user' | 'assistant', content: string) {
    if (!this.conversations.has(userId)) {
      this.conversations.set(userId, []);
    }
    
    const conversation = this.conversations.get(userId)!;
    conversation.push({
      role,
      content,
      timestamp: new Date()
    });
    
    // Keep only last 20 messages
    if (conversation.length > 20) {
      conversation.shift();
    }
  }

  getContext(userId: string): Array<{ role: string; content: string }> {
    const conversation = this.conversations.get(userId) || [];
    return conversation.map(({ role, content }) => ({ role, content }));
  }

  clear(userId: string) {
    this.conversations.delete(userId);
  }
}

export const conversationMemory = new AIConversationMemory();
