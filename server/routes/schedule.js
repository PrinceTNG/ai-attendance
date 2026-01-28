const express = require('express');
const router = express.Router();
const {
  getSchedules,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  bulkUpdateSchedules
} = require('../controllers/scheduleController');
const { authenticateToken } = require('../middleware/auth');

// All schedule routes require authentication
router.use(authenticateToken);

// Get schedules (for current user's role)
router.get('/', getSchedules);

// Get all schedules (admin only)
router.get('/all', getAllSchedules);

// Create schedule (admin only)
router.post('/', createSchedule);

// Bulk update schedules (admin only)
router.put('/bulk', bulkUpdateSchedules);

// Update schedule (admin only)
router.put('/:id', updateSchedule);

// Delete schedule (admin only)
router.delete('/:id', deleteSchedule);

module.exports = router;
