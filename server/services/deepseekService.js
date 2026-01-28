// DeepSeek AI Integration Service
// Supports both Ollama (local dev) and Cloud API (production)

const OLLAMA_API_URL = process.env.OLLAMA_API_URL || 'http://localhost:11434/api/chat';
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
const OLLAMA_MODEL = 'deepseek-v3.1:671b-cloud';

let useCloudAPI = false;

// Check if DeepSeek is available (Ollama or Cloud)
const isDeepSeekAvailable = async () => {
  // Try Ollama first (for local development)
  try {
    const ollamaUrl = OLLAMA_API_URL.replace('/api/chat', '/api/tags');
    const response = await fetch(ollamaUrl, {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    });
    
    if (response.ok) {
      const data = await response.json();
      const hasModel = data.models?.some(m => m.name.includes('deepseek-v3.1'));
      
      if (hasModel) {
        console.log('✅ Using Ollama + DeepSeek V3.1 (local)');
        useCloudAPI = false;
        return true;
      }
    }
  } catch (error) {
    // Ollama not available, try cloud API
  }
  
  // Fall back to Cloud API
  if (DEEPSEEK_API_KEY) {
    console.log('✅ Using DeepSeek Cloud API (production)');
    useCloudAPI = true;
    return true;
  }
  
  console.warn('⚠️ No AI service configured. Set DEEPSEEK_API_KEY or run Ollama locally.');
  return false;
};

// Call DeepSeek (Ollama or Cloud API)
const callDeepSeek = async (messages, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 30000);

  try {
    // Use Cloud API if configured or Ollama failed
    if (useCloudAPI && DEEPSEEK_API_KEY) {
      console.log(`🤖 Calling DeepSeek Cloud API with model: ${DEEPSEEK_MODEL}`);

      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: DEEPSEEK_MODEL,
          messages: messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.max_tokens || 1000,
          top_p: options.top_p || 0.95,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ DeepSeek API error: ${response.status}`, errorData);
        throw new Error(`DeepSeek API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No response content from DeepSeek API');
      }

      console.log('✅ DeepSeek Cloud API response received');
      return content;
    }

    // Use Ollama (local)
    console.log(`🤖 Calling Ollama with DeepSeek model: ${OLLAMA_MODEL}`);

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: messages,
        stream: false,
        options: {
          temperature: options.temperature || 0.7,
          num_predict: options.max_tokens || 1000,
          top_p: options.top_p || 0.95,
          num_ctx: 8192,
        }
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`❌ Ollama error: ${response.status}`, errorText);
      
      // If Ollama fails and we have cloud API, retry with cloud
      if (DEEPSEEK_API_KEY && !useCloudAPI) {
        console.log('⚠️ Ollama failed, retrying with Cloud API...');
        useCloudAPI = true;
        return callDeepSeek(messages, options);
      }
      
      throw new Error(`Ollama error: ${response.status} - ${errorText || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.message?.content || data.response;
    
    if (!content) {
      throw new Error('No response content from Ollama');
    }

    console.log('✅ DeepSeek (Ollama) response received');
    return content;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError' || error.name === 'TimeoutError') {
      console.error('❌ Request timeout');
      throw new Error('Request timeout - AI is taking too long to respond');
    }
    
    // If using Ollama and it fails, try cloud API
    if (!useCloudAPI && DEEPSEEK_API_KEY && error.message.includes('Ollama')) {
      console.log('⚠️ Ollama failed, retrying with Cloud API...');
      useCloudAPI = true;
      return callDeepSeek(messages, options);
    }
    
    console.error('❌ DeepSeek error:', error.message);
    throw error;
  }
};

// Generate conversational response for chatbot
const generateConversationalResponse = async (userMessage, context = {}) => {
  const systemPrompt = `You are a helpful AI assistant for an attendance management system called Initium Venture Solutions. 
You help employees and students with:
- Checking attendance records and hours worked
- Applying for leave requests
- Viewing schedules
- Generating reports
- Answering questions about the system
- General conversations and assistance

Be friendly, professional, and concise. Use emojis sparingly but naturally.
Current date: ${new Date().toLocaleDateString()}
User role: ${context.userRole || 'employee'}
User name: ${context.userName || 'User'}

If asked about attendance, schedules, or leave, provide helpful guidance and suggest using the relevant features in the system.`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(context.conversationHistory || []).slice(-10), // Last 10 messages for context
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await callDeepSeek(messages, {
      temperature: 0.7,
      max_tokens: 500
    });

    return response;
  } catch (error) {
    console.error('DeepSeek conversation error:', error);
    throw error;
  }
};

// Analyze attendance data and provide insights
const analyzeAttendanceInsights = async (attendanceData, userContext = {}) => {
  const prompt = `Analyze this attendance data and provide 3-4 key insights:

Attendance Summary:
- Total days: ${attendanceData.totalDays || 0}
- Present days: ${attendanceData.presentDays || 0}
- Late days: ${attendanceData.lateDays || 0}
- Total hours: ${attendanceData.totalHours || 0}
- Average hours/day: ${attendanceData.avgHours || 0}
- Attendance rate: ${attendanceData.attendanceRate || 0}%

User: ${userContext.userName || 'User'}
Role: ${userContext.userRole || 'employee'}

Provide brief, actionable insights (3-4 bullet points) about their performance, patterns, and suggestions for improvement.`;

  const messages = [
    { role: 'system', content: 'You are an AI analytics assistant. Provide concise, actionable insights.' },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await callDeepSeek(messages, {
      temperature: 0.6,
      max_tokens: 400
    });

    return response;
  } catch (error) {
    console.error('DeepSeek insights error:', error);
    throw error;
  }
};

// Generate smart notifications based on patterns
const generateSmartNotifications = async (userData, recentActivity) => {
  const prompt = `Analyze this user's recent activity and generate smart notifications:

Recent Activity:
${JSON.stringify(recentActivity, null, 2)}

User: ${userData.name}
Role: ${userData.role}

Generate 2-3 relevant notifications if needed (warnings, tips, achievements, reminders). Each notification should have:
- type: 'info', 'warning', 'success', or 'tip'
- title: Brief title
- message: Short, helpful message

Return as JSON array. If no notifications needed, return empty array.`;

  const messages = [
    { role: 'system', content: 'You are an AI notification system. Generate helpful, relevant notifications. Return valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await callDeepSeek(messages, {
      temperature: 0.5,
      max_tokens: 600
    });

    // Try to parse JSON from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Fallback: return empty array
    return [];
  } catch (error) {
    console.error('DeepSeek notifications error:', error);
    return [];
  }
};

// Detect anomalies in attendance patterns
const detectAnomalies = async (attendanceRecords) => {
  if (!attendanceRecords || attendanceRecords.length < 5) {
    return { hasAnomalies: false, anomalies: [] };
  }

  const prompt = `Analyze this attendance pattern for anomalies:

Records: ${attendanceRecords.length} entries
Recent behavior:
${attendanceRecords.slice(-10).map((r, i) => 
  `Day ${i + 1}: Status: ${r.status}, Hours: ${r.hours_worked || 0}h, Clock-in: ${new Date(r.clock_in).toLocaleTimeString()}`
).join('\n')}

Identify unusual patterns:
- Abnormal clock-in times
- Unusual late patterns
- Suspicious overtime
- Work hour anomalies

Return JSON: { "hasAnomalies": boolean, "anomalies": [{"type": string, "description": string, "severity": "low"|"medium"|"high"}] }`;

  const messages = [
    { role: 'system', content: 'You are an AI anomaly detection system. Return valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await callDeepSeek(messages, {
      temperature: 0.4,
      max_tokens: 500
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { hasAnomalies: false, anomalies: [] };
  } catch (error) {
    console.error('DeepSeek anomaly detection error:', error);
    return { hasAnomalies: false, anomalies: [] };
  }
};

// Predict future attendance trends
const predictAttendanceTrends = async (historicalData) => {
  if (!historicalData || historicalData.length < 7) {
    return {
      predictions: [],
      confidence: 0,
      summary: 'Insufficient data for predictions'
    };
  }

  const prompt = `Analyze this attendance history and predict trends:

Historical Data (${historicalData.length} records):
${historicalData.slice(-20).map((r, i) => 
  `Record ${i + 1}: ${new Date(r.clock_in).toLocaleDateString()}, Status: ${r.status}, Hours: ${r.hours_worked || 0}h`
).join('\n')}

Provide:
1. Attendance trend prediction for next week
2. Likely late days and why
3. Expected average hours
4. Confidence level (0-100%)

Return JSON: { "predictions": [string], "confidence": number, "summary": string }`;

  const messages = [
    { role: 'system', content: 'You are an AI prediction system. Analyze patterns and predict trends. Return valid JSON.' },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await callDeepSeek(messages, {
      temperature: 0.5,
      max_tokens: 600
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      predictions: [],
      confidence: 0,
      summary: 'Unable to generate predictions'
    };
  } catch (error) {
    console.error('DeepSeek prediction error:', error);
    return {
      predictions: [],
      confidence: 0,
      summary: 'Prediction failed'
    };
  }
};

// Summarize attendance data for admin
const summarizeForAdmin = async (stats, context = {}) => {
  const prompt = `Summarize this attendance data for an admin dashboard:

Overall Stats:
- Total active users: ${stats.totalUsers || 0}
- Present today: ${stats.presentToday || 0}
- Late today: ${stats.lateToday || 0}
- Average attendance rate: ${stats.avgAttendanceRate || 0}%
- Total hours this week: ${stats.totalWeeklyHours || 0}

Provide a concise 2-3 sentence executive summary highlighting key points and any concerns.`;

  const messages = [
    { role: 'system', content: 'You are an AI assistant for management. Provide clear, actionable summaries.' },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await callDeepSeek(messages, {
      temperature: 0.6,
      max_tokens: 300
    });

    return response;
  } catch (error) {
    console.error('DeepSeek admin summary error:', error);
    throw error;
  }
};

// Analyze sentiment from user messages
const analyzeSentiment = async (text) => {
  const prompt = `Analyze the sentiment of this message: "${text}"

Return JSON: { "sentiment": "positive"|"negative"|"neutral", "confidence": 0.0-1.0, "emotion": "happy"|"frustrated"|"confused"|"neutral" }`;

  const messages = [
    { role: 'system', content: 'You are a sentiment analysis system. Return valid JSON only.' },
    { role: 'user', content: prompt }
  ];

  try {
    const response = await callDeepSeek(messages, {
      temperature: 0.3,
      max_tokens: 150
    });

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { sentiment: 'neutral', confidence: 0.5, emotion: 'neutral' };
  } catch (error) {
    console.error('DeepSeek sentiment error:', error);
    return { sentiment: 'neutral', confidence: 0.5, emotion: 'neutral' };
  }
};

module.exports = {
  isDeepSeekAvailable,
  callDeepSeek,
  generateConversationalResponse,
  analyzeAttendanceInsights,
  generateSmartNotifications,
  detectAnomalies,
  predictAttendanceTrends,
  summarizeForAdmin,
  analyzeSentiment
};
