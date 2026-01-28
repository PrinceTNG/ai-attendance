const express = require('express');
const router = express.Router();
const {
  clockIn,
  clockOut,
  getAttendanceHistory,
  getTodayStatus,
  getAttendanceStats
} = require('../controllers/attendanceController');
const { authenticateToken } = require('../middleware/auth');

// All attendance routes require authentication
router.use(authenticateToken);

router.post('/clock-in', clockIn);
router.post('/clock-out', clockOut);
router.get('/history', getAttendanceHistory);
router.get('/today', getTodayStatus);
router.get('/stats', getAttendanceStats);

module.exports = router;
