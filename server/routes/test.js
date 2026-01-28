const express = require('express');
const router = express.Router();
const { query, queryOne, testConnection } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Test database connection
router.get('/db', authenticateToken, async (req, res) => {
  try {
    const connected = await testConnection();
    
    if (!connected) {
      return res.status(500).json({ 
        success: false, 
        error: 'Database connection failed' 
      });
    }

    // Test queries
    const userCount = await query('SELECT COUNT(*) as count FROM users');
    const attendanceCount = await query('SELECT COUNT(*) as count FROM attendance');
    const leaveCount = await query('SELECT COUNT(*) as count FROM leave_requests');
    
    // Get recent attendance
    const recentAttendance = await query(
      'SELECT * FROM attendance ORDER BY clock_in DESC LIMIT 5'
    );
    
    // Get recent leave requests
    const recentLeaves = await query(
      `SELECT lr.*, u.name as user_name, u.role as user_role 
       FROM leave_requests lr 
       JOIN users u ON lr.user_id = u.id 
       ORDER BY lr.created_at DESC LIMIT 5`
    );

    res.json({
      success: true,
      database: 'Connected',
      counts: {
        users: userCount[0]?.count || 0,
        attendance: attendanceCount[0]?.count || 0,
        leaveRequests: leaveCount[0]?.count || 0
      },
      recentAttendance: recentAttendance || [],
      recentLeaveRequests: recentLeaves || []
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
