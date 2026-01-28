// OpenAI Integration Service
// Uses OpenAI API for enhanced conversational AI

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Check if OpenAI is available
const isOpenAIAvailable = () => {
  return !!OPENAI_API_KEY && OPENAI_API_KEY.startsWith('sk-');
};

// Call OpenAI API for chat completion
const callOpenAI = async (messages, options = {}) => {
  if (!isOpenAIAvailable()) {
    return null;
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: options.model || 'gpt-3.5-turbo',
        messages: messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 500,
        ...options
      }),
      timeout: 30000 // 30 second timeout
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.warn(`OpenAI API error: ${response.status}`, error);
      return null;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || null;
  } catch (error) {
    console.warn('OpenAI API unavailable:', error.message);
    return null;
  }
};

// Enhanced conversational response using OpenAI
const generateConversationalResponse = async (userMessage, context = {}) => {
  if (!isOpenAIAvailable()) {
    return null;
  }

  const systemPrompt = `You are a helpful AI assistant for an attendance management system. 
You help employees and students with:
- Checking attendance records and hours worked
- Applying for leave requests
- Viewing schedules
- Generating reports
- Answering questions about the system

Be friendly, professional, and concise. Use emojis sparingly. 
If asked about attendance, schedules, or leave, provide helpful information.
Current date: ${new Date().toLocaleDateString()}
User role: ${context.userRole || 'employee'}
User name: ${context.userName || 'User'}`;

  const messages = [
    { role: 'system', content: systemPrompt },
    ...(context.conversationHistory || []).slice(-10), // Last 10 messages for context
    { role: 'user', content: userMessage }
  ];

  try {
    const response = await callOpenAI(messages, {
      temperature: 0.7,
      max_tokens: 300
    });

    return response;
  } catch (error) {
    console.error('OpenAI generation error:', error);
    return null;
  }
};

// Enhanced intent detection using OpenAI
const detectIntentWithOpenAI = async (message) => {
  if (!isOpenAIAvailable()) {
    return null;
  }

  const prompt = `Analyze this user message and determine the intent. Return ONLY a JSON object with:
{
  "intent": "attendance_check|apply_leave|view_schedule|general_query|greeting",
  "confidence": 0.0-1.0,
  "entities": {
    "dates": [],
    "leaveType": null,
    "action": null
  }
}

Message: "${message}"

JSON:`;

  try {
    const response = await callOpenAI([
      { role: 'system', content: 'You are an intent detection system. Return only valid JSON.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.3,
      max_tokens: 200
    });

    if (response) {
      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }
  } catch (error) {
    console.error('OpenAI intent detection error:', error);
  }

  return null;
};

// Summarize attendance data using OpenAI
const summarizeAttendanceData = async (attendanceData, stats) => {
  if (!isOpenAIAvailable() || !attendanceData || attendanceData.length === 0) {
    return null;
  }

  const prompt = `Summarize this attendance data in a friendly, conversational way:
- Total days: ${stats.totalDays || 0}
- Present days: ${stats.presentDays || 0}
- Late days: ${stats.lateDays || 0}
- Total hours: ${stats.totalHours || 0}
- Attendance rate: ${stats.attendanceRate || 0}%

Provide a brief, encouraging summary (2-3 sentences max).`;

  try {
    const response = await callOpenAI([
      { role: 'system', content: 'You are a helpful assistant summarizing attendance data.' },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.7,
      max_tokens: 150
    });

    return response;
  } catch (error) {
    console.error('OpenAI summarization error:', error);
    return null;
  }
};

module.exports = {
  isOpenAIAvailable,
  callOpenAI,
  generateConversationalResponse,
  detectIntentWithOpenAI,
  summarizeAttendanceData
};
