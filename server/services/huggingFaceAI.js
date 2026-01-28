// Hugging Face AI Integration Service
// Free AI features using Hugging Face's Inference API

const HUGGING_FACE_API_URL = 'https://api-inference.huggingface.co/models';

// Optional API key from environment
const HF_API_KEY = process.env.HUGGINGFACE_API_KEY || null;

// Free models for AI features (using more reliable models)
const FREE_MODELS = {
  textGeneration: 'gpt2', // More reliable than DialoGPT
  chatGeneration: 'microsoft/DialoGPT-medium', // For conversational responses
  sentiment: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
  classification: 'facebook/bart-large-mnli',
  summarization: 'facebook/bart-large-cnn',
  qa: 'deepset/roberta-base-squad2'
};

// Check if Hugging Face is available
const isHuggingFaceAvailable = () => {
  return !!HF_API_KEY && HF_API_KEY.startsWith('hf_');
};

// Call Hugging Face API (optional - falls back to local AI if unavailable)
const callHuggingFaceAPI = async (model, inputs, options = {}) => {
  if (!isHuggingFaceAvailable()) {
    console.log('HuggingFace API key not configured, using local AI');
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || 15000);

    const response = await fetch(`${HUGGING_FACE_API_URL}/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ inputs }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`HuggingFace API error (${response.status}):`, errorText.substring(0, 200));
      
      // If model is loading, wait a bit and retry once
      if (response.status === 503 && !options.retried) {
        console.log('Model is loading, waiting 5 seconds...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        return callHuggingFaceAPI(model, inputs, { ...options, retried: true });
      }
      
      return null;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('HuggingFace API request timeout');
    } else {
      console.warn('HuggingFace API unavailable, using local AI:', error.message);
    }
    return null;
  }
};

// AI-powered text generation with Hugging Face
const generateAIText = async (prompt, context) => {
  // Try HuggingFace API first for better text generation
  if (isHuggingFaceAvailable()) {
    try {
      console.log('🤖 Attempting HuggingFace API call...');
      
      // Use a simpler, more reliable approach - just use the prompt directly
      // Try GPT2 first (more reliable)
      let hfResponse = await callHuggingFaceAPI(FREE_MODELS.textGeneration, prompt, { timeout: 10000 });
      
      // If GPT2 fails, try chat model
      if (!hfResponse || !hfResponse[0]?.generated_text) {
        console.log('GPT2 failed, trying DialoGPT...');
        hfResponse = await callHuggingFaceAPI(FREE_MODELS.chatGeneration, prompt, { timeout: 10000 });
      }
      
      if (hfResponse && hfResponse[0]?.generated_text) {
        let generatedText = hfResponse[0].generated_text;
        console.log('📝 Raw HuggingFace response:', generatedText.substring(0, 100));
        
        // Clean up the response (remove the original prompt if it's included)
        const promptLower = prompt.toLowerCase();
        const textLower = generatedText.toLowerCase();
        
        if (textLower.includes(promptLower)) {
          // Remove prompt from beginning
          const promptIndex = textLower.indexOf(promptLower);
          if (promptIndex === 0) {
            generatedText = generatedText.substring(prompt.length).trim();
          } else {
            // Try to extract just the new part
            generatedText = generatedText.replace(new RegExp(prompt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
          }
        }
        
        // Remove any incomplete sentences at the end
        generatedText = generatedText.trim();
        
        // If we got a reasonable response, use it
        if (generatedText.length > 5) {
          console.log('✅ Using HuggingFace AI response:', generatedText.substring(0, 50));
          return generatedText;
        } else {
          console.log('⚠️ HuggingFace response too short, using fallback');
        }
      } else {
        console.log('⚠️ HuggingFace returned empty response');
      }
    } catch (error) {
      console.warn('❌ HuggingFace text generation failed:', error.message);
    }
  } else {
    console.log('ℹ️ HuggingFace not available, using local AI');
  }
  
  // Fall back to local intelligent response
  console.log('💬 Using enhanced local AI fallback');
  return generateIntelligentResponse(prompt, context);
};

// Fallback intelligent response generator when API is unavailable
const generateIntelligentResponse = (message, context) => {
  const lowerMessage = message.toLowerCase();
  const userRole = context.userRole || 'employee';
  const userName = context.userName || 'there';
  
  // Enhanced conversational responses for general chat
  const generalConversations = [
    `Hi ${userName}! I'm your AI assistant. I'm here to help you with attendance, leave requests, schedules, and more. What would you like to chat about? 😊`,
    `Hello! Great to talk with you! I can help with various things like checking your attendance, applying for leave, viewing your schedule, or just having a conversation. What's on your mind?`,
    `Hey there! I'm excited to help you today. Whether you need information about your work schedule, want to check your attendance, or just want to chat, I'm here for you!`,
    `Hi ${userName}! How can I assist you today? I'm pretty good at helping with work-related tasks, but I also enjoy just chatting. What would you like to talk about?`,
    `Hello! I'm your friendly AI assistant. I can help you with attendance tracking, leave management, schedules, and I'm always up for a good conversation. What would you like to do?`,
    `Hey! Nice to meet you! I'm here to make your work life easier. I can help with attendance, leave requests, reports, and I'm always happy to chat. What can I do for you?`
  ];
  
  // Enhanced response templates based on intent
  const responses = {
    greeting: [
      `Hello ${userName}! I'm your AI-powered attendance assistant. How can I help you today?`,
      `Hi there! I'm ready to assist you with attendance, leave requests, or any other queries.`,
      `Welcome back! What would you like help with today?`
    ],
    attendance: [
      `Based on your attendance data, I can provide insights about your patterns. Your attendance history shows consistency in your clock-in times. Would you like detailed analytics?`,
      `I've analyzed your attendance records. Let me show you a summary of your attendance patterns and any areas for improvement.`,
      `Your attendance data is being processed. I can see trends in your work patterns that might be useful for planning.`
    ],
    leave: [
      `I can help you with leave management. You can apply for annual leave, sick leave, or personal leave. Would you like me to start a leave application?`,
      `Leave requests are processed through our AI system. I can help you check your leave balance and submit new requests.`,
      `For leave applications, please provide the type of leave, start date, and end date. I'll process it for you.`
    ],
    payslip: [
      `I can generate your payslip based on your attendance records. This includes your worked hours, overtime calculations, and deductions.`,
      `Your payslip information is available. Would you like me to calculate your earnings for this month?`,
      `Payslip generation is ready. I'll compile your hours worked, overtime, and estimated pay based on your attendance.`
    ],
    analytics: userRole === 'admin' ? [
      `As an admin, you have access to comprehensive analytics. Current overview: attendance rates, late arrivals, and user activity patterns are available.`,
      `Dashboard analytics show overall team performance. I can provide detailed breakdowns by department, role, or time period.`,
      `Analytics engine is processing your request. Team attendance trends, productivity metrics, and anomalies are being analyzed.`
    ] : [
      `I can show you personal analytics including your attendance patterns, work hours trends, and performance insights.`,
      `Your personal analytics dashboard shows your attendance consistency and areas where you excel.`
    ],
    report: [
      `I can generate various reports for you: Attendance Summary, Hours Report, or Individual Performance reports. Which would you prefer?`,
      `Report generation is available in PDF and CSV formats. I'll compile the data based on your selected date range.`,
      `Reports are ready to be generated. Please specify the type and date range for your report.`
    ],
    help: [
      `I'm here to help! I can assist with:\n\n- Attendance tracking and history\n- Leave applications and balance\n- Payslip generation\n- Reports and analytics\n- General HR queries\n\nWhat would you like to know?`,
      `As your AI assistant, I offer:\n\n- Smart attendance insights\n- Automated leave processing\n- Predictive analytics\n- Natural language queries\n\nAsk me anything!`
    ],
    late: [
      `I understand you may be running late. I can log this with your reason and notify your supervisor. What's the reason for the delay?`,
      `Lateness reports help maintain transparency. I'll record the time and reason, and the system will adjust your attendance accordingly.`
    ],
    prediction: [
      `Based on AI analysis of your patterns, I can predict attendance trends, identify potential issues, and suggest improvements.`,
      `Predictive analytics suggest your attendance patterns. Would you like to see forecasted trends for the coming weeks?`
    ]
  };

  // Determine intent from message
  let intent = 'general';
  
  // Check for greetings first
  if (/\b(hi|hello|hey|good morning|good afternoon|good evening|greetings|sup|what's up)\b/i.test(lowerMessage)) {
    intent = 'greeting';
  } 
  // Check for general conversation indicators
  else if (/\b(how are you|how's it going|what's up|tell me|talk|chat|conversation|about you|who are you)\b/i.test(lowerMessage)) {
    intent = 'general';
  }
  // Check for specific intents
  else if (/\b(attendance|present|absent|clock|punch|check in|check out)\b/i.test(lowerMessage)) {
    intent = 'attendance';
  } else if (/\b(leave|vacation|holiday|time off|day off|sick)\b/i.test(lowerMessage)) {
    intent = 'leave';
  } else if (/\b(pay|salary|wage|payslip|earnings|income)\b/i.test(lowerMessage)) {
    intent = 'payslip';
  } else if (/\b(analytics|stats|statistics|dashboard|insights|overview)\b/i.test(lowerMessage)) {
    intent = 'analytics';
  } else if (/\b(report|generate|export|download|pdf|csv)\b/i.test(lowerMessage)) {
    intent = 'report';
  } else if (/\b(late|delay|tardy|running late)\b/i.test(lowerMessage)) {
    intent = 'late';
  } else if (/\b(predict|forecast|trend|pattern|future)\b/i.test(lowerMessage)) {
    intent = 'prediction';
  } else if (/\b(help|assist|what can you|how do)\b/i.test(lowerMessage)) {
    intent = 'help';
  }
  // If no specific intent, treat as general conversation
  else {
    intent = 'general';
  }

  // For general conversation, use conversational responses
  if (intent === 'general') {
    return generalConversations[Math.floor(Math.random() * generalConversations.length)];
  }

  const responseList = responses[intent] || responses.help;
  return responseList[Math.floor(Math.random() * responseList.length)];
};

// AI-powered sentiment analysis (local implementation)
const analyzeSentiment = (text) => {
  const positiveWords = ['good', 'great', 'excellent', 'happy', 'love', 'wonderful', 'amazing', 'perfect', 'thank', 'helpful', 'best'];
  const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'annoyed', 'problem', 'issue', 'wrong', 'error'];
  
  const words = text.toLowerCase().split(/\s+/);
  let positiveScore = 0;
  let negativeScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
  });
  
  const total = positiveScore + negativeScore;
  if (total === 0) return { sentiment: 'neutral', confidence: 0.5 };
  
  if (positiveScore > negativeScore) {
    return { sentiment: 'positive', confidence: positiveScore / total };
  } else if (negativeScore > positiveScore) {
    return { sentiment: 'negative', confidence: negativeScore / total };
  }
  return { sentiment: 'neutral', confidence: 0.5 };
};

// AI-powered anomaly detection for attendance
const detectAnomalies = (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length < 5) {
    return { hasAnomalies: false, anomalies: [] };
  }

  const anomalies = [];
  
  // Calculate average clock-in time
  const clockInTimes = attendanceRecords
    .filter(r => r.clock_in)
    .map(r => {
      const date = new Date(r.clock_in);
      return date.getHours() * 60 + date.getMinutes();
    });
  
  if (clockInTimes.length > 0) {
    const avgClockIn = clockInTimes.reduce((a, b) => a + b, 0) / clockInTimes.length;
    const stdDev = Math.sqrt(
      clockInTimes.reduce((sq, n) => sq + Math.pow(n - avgClockIn, 2), 0) / clockInTimes.length
    );
    
    // Detect outliers (more than 2 standard deviations from mean)
    attendanceRecords.forEach(record => {
      if (record.clock_in) {
        const date = new Date(record.clock_in);
        const minutes = date.getHours() * 60 + date.getMinutes();
        if (Math.abs(minutes - avgClockIn) > 2 * stdDev) {
          anomalies.push({
            type: 'unusual_clock_in',
            date: record.clock_in,
            message: `Unusual clock-in time detected on ${new Date(record.clock_in).toLocaleDateString()}`
          });
        }
      }
    });
  }
  
  // Detect patterns of lateness
  const lateRecords = attendanceRecords.filter(r => r.status === 'late');
  if (lateRecords.length >= 3) {
    // Check for consecutive late days
    const dayOfWeek = {};
    lateRecords.forEach(record => {
      const day = new Date(record.clock_in).getDay();
      dayOfWeek[day] = (dayOfWeek[day] || 0) + 1;
    });
    
    Object.entries(dayOfWeek).forEach(([day, count]) => {
      if (count >= 2) {
        const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
        anomalies.push({
          type: 'pattern_lateness',
          day: dayName,
          message: `Pattern detected: Frequent lateness on ${dayName}s`
        });
      }
    });
  }
  
  return { hasAnomalies: anomalies.length > 0, anomalies };
};

// AI-powered productivity insights
const generateProductivityInsights = (attendanceData) => {
  const insights = [];
  
  if (!attendanceData || attendanceData.length === 0) {
    return ['No attendance data available for analysis.'];
  }
  
  // Calculate total hours
  const totalHours = attendanceData.reduce((sum, r) => sum + (parseFloat(r.hours_worked) || 0), 0);
  const avgHours = totalHours / attendanceData.length;
  
  if (avgHours >= 8) {
    insights.push(`Excellent work ethic! You're averaging ${avgHours.toFixed(1)} hours per day.`);
  } else if (avgHours >= 6) {
    insights.push(`Good performance with ${avgHours.toFixed(1)} hours average. Consider staying a bit longer for optimal productivity.`);
  } else {
    insights.push(`Your average work time is ${avgHours.toFixed(1)} hours. Consider ways to increase your daily hours.`);
  }
  
  // Analyze punctuality
  const lateCount = attendanceData.filter(r => r.status === 'late').length;
  const punctualityRate = ((attendanceData.length - lateCount) / attendanceData.length * 100).toFixed(1);
  
  if (punctualityRate >= 95) {
    insights.push(`Outstanding punctuality at ${punctualityRate}%! You're a model of reliability.`);
  } else if (punctualityRate >= 85) {
    insights.push(`Good punctuality rate of ${punctualityRate}%. Minor improvements possible.`);
  } else {
    insights.push(`Punctuality rate is ${punctualityRate}%. Consider adjusting your morning routine for improvement.`);
  }
  
  // Overtime analysis
  const overtimeRecords = attendanceData.filter(r => r.status === 'overtime');
  if (overtimeRecords.length > 0) {
    insights.push(`You've worked overtime ${overtimeRecords.length} times this period. Ensure work-life balance.`);
  }
  
  // Best day analysis
  const dayStats = {};
  attendanceData.forEach(r => {
    const day = new Date(r.clock_in).getDay();
    if (!dayStats[day]) dayStats[day] = { hours: 0, count: 0 };
    dayStats[day].hours += parseFloat(r.hours_worked) || 0;
    dayStats[day].count++;
  });
  
  let bestDay = null;
  let bestAvg = 0;
  Object.entries(dayStats).forEach(([day, stats]) => {
    const avg = stats.hours / stats.count;
    if (avg > bestAvg) {
      bestAvg = avg;
      bestDay = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
    }
  });
  
  if (bestDay) {
    insights.push(`Your most productive day is ${bestDay} with an average of ${bestAvg.toFixed(1)} hours.`);
  }
  
  return insights;
};

// AI-powered attendance predictions
const predictAttendance = (historicalData, userId) => {
  const predictions = [];
  
  if (!historicalData || historicalData.length < 7) {
    predictions.push({
      type: 'general',
      prediction: 'Insufficient data for accurate predictions',
      confidence: 30,
      recommendation: 'Continue tracking attendance for more accurate predictions.'
    });
    return predictions;
  }
  
  // Analyze historical patterns
  const dayPatterns = {};
  historicalData.forEach(record => {
    const day = new Date(record.clock_in).getDay();
    if (!dayPatterns[day]) {
      dayPatterns[day] = { total: 0, late: 0, hours: [] };
    }
    dayPatterns[day].total++;
    if (record.status === 'late') dayPatterns[day].late++;
    dayPatterns[day].hours.push(parseFloat(record.hours_worked) || 0);
  });
  
  // Predict for each weekday
  const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date().getDay();
  
  for (let i = 1; i <= 5; i++) {
    const predictDay = (today + i) % 7;
    const pattern = dayPatterns[predictDay];
    
    if (pattern && pattern.total >= 2) {
      const lateProb = (pattern.late / pattern.total * 100).toFixed(0);
      const avgHours = pattern.hours.reduce((a, b) => a + b, 0) / pattern.hours.length;
      
      predictions.push({
        type: 'daily',
        day: weekdays[predictDay],
        prediction: `${lateProb}% likelihood of being late`,
        expectedHours: avgHours.toFixed(1),
        confidence: Math.min(90, 50 + pattern.total * 5),
        recommendation: lateProb > 30 
          ? `Consider leaving earlier on ${weekdays[predictDay]}s` 
          : `Maintain your good habits on ${weekdays[predictDay]}s`
      });
    }
  }
  
  // Overall trend prediction
  const recentTrend = historicalData.slice(-14);
  const recentLateRate = recentTrend.filter(r => r.status === 'late').length / recentTrend.length * 100;
  
  predictions.push({
    type: 'trend',
    prediction: recentLateRate < 10 
      ? 'Your attendance trend is excellent' 
      : recentLateRate < 25 
        ? 'Your attendance trend is good but could improve' 
        : 'Your attendance trend shows room for improvement',
    confidence: 75,
    recommendation: recentLateRate >= 25 
      ? 'Try adjusting your morning routine to reduce late arrivals' 
      : 'Keep up the great work!'
  });
  
  return predictions;
};

// Smart notification generator
const generateSmartNotifications = (userData, attendanceData) => {
  const notifications = [];
  
  // Check for patterns that need attention
  const recentRecords = attendanceData.slice(-5);
  const consecutiveLate = recentRecords.filter(r => r.status === 'late').length;
  
  if (consecutiveLate >= 3) {
    notifications.push({
      type: 'warning',
      title: 'Attendance Alert',
      message: `You've been late ${consecutiveLate} times recently. This may affect your performance review.`,
      priority: 'high',
      actionable: true,
      action: 'View Attendance Tips'
    });
  }
  
  // Overtime warning
  const weeklyHours = recentRecords.reduce((sum, r) => sum + (parseFloat(r.hours_worked) || 0), 0);
  if (weeklyHours > 45) {
    notifications.push({
      type: 'info',
      title: 'Overtime Alert',
      message: `You've worked ${weeklyHours.toFixed(1)} hours this week. Remember to maintain work-life balance.`,
      priority: 'medium'
    });
  }
  
  // Achievement notifications
  if (recentRecords.length >= 5 && consecutiveLate === 0) {
    notifications.push({
      type: 'success',
      title: 'Perfect Week!',
      message: 'Congratulations! You maintained perfect punctuality this week.',
      priority: 'low'
    });
  }
  
  return notifications;
};

// Main AI chat handler with enhanced capabilities
const processAIChatMessage = async (message, context) => {
  try {
    // Generate intelligent response
    const aiResponse = generateIntelligentResponse(message, context);
    
    // Analyze sentiment
    const sentiment = analyzeSentiment(message);
    
    // Generate additional insights if attendance data is available
    let insights = [];
    let predictions = [];
    let anomalies = null;
    
    if (context.attendanceData && context.attendanceData.length > 0) {
      insights = generateProductivityInsights(context.attendanceData);
      predictions = predictAttendance(context.attendanceData, context.userId);
      anomalies = detectAnomalies(context.attendanceData);
    }
    
    return {
      success: true,
      message: aiResponse,
      sentiment,
      insights,
      predictions,
      anomalies,
      aiPowered: true,
      model: 'Attendance AI Assistant',
      confidence: 0.85
    };
  } catch (error) {
    console.error('AI processing error:', error);
    return {
      success: true,
      message: generateIntelligentResponse(message, context),
      aiPowered: true,
      error: 'Fallback response used'
    };
  }
};

// Enhanced sentiment analysis with Hugging Face
const analyzeSentimentWithHF = async (text) => {
  if (isHuggingFaceAvailable()) {
    try {
      const hfResponse = await callHuggingFaceAPI(FREE_MODELS.sentiment, text);
      if (hfResponse && hfResponse[0]) {
        const result = hfResponse[0];
        // HuggingFace returns labels with scores
        if (result.label && result.score) {
          const labelMap = {
            'POSITIVE': 'positive',
            'NEGATIVE': 'negative',
            'NEUTRAL': 'neutral',
            'LABEL_0': 'negative',
            'LABEL_1': 'neutral',
            'LABEL_2': 'positive'
          };
          return {
            sentiment: labelMap[result.label] || result.label.toLowerCase(),
            confidence: result.score
          };
        }
      }
    } catch (error) {
      console.warn('HuggingFace sentiment analysis failed:', error.message);
    }
  }
  
  // Fall back to local sentiment analysis
  return analyzeSentiment(text);
};

module.exports = {
  processAIChatMessage,
  analyzeSentiment: analyzeSentimentWithHF, // Use HF-enhanced version
  detectAnomalies,
  generateProductivityInsights,
  predictAttendance,
  generateSmartNotifications,
  generateIntelligentResponse,
  generateAIText,
  isHuggingFaceAvailable,
  callHuggingFaceAPI
};
