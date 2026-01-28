const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest
} = require('../controllers/leaveController');

// All routes require authentication
router.use(authenticateToken);

// Get leave requests
router.get('/', getLeaveRequests);

// Create leave request
router.post('/', createLeaveRequest);

// Approve leave request (admin only)
router.put('/:id/approve', approveLeaveRequest);

// Reject leave request (admin only)
router.put('/:id/reject', rejectLeaveRequest);

// Cancel leave request
router.put('/:id/cancel', cancelLeaveRequest);

module.exports = router;
