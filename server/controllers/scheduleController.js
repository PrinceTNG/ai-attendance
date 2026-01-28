const { query, queryOne } = require('../config/db');

// Get all schedules (for employees/students to view)
const getSchedules = async (req, res) => {
  try {
    const userRole = req.user.role;
    
    // Get schedules that apply to this user's role or all
    const schedules = await query(
      `SELECT * FROM weekly_schedule 
       WHERE is_active = TRUE 
       AND (applies_to = 'all' OR applies_to = ?)
       ORDER BY FIELD(day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), start_time`,
      [userRole]
    );

    // Group by day of week
    const groupedSchedules = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    days.forEach(day => {
      groupedSchedules[day] = schedules.filter(s => s.day_of_week === day);
    });

    res.json({
      success: true,
      schedules,
      groupedSchedules
    });
  } catch (error) {
    console.error('Get schedules error:', error);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
};

// Get all schedules (admin view - includes inactive)
const getAllSchedules = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const schedules = await query(
      `SELECT s.*, u.name as created_by_name 
       FROM weekly_schedule s
       LEFT JOIN users u ON s.created_by = u.id
       ORDER BY FIELD(s.day_of_week, 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'), s.start_time`
    );

    res.json({
      success: true,
      schedules
    });
  } catch (error) {
    console.error('Get all schedules error:', error);
    res.status(500).json({ error: 'Failed to get schedules' });
  }
};

// Create a new schedule entry (admin only)
const createSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { dayOfWeek, startTime, endTime, subject, description, location, appliesTo } = req.body;

    if (!dayOfWeek || !startTime || !endTime) {
      return res.status(400).json({ error: 'Day, start time, and end time are required' });
    }

    // Validate day of week
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    if (!validDays.includes(dayOfWeek.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid day of week' });
    }

    // Validate time format
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return res.status(400).json({ error: 'Invalid time format. Use HH:MM format' });
    }

    // Validate end time is after start time
    if (startTime >= endTime) {
      return res.status(400).json({ error: 'End time must be after start time' });
    }

    const result = await query(
      `INSERT INTO weekly_schedule (day_of_week, start_time, end_time, subject, description, location, applies_to, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        dayOfWeek.toLowerCase(),
        startTime,
        endTime,
        subject || null,
        description || null,
        location || 'Main Office',
        appliesTo || 'all',
        req.user.id
      ]
    );

    const newSchedule = await queryOne('SELECT * FROM weekly_schedule WHERE id = ?', [result.insertId]);

    if (!newSchedule) {
      return res.status(500).json({ error: 'Schedule created but could not be retrieved' });
    }

    res.status(201).json({
      success: true,
      message: 'Schedule created successfully',
      schedule: newSchedule
    });
  } catch (error) {
    console.error('Create schedule error:', error);
    
    // Check if table doesn't exist
    if (error.code === 'ER_NO_SUCH_TABLE' || error.message?.includes('weekly_schedule')) {
      return res.status(500).json({ 
        error: 'Database table not found. Please run the database schema to create the weekly_schedule table.' 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to create schedule. Please check the server logs for details.' 
    });
  }
};

// Update a schedule entry (admin only)
const updateSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, subject, description, location, appliesTo, isActive } = req.body;

    const updates = [];
    const values = [];

    if (dayOfWeek) {
      updates.push('day_of_week = ?');
      values.push(dayOfWeek.toLowerCase());
    }
    if (startTime) {
      updates.push('start_time = ?');
      values.push(startTime);
    }
    if (endTime) {
      updates.push('end_time = ?');
      values.push(endTime);
    }
    if (subject !== undefined) {
      updates.push('subject = ?');
      values.push(subject);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (location !== undefined) {
      updates.push('location = ?');
      values.push(location);
    }
    if (appliesTo) {
      updates.push('applies_to = ?');
      values.push(appliesTo);
    }
    if (isActive !== undefined) {
      updates.push('is_active = ?');
      values.push(isActive);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(
      `UPDATE weekly_schedule SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const updatedSchedule = await queryOne('SELECT * FROM weekly_schedule WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Schedule updated successfully',
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({ error: 'Failed to update schedule' });
  }
};

// Delete a schedule entry (admin only)
const deleteSchedule = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;

    await query('DELETE FROM weekly_schedule WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    console.error('Delete schedule error:', error);
    res.status(500).json({ error: 'Failed to delete schedule' });
  }
};

// Bulk create/update schedules (admin only)
const bulkUpdateSchedules = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { schedules } = req.body;

    if (!schedules || !Array.isArray(schedules)) {
      return res.status(400).json({ error: 'Schedules array is required' });
    }

    // Clear existing schedules and insert new ones
    await query('DELETE FROM weekly_schedule');

    for (const schedule of schedules) {
      await query(
        `INSERT INTO weekly_schedule (day_of_week, start_time, end_time, subject, description, location, applies_to, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          schedule.dayOfWeek.toLowerCase(),
          schedule.startTime,
          schedule.endTime,
          schedule.subject || null,
          schedule.description || null,
          schedule.location || 'Main Office',
          schedule.appliesTo || 'all',
          req.user.id
        ]
      );
    }

    const allSchedules = await query('SELECT * FROM weekly_schedule ORDER BY FIELD(day_of_week, \'monday\', \'tuesday\', \'wednesday\', \'thursday\', \'friday\', \'saturday\', \'sunday\'), start_time');

    res.json({
      success: true,
      message: `${schedules.length} schedules saved successfully`,
      schedules: allSchedules
    });
  } catch (error) {
    console.error('Bulk update schedules error:', error);
    res.status(500).json({ error: 'Failed to update schedules' });
  }
};

module.exports = {
  getSchedules,
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  bulkUpdateSchedules
};
