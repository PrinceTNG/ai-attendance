const { query, queryOne } = require('../config/db');
const { notifyUser, notifyAdmin } = require('../services/notificationService');

// Get all leave requests (admin) or user's own requests
const getLeaveRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { status, userId: filterUserId } = req.query;

    console.log('📋 Get leave requests:', {
      userId,
      userRole,
      status,
      filterUserId
    });

    let sql = `
      SELECT 
        lr.*,
        u.name as user_name,
        u.email as user_email,
        u.role as user_role,
        approver.name as approver_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
    `;

    const params = [];

    if (userRole === 'admin') {
      // Admin sees ALL leave requests (no user filter unless specified)
      if (filterUserId) {
        sql += ' WHERE lr.user_id = ?';
        params.push(filterUserId);
      } else {
        // Admin sees all - no WHERE clause needed, but we'll add WHERE 1=1 for consistency
        sql += ' WHERE 1=1';
      }
    } else {
      // Regular users see only their own requests
      sql += ' WHERE lr.user_id = ?';
      params.push(userId);
    }

    if (status) {
      sql += ` AND lr.status = ?`;
      params.push(status);
    }

    sql += ' ORDER BY lr.created_at DESC';

    console.log('📋 SQL Query:', sql);
    console.log('📋 Params:', params);

    const requests = await query(sql, params);

    console.log('📋 Found leave requests:', requests.length);
    if (requests.length > 0) {
      console.log('📋 Sample request:', {
        id: requests[0].id,
        user_name: requests[0].user_name,
        type: requests[0].type,
        status: requests[0].status
      });
    }

    res.json({ success: true, requests });
  } catch (error) {
    console.error('❌ Get leave requests error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ success: false, error: 'Failed to fetch leave requests' });
  }
};

// Create leave request
const createLeaveRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, startDate, endDate, reason, documentUrl } = req.body;

    if (!type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Type, start date, and end date are required' });
    }

    console.log('📝 Creating leave request:', {
      userId,
      type,
      startDate,
      endDate,
      hasReason: !!reason
    });

    const result = await query(
      `INSERT INTO leave_requests (user_id, type, start_date, end_date, reason, document_url, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`,
      [userId, type, startDate, endDate, reason || null, documentUrl || null]
    );

    console.log('✅ Leave request created, ID:', result.insertId);

    if (!result || !result.insertId) {
      console.error('❌ Failed to create leave request - no insertId returned');
      return res.status(500).json({ error: 'Failed to save leave request to database' });
    }

    const requestId = result.insertId;

    // Notify admin
    await notifyAdmin(
      'New Leave Request',
      `A new ${type} leave request has been submitted.`,
      'info'
    );

    // Get the created request
    const request = await queryOne(
      `SELECT 
        lr.*,
        u.name as user_name,
        u.email as user_email
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      WHERE lr.id = ?`,
      [requestId]
    );

    res.status(201).json({
      success: true,
      message: 'Leave request submitted successfully',
      request
    });
  } catch (error) {
    console.error('Create leave request error:', error);
    res.status(500).json({ error: 'Failed to create leave request' });
  }
};

// Approve leave request (admin only)
const approveLeaveRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { rejectionReason } = req.body; // Not used for approval, but kept for consistency

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can approve leave requests' });
    }

    // Get the request
    const request = await queryOne(
      `SELECT lr.*, u.name as user_name, u.email as user_email
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = ?`,
      [id]
    );

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Leave request is already ${request.status}` });
    }

    // Update request
    await query(
      `UPDATE leave_requests 
       SET status = 'approved', 
           approved_by = ?, 
           approved_at = NOW(),
           rejection_reason = NULL
       WHERE id = ?`,
      [adminId, id]
    );

    // Notify user
    await notifyUser(
      request.user_id,
      'Leave Request Approved',
      `Your ${request.type} leave request from ${request.start_date} to ${request.end_date} has been approved.`,
      'success'
    );

    // Get updated request
    const updatedRequest = await queryOne(
      `SELECT 
        lr.*,
        u.name as user_name,
        u.email as user_email,
        approver.name as approver_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      WHERE lr.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Leave request approved successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Approve leave request error:', error);
    res.status(500).json({ error: 'Failed to approve leave request' });
  }
};

// Reject leave request (admin only)
const rejectLeaveRequest = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can reject leave requests' });
    }

    // Get the request
    const request = await queryOne(
      `SELECT lr.*, u.name as user_name, u.email as user_email
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = ?`,
      [id]
    );

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Leave request is already ${request.status}` });
    }

    // Update request
    await query(
      `UPDATE leave_requests 
       SET status = 'rejected', 
           approved_by = ?, 
           approved_at = NOW(),
           rejection_reason = ?
       WHERE id = ?`,
      [adminId, rejectionReason || null, id]
    );

    // Notify user
    await notifyUser(
      request.user_id,
      'Leave Request Rejected',
      `Your ${request.type} leave request from ${request.start_date} to ${request.end_date} has been rejected.${rejectionReason ? ` Reason: ${rejectionReason}` : ''}`,
      'error'
    );

    // Get updated request
    const updatedRequest = await queryOne(
      `SELECT 
        lr.*,
        u.name as user_name,
        u.email as user_email,
        approver.name as approver_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      LEFT JOIN users approver ON lr.approved_by = approver.id
      WHERE lr.id = ?`,
      [id]
    );

    res.json({
      success: true,
      message: 'Leave request rejected successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Reject leave request error:', error);
    res.status(500).json({ error: 'Failed to reject leave request' });
  }
};

// Cancel leave request (user can cancel their own)
const cancelLeaveRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get the request
    const request = await queryOne(
      'SELECT * FROM leave_requests WHERE id = ?',
      [id]
    );

    if (!request) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    // Check if user owns the request or is admin
    if (request.user_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'You can only cancel your own leave requests' });
    }

    if (request.status === 'cancelled') {
      return res.status(400).json({ error: 'Leave request is already cancelled' });
    }

    if (request.status === 'approved') {
      return res.status(400).json({ error: 'Cannot cancel an approved leave request' });
    }

    // Update request
    await query(
      'UPDATE leave_requests SET status = "cancelled" WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Leave request cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel leave request error:', error);
    res.status(500).json({ error: 'Failed to cancel leave request' });
  }
};

module.exports = {
  getLeaveRequests,
  createLeaveRequest,
  approveLeaveRequest,
  rejectLeaveRequest,
  cancelLeaveRequest
};
