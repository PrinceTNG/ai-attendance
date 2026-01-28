const express = require('express');
const router = express.Router();
const { processChatMessage, getAttendanceInsights } = require('../services/aiService');
const { 
  analyzeSentiment, 
  detectAnomalies, 
  generateProductivityInsights,
  predictAttendance,
  generateSmartNotifications 
} = require('../services/huggingFaceAI');
const { generateResponse, handleActionClick } = require('../services/conversationalAI');
const { isOpenAIAvailable, callOpenAI } = require('../services/openAIService');
const { isHuggingFaceAvailable, callHuggingFaceAPI, generateAIText } = require('../services/huggingFaceAI');
const { authenticateToken } = require('../middleware/auth');
const { query, queryOne } = require('../config/db');

// All AI routes require authentication
router.use(authenticateToken);

// Enhanced conversational chat endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message, action } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Get user's name
    const user = await queryOne('SELECT name FROM users WHERE id = ?', [userId]);
    const userName = user?.name?.split(' ')[0] || 'there';

    let response;

    // Handle action button click
    if (action) {
      response = await handleActionClick(userId, action, userRole, userName);
    }
    // Handle text message
    else if (message && typeof message === 'string' && message.trim().length > 0) {
      response = await generateResponse(userId, message.trim(), userRole, userName);
    }
    else {
      return res.status(400).json({ error: 'Message or action is required' });
    }

    // Log which AI is being used
    if (response.aiModel) {
      console.log(`🤖 AI Response using: ${response.aiModel}`);
    } else if (response.aiPowered) {
      console.log('🤖 AI Response using: Local AI');
    }

    res.json({
      success: true,
      ...response,
      aiPowered: response.aiPowered !== false
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// AI Predictions endpoint
router.get('/predictions', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get last 30 days of attendance data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const attendanceData = await query(
      'SELECT * FROM attendance WHERE user_id = ? AND clock_in >= ? ORDER BY clock_in DESC',
      [userId, thirtyDaysAgo]
    );
    
    const predictions = predictAttendance(attendanceData, userId);
    
    res.json({
      success: true,
      predictions,
      dataPoints: attendanceData.length,
      aiModel: 'Attendance Predictor v2.0'
    });
  } catch (error) {
    console.error('AI predictions error:', error);
    res.status(500).json({ error: 'Failed to generate predictions' });
  }
});

// AI Anomaly Detection endpoint
router.get('/anomalies', async (req, res) => {
  try {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    let attendanceData;
    if (isAdmin) {
      // Admin can see all anomalies
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      attendanceData = await query(
        `SELECT a.*, u.name as user_name 
         FROM attendance a 
         JOIN users u ON a.user_id = u.id 
         WHERE a.clock_in >= ? 
         ORDER BY a.clock_in DESC`,
        [thirtyDaysAgo]
      );
    } else {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      attendanceData = await query(
        'SELECT * FROM attendance WHERE user_id = ? AND clock_in >= ? ORDER BY clock_in DESC',
        [userId, thirtyDaysAgo]
      );
    }
    
    const anomalyResults = detectAnomalies(attendanceData);
    
    res.json({
      success: true,
      ...anomalyResults,
      analyzedRecords: attendanceData.length,
      aiModel: 'Anomaly Detector v1.0'
    });
  } catch (error) {
    console.error('AI anomalies error:', error);
    res.status(500).json({ error: 'Failed to detect anomalies' });
  }
});

// AI Productivity Insights endpoint
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    const attendanceData = await query(
      'SELECT * FROM attendance WHERE user_id = ? AND clock_in >= ? ORDER BY clock_in DESC',
      [userId, startDate]
    );
    
    const insights = generateProductivityInsights(attendanceData);
    
    res.json({
      success: true,
      insights,
      period,
      dataPoints: attendanceData.length,
      aiModel: 'Productivity Analyzer v1.0'
    });
  } catch (error) {
    console.error('AI insights error:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// AI Sentiment Analysis endpoint
router.post('/sentiment', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }
    
    const sentiment = analyzeSentiment(text);
    
    res.json({
      success: true,
      ...sentiment,
      aiModel: 'Sentiment Analyzer v1.0'
    });
  } catch (error) {
    console.error('AI sentiment error:', error);
    res.status(500).json({ error: 'Failed to analyze sentiment' });
  }
});

// AI Smart Notifications endpoint
router.get('/smart-notifications', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user data
    const userData = await queryOne('SELECT * FROM users WHERE id = ?', [userId]);
    
    // Get recent attendance
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const attendanceData = await query(
      'SELECT * FROM attendance WHERE user_id = ? AND clock_in >= ? ORDER BY clock_in DESC',
      [userId, sevenDaysAgo]
    );
    
    const notifications = generateSmartNotifications(userData, attendanceData);
    
    res.json({
      success: true,
      notifications,
      aiModel: 'Smart Notification Engine v1.0'
    });
  } catch (error) {
    console.error('AI smart notifications error:', error);
    res.status(500).json({ error: 'Failed to generate notifications' });
  }
});

// AI Dashboard Stats (Admin only)
router.get('/dashboard-stats', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Get various stats
    const [totalUsers, presentToday, lateToday, monthlyAttendance] = await Promise.all([
      queryOne('SELECT COUNT(*) as count FROM users WHERE status = \'active\''),
      queryOne('SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE DATE(clock_in) = ? AND status IN ("present", "overtime")', [today]),
      queryOne('SELECT COUNT(DISTINCT user_id) as count FROM attendance WHERE DATE(clock_in) = ? AND status = "late"', [today]),
      query('SELECT * FROM attendance WHERE clock_in >= ? ORDER BY clock_in DESC', [thirtyDaysAgo])
    ]);
    
    // Generate AI insights for admin
    const insights = generateProductivityInsights(monthlyAttendance);
    const anomalies = detectAnomalies(monthlyAttendance);
    
    // Calculate trends
    const weeklyTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayData = monthlyAttendance.filter(a => {
        const aDate = new Date(a.clock_in).toISOString().split('T')[0];
        return aDate === dateStr;
      });
      weeklyTrend.push({
        date: dateStr,
        total: dayData.length,
        late: dayData.filter(a => a.status === 'late').length,
        present: dayData.filter(a => a.status === 'present' || a.status === 'overtime').length
      });
    }
    
    res.json({
      success: true,
      stats: {
        totalUsers: totalUsers?.count || 0,
        presentToday: presentToday?.count || 0,
        lateToday: lateToday?.count || 0,
        totalRecords: monthlyAttendance.length
      },
      weeklyTrend,
      aiInsights: insights,
      anomalies,
      aiModel: 'Admin Dashboard AI v2.0'
    });
  } catch (error) {
    console.error('AI dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to get dashboard stats' });
  }
});

// Test HuggingFace integration
router.get('/test-huggingface', authenticateToken, async (req, res) => {
  try {
    const isAvailable = isHuggingFaceAvailable();
    
    if (!isAvailable) {
      return res.json({
        success: false,
        available: false,
        message: 'HuggingFace API key not configured or invalid. Check your .env file.',
        keyPresent: !!process.env.HUGGINGFACE_API_KEY,
        keyFormat: process.env.HUGGINGFACE_API_KEY ? (process.env.HUGGINGFACE_API_KEY.startsWith('hf_') ? 'valid' : 'invalid format') : 'not found'
      });
    }

    // Test with a simple text generation
    try {
      const testResponse = await generateAIText('Hello, how are you?', {
        userRole: req.user.role,
        userName: req.user.name
      });

      if (testResponse && testResponse.length > 0) {
        res.json({
          success: true,
          available: true,
          message: 'HuggingFace API is working correctly!',
          testResponse: testResponse.substring(0, 200), // First 200 chars
          model: 'microsoft/DialoGPT-medium'
        });
      } else {
        res.json({
          success: false,
          available: true,
          message: 'HuggingFace API key is configured but test request returned empty response.',
          keyPresent: true
        });
      }
    } catch (error) {
      res.json({
        success: false,
        available: true,
        message: 'HuggingFace API key is configured but test request failed.',
        error: error.message,
        keyPresent: true
      });
    }
  } catch (error) {
    console.error('HuggingFace test error:', error);
    res.status(500).json({
      success: false,
      available: false,
      error: error.message || 'Failed to test HuggingFace API',
      message: 'Error testing HuggingFace. Check server logs for details.'
    });
  }
});

// Test OpenAI integration
router.get('/test-openai', authenticateToken, async (req, res) => {
  try {
    const isAvailable = isOpenAIAvailable();
    
    if (!isAvailable) {
      return res.json({
        success: false,
        available: false,
        message: 'OpenAI API key not configured or invalid. Check your .env file.',
        keyPresent: !!process.env.OPENAI_API_KEY,
        keyFormat: process.env.OPENAI_API_KEY ? (process.env.OPENAI_API_KEY.startsWith('sk-') ? 'valid' : 'invalid format') : 'not found'
      });
    }

    // Test with a simple message
    const testResponse = await callOpenAI([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say "OpenAI is working!" if you can read this.' }
    ], {
      model: 'gpt-3.5-turbo',
      max_tokens: 50
    });

    if (testResponse) {
      res.json({
        success: true,
        available: true,
        message: 'OpenAI API is working correctly!',
        testResponse: testResponse,
        model: 'gpt-3.5-turbo'
      });
    } else {
      res.json({
        success: false,
        available: true,
        message: 'OpenAI API key is configured but test request failed. Check your API key and account status.',
        keyPresent: true
      });
    }
  } catch (error) {
    console.error('OpenAI test error:', error);
    res.status(500).json({
      success: false,
      available: false,
      error: error.message || 'Failed to test OpenAI API',
      message: 'Error testing OpenAI. Check server logs for details.'
    });
  }
});

module.exports = router;
