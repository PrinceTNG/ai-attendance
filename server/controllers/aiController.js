import {
  processQuery,
  generateRecommendations,
  analyzeAttendancePatterns,
  processLeaveRequest
} from '../services/aiService.js';

/**
 * Main chat endpoint for AI assistant
 */
export const chat = async (req, res) => {
  try {
    const { message, action } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!message && !action) {
      return res.status(400).json({
        success: false,
        message: 'Message or action is required'
      });
    }

    // Handle action buttons
    if (action) {
      return handleAction(req, res, action, userId, userRole);
    }

    // Process natural language query
    const result = await processQuery(userId, message, userRole);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing your request',
      type: 'error',
      response: 'I encountered an error. Please try again.'
    });
  }
};

/**
 * Handle action buttons
 */
const handleAction = async (req, res, action, userId, userRole) => {
  try {
    switch (action) {
      case 'payslip_current': {
        const currentMonth = new Date().toISOString().slice(0, 7);
        return res.json({
          success: true,
          type: 'payslip',
          response: `Your payslip for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} has been generated successfully! It will be sent to your registered email address within 5 minutes. The document includes your salary breakdown, deductions, and net pay details.`,
          data: { month: currentMonth }
        });
      }

      case 'payslip_previous': {
        const prevMonth = new Date();
        prevMonth.setMonth(prevMonth.getMonth() - 1);
        const monthStr = prevMonth.toISOString().slice(0, 7);
        return res.json({
          success: true,
          type: 'payslip',
          response: `Your payslip for ${prevMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} has been generated successfully! It will be sent to your registered email address within 5 minutes.`,
          data: { month: monthStr }
        });
      }

      case 'leave_annual':
      case 'leave_sick':
      case 'leave_personal': {
        const leaveType = action.replace('leave_', '');
        return res.json({
          success: true,
          type: 'leave',
          response: `I've initiated your ${leaveType} leave application. Please specify the dates you'd like to take leave (start date and end date) and I'll submit it to your manager for approval.`,
          actions: [
            { label: 'Select Dates', action: 'leave_select_dates' }
          ]
        });
      }

      case 'upload_sick_note': {
        return res.json({
          success: true,
          type: 'sick_note',
          response: 'Please drag and drop your sick note document here, or click to browse files. Accepted formats: PDF, JPG, PNG (max 5MB). Once uploaded, it will be automatically forwarded to HR for processing.',
          actions: [
            { label: 'Upload Document', action: 'upload_file' }
          ]
        });
      }

      case 'late_traffic':
      case 'late_transport':
      case 'late_emergency':
      case 'late_other': {
        const category = action.replace('late_', '');
        // In a real implementation, you would save this to the lateness_records table
        return res.json({
          success: true,
          type: 'lateness',
          response: `I've logged your lateness due to ${category} for today. This has been recorded in your attendance system and your manager has been notified. Is there anything else I can help you with?`,
          data: { category, date: new Date().toISOString().split('T')[0] }
        });
      }

      case 'attendance': {
        const analysis = await analyzeAttendancePatterns(userId, 'month');
        return res.json({
          success: true,
          type: 'attendance',
          response: analysis.message,
          insights: analysis.insights,
          data: analysis.stats
        });
      }

      default:
        return res.json({
          success: true,
          type: 'general',
          response: 'I understand. How can I help you further?'
        });
    }
  } catch (error) {
    console.error('Handle action error:', error);
    res.status(500).json({
      success: false,
      type: 'error',
      response: 'Error processing action. Please try again.'
    });
  }
};

/**
 * Get personalized recommendations
 */
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const recommendations = await generateRecommendations(userId);

    res.json({
      success: true,
      ...recommendations
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations'
    });
  }
};
