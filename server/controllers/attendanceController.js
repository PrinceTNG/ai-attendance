const { query, queryOne } = require('../config/db');
const { notifyAdmin, notifyUser } = require('../services/notificationService');

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Clock in
const clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    // Get office location from settings or database
    const locationSetting = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'office_latitude'"
    );
    const officeLat = locationSetting 
      ? parseFloat(locationSetting.setting_value) 
      : parseFloat(process.env.OFFICE_LATITUDE || '-26.1942');
    
    const lngSetting = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'office_longitude'"
    );
    const officeLng = lngSetting 
      ? parseFloat(lngSetting.setting_value) 
      : parseFloat(process.env.OFFICE_LONGITUDE || '28.0578');
    
    const radiusSetting = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'location_radius_meters'"
    );
    const radius = radiusSetting 
      ? parseFloat(radiusSetting.setting_value) 
      : parseFloat(process.env.LOCATION_RADIUS_METERS || '5000'); // Default 5km radius

    // Location verification is REQUIRED - block clock in if not at office
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Location is required for clock in. Please enable location services.' 
      });
    }

    const distance = calculateDistance(latitude, longitude, officeLat, officeLng);
    const locationVerified = distance <= radius;
    
    if (!locationVerified) {
      console.log(`Location verification failed: User is ${Math.round(distance)}m away from office (threshold: ${radius}m)`);
      return res.status(403).json({ 
        error: `You are ${Math.round(distance)}m away from the office. Please be within ${radius/1000}km to clock in.`,
        distance: Math.round(distance),
        threshold: radius
      });
    }

    console.log(`Location verified: User is within ${radius}m of office`);

    // Check if user already clocked in today (using DATE() function for timezone safety)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('🔍 Checking for existing attendance for date:', todayStr);

    const existingRecord = await queryOne(
      `SELECT id, clock_out FROM attendance 
       WHERE user_id = ? AND DATE(clock_in) = DATE(?)`,
      [userId, today]
    );

    if (existingRecord && !existingRecord.clock_out) {
      return res.status(400).json({ error: 'You have already clocked in today' });
    }

    // Get work start time from settings
    const workStartTime = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'work_start_time'"
    );
    const startTime = workStartTime ? workStartTime.setting_value : '09:00';
    const [startHour, startMinute] = startTime.split(':').map(Number);

    const now = new Date();
    const expectedStart = new Date(now);
    expectedStart.setHours(startHour, startMinute, 0, 0);

    // Determine status
    let status = 'present';
    const lateThreshold = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'late_threshold_minutes'"
    );
    const thresholdMinutes = lateThreshold ? parseInt(lateThreshold.setting_value) : 15;

    if (now > new Date(expectedStart.getTime() + thresholdMinutes * 60000)) {
      status = 'late';
    }

    // Insert attendance record
    console.log('📝 Inserting attendance record:', {
      userId,
      clock_in: now,
      status,
      locationVerified,
      hasLocation: !!(latitude && longitude)
    });
    
    const result = await query(
      `INSERT INTO attendance (user_id, clock_in, status, location_verified, clock_in_location) 
       VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        now,
        status,
        locationVerified,
        latitude && longitude ? JSON.stringify({ latitude, longitude }) : null
      ]
    );

    console.log('✅ Attendance record inserted, ID:', result.insertId);

    if (!result || !result.insertId) {
      console.error('❌ Failed to insert attendance record - no insertId returned');
      return res.status(500).json({ error: 'Failed to save attendance record to database' });
    }

    // Create notifications
    const user = await queryOne('SELECT name FROM users WHERE id = ?', [userId]);
    
    if (status === 'late') {
      await notifyAdmin(
        'Late Arrival',
        `${user?.name || 'User'} clocked in late at ${now.toLocaleTimeString()}`,
        'warning'
      );
      await notifyUser(
        userId,
        'Late Clock In',
        `You clocked in late at ${now.toLocaleTimeString()}. Please ensure you arrive on time.`,
        'warning'
      );
    } else {
      // Notify admin about on-time clock in too
      await notifyAdmin(
        'Clock In',
        `${user?.name || 'User'} clocked in at ${now.toLocaleTimeString()}`,
        'info'
      );
      await notifyUser(
        userId,
        'Clock In Successful',
        `You have successfully clocked in at ${now.toLocaleTimeString()}. Have a productive day!`,
        'success'
      );
    }

    const attendance = await queryOne(
      'SELECT * FROM attendance WHERE id = ?',
      [result.insertId]
    );

    if (!attendance) {
      console.error('❌ Attendance record not found after insert, ID:', result.insertId);
      return res.status(500).json({ error: 'Attendance record created but could not be retrieved' });
    }

    console.log('✅ Clock in successful, attendance ID:', attendance.id);

    res.status(201).json({
      success: true,
      message: 'Successfully clocked in',
      attendance
    });
  } catch (error) {
    console.error('❌ Clock in error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to clock in',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Clock out
const clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const { latitude, longitude } = req.body;

    // Location verification is REQUIRED for clock out
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        error: 'Location is required for clock out. Please enable location services.' 
      });
    }

    // Get office location and radius
    const officeLatSetting = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'office_latitude'"
    );
    const officeLngSetting = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'office_longitude'"
    );
    const radiusSetting = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'location_radius_meters'"
    );
    
    const officeLat = officeLatSetting ? parseFloat(officeLatSetting.setting_value) : -26.1942;
    const officeLng = officeLngSetting ? parseFloat(officeLngSetting.setting_value) : 28.0578;
    const radius = radiusSetting 
      ? parseFloat(radiusSetting.setting_value) 
      : parseFloat(process.env.LOCATION_RADIUS_METERS || '5000');

    const distance = calculateDistance(latitude, longitude, officeLat, officeLng);
    const locationVerified = distance <= radius;
    
    if (!locationVerified) {
      console.log(`Location verification failed for clock out: User is ${Math.round(distance)}m away from office`);
      return res.status(403).json({ 
        error: `You are ${Math.round(distance)}m away from the office. Please be within ${radius/1000}km to clock out.`,
        distance: Math.round(distance),
        threshold: radius
      });
    }

    // Find today's clock in record (using DATE() function for timezone safety)
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log('🔍 Looking for today\'s attendance record for date:', todayStr);

    const attendanceRecord = await queryOne(
      `SELECT * FROM attendance 
       WHERE user_id = ? AND DATE(clock_in) = DATE(?) AND clock_out IS NULL`,
      [userId, today]
    );

    if (!attendanceRecord) {
      console.error('❌ No active clock in record found for user:', userId, 'on date:', todayStr);
      // Try to find any record for today (even if clocked out)
      const anyRecord = await queryOne(
        `SELECT * FROM attendance 
         WHERE user_id = ? AND DATE(clock_in) = DATE(?)`,
        [userId, today]
      );
      if (anyRecord) {
        console.log('⚠️ Found attendance record but it already has clock_out:', anyRecord.clock_out);
        return res.status(400).json({ error: 'You have already clocked out today' });
      }
      return res.status(400).json({ error: 'No active clock in found for today. Please clock in first.' });
    }
    
    console.log('✅ Found attendance record for clock out:', attendanceRecord.id);

    const now = new Date();
    const clockInTime = new Date(attendanceRecord.clock_in);
    const hoursWorked = (now - clockInTime) / (1000 * 60 * 60); // Convert to hours

    // Check for overtime
    const overtimeThreshold = await queryOne(
      "SELECT setting_value FROM settings WHERE setting_key = 'overtime_threshold_hours'"
    );
    const thresholdHours = overtimeThreshold ? parseFloat(overtimeThreshold.setting_value) : 8;

    let status = attendanceRecord.status;
    if (hoursWorked > thresholdHours) {
      status = 'overtime';
    }

    // Update attendance record
    console.log('📝 Updating attendance record for clock out:', {
      attendanceId: attendanceRecord.id,
      clock_out: now,
      hours_worked: parseFloat(hoursWorked.toFixed(2)),
      status,
      hasLocation: !!(latitude && longitude)
    });
    
    const updateResult = await query(
      `UPDATE attendance 
       SET clock_out = ?, hours_worked = ?, status = ?, clock_out_location = ? 
       WHERE id = ?`,
      [
        now,
        parseFloat(hoursWorked.toFixed(2)),
        status,
        latitude && longitude ? JSON.stringify({ latitude, longitude }) : null,
        attendanceRecord.id
      ]
    );

    console.log('✅ Update result:', {
      affectedRows: updateResult.affectedRows,
      changedRows: updateResult.changedRows
    });

    if (updateResult.affectedRows === 0) {
      console.error('❌ No rows updated for clock out');
      return res.status(500).json({ error: 'Failed to update attendance record' });
    }

    const updatedAttendance = await queryOne(
      'SELECT * FROM attendance WHERE id = ?',
      [attendanceRecord.id]
    );

    if (!updatedAttendance) {
      console.error('❌ Updated attendance record not found');
      return res.status(500).json({ error: 'Attendance record updated but could not be retrieved' });
    }

    console.log('✅ Clock out successful, attendance ID:', updatedAttendance.id);

    // Create notification
    const user = await queryOne('SELECT name FROM users WHERE id = ?', [userId]);
    
    // Notify admin about clock out
    await notifyAdmin(
      'Clock Out',
      `${user?.name || 'User'} clocked out. Hours worked: ${parseFloat(hoursWorked.toFixed(2))} hours.`,
      'info'
    );
    
    await notifyUser(
      userId,
      'Clock Out Successful',
      `You have successfully clocked out. Total hours worked today: ${parseFloat(hoursWorked.toFixed(2))} hours.`,
      'success'
    );

    res.json({
      success: true,
      message: 'Successfully clocked out',
      attendance: updatedAttendance
    });
  } catch (error) {
    console.error('❌ Clock out error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Failed to clock out',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get attendance history
const getAttendanceHistory = async (req, res) => {
  try {
    const userRole = req.user.role;
    const { startDate, endDate, status, userId: filterUserId } = req.query;

    let sql = '';
    const params = [];

    // Admin can see all users' attendance, regular users see only their own
    if (userRole === 'admin') {
      if (filterUserId) {
        // Admin filtering by specific user
        sql = `SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role 
               FROM attendance a
               JOIN users u ON a.user_id = u.id
               WHERE a.user_id = ?`;
        params.push(filterUserId);
      } else {
        // Admin sees all attendance
        sql = `SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role 
               FROM attendance a
               JOIN users u ON a.user_id = u.id
               WHERE 1=1`;
      }
    } else {
      // Regular users see only their own
      sql = `SELECT a.*, u.name as user_name, u.email as user_email, u.role as user_role 
             FROM attendance a
             JOIN users u ON a.user_id = u.id
             WHERE a.user_id = ?`;
      params.push(req.user.id);
    }

    if (startDate) {
      sql += ` AND DATE(a.clock_in) >= ?`;
      params.push(startDate);
    }

    if (endDate) {
      sql += ` AND DATE(a.clock_in) <= ?`;
      params.push(endDate);
    }

    if (status) {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY a.clock_in DESC LIMIT 100`;

    console.log('📊 Attendance history SQL:', sql);
    console.log('📊 Attendance history params:', params);

    const attendance = await query(sql, params);

    console.log('📊 Found attendance records:', attendance.length);

    res.json({ attendance });
  } catch (error) {
    console.error('❌ Get attendance history error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ error: 'Failed to get attendance history' });
  }
};

// Get today's attendance status
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

    console.log('📊 Getting today\'s status for user:', userId, 'date:', todayStr);

    const attendance = await queryOne(
      `SELECT * FROM attendance 
       WHERE user_id = ? AND DATE(clock_in) = DATE(?) 
       ORDER BY clock_in DESC LIMIT 1`,
      [userId, today]
    );

    console.log('📊 Today\'s attendance:', attendance ? {
      id: attendance.id,
      clock_in: attendance.clock_in,
      clock_out: attendance.clock_out,
      status: attendance.status
    } : 'No record found');

    res.json({ attendance: attendance || null });
  } catch (error) {
    console.error('❌ Get today status error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlState: error.sqlState
    });
    res.status(500).json({ error: 'Failed to get today status' });
  }
};

// Get attendance statistics
const getAttendanceStats = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' && req.query.userId ? req.query.userId : req.user.id;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [userId];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(clock_in) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const stats = await queryOne(
      `SELECT 
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'overtime' THEN 1 END) as overtime_days,
        COALESCE(SUM(hours_worked), 0) as total_hours,
        COALESCE(AVG(hours_worked), 0) as avg_hours_per_day
       FROM attendance 
       WHERE user_id = ? ${dateFilter}`,
      params
    );

    res.json({ stats });
  } catch (error) {
    console.error('Get attendance stats error:', error);
    res.status(500).json({ error: 'Failed to get attendance statistics' });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getAttendanceHistory,
  getTodayStatus,
  getAttendanceStats
};
