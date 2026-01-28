const bcrypt = require('bcryptjs');
const { query, queryOne } = require('../config/db');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const { role, status, search } = req.query;

    let sql = `SELECT id, email, name, role, status, phone, department, created_at, 
               (SELECT COUNT(*) FROM attendance WHERE user_id = users.id) as attendance_count,
               (SELECT COALESCE(SUM(hours_worked), 0) FROM attendance WHERE user_id = users.id) as total_hours
               FROM users WHERE 1=1`;
    const params = [];

    if (role) {
      sql += ` AND role = ?`;
      params.push(role);
    }

    if (status) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (search) {
      sql += ` AND (name LIKE ? OR email LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ` ORDER BY created_at DESC`;

    const users = await query(sql, params);

    res.json({ users });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

// Get single user
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await queryOne(
      `SELECT id, email, name, role, status, phone, department, avatar_url, created_at,
       (SELECT COUNT(*) FROM attendance WHERE user_id = ?) as attendance_count,
       (SELECT COALESCE(SUM(hours_worked), 0) FROM attendance WHERE user_id = ?) as total_hours
       FROM users WHERE id = ?`,
      [id, id, id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};

// Create user (admin only)
const createUser = async (req, res) => {
  try {
    const { email, password, name, role, phone, department } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await queryOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    const result = await query(
      `INSERT INTO users (email, password_hash, name, role, phone, department, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'active')`,
      [email, passwordHash, name, role || 'employee', phone || null, department || null]
    );

    const user = await queryOne(
      'SELECT id, email, name, role, status, phone, department, created_at FROM users WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, status, phone, department, password } = req.body;

    // Check if user exists
    const existingUser = await queryOne('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email) {
      const emailUser = await queryOne('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (emailUser) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    const updates = [];
    const values = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (phone !== undefined) {
      updates.push('phone = ?');
      values.push(phone);
    }
    if (department !== undefined) {
      updates.push('department = ?');
      values.push(department);
    }
    if (password) {
      const passwordHash = await bcrypt.hash(password, 10);
      updates.push('password_hash = ?');
      values.push(passwordHash);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);

    await query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

    const updatedUser = await queryOne(
      'SELECT id, email, name, role, status, phone, department, created_at FROM users WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Prevent deleting yourself
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const user = await queryOne('SELECT id FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Get user statistics
const getUserStats = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    let dateFilter = '';
    const params = [id];

    if (startDate && endDate) {
      dateFilter = 'AND DATE(clock_in) BETWEEN ? AND ?';
      params.push(startDate, endDate);
    }

    const stats = await queryOne(
      `SELECT 
        COUNT(*) as total_records,
        COUNT(CASE WHEN status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN status = 'late' THEN 1 END) as late_days,
        COUNT(CASE WHEN status = 'absent' THEN 1 END) as absent_days,
        COUNT(CASE WHEN status = 'overtime' THEN 1 END) as overtime_days,
        COALESCE(SUM(hours_worked), 0) as total_hours,
        COALESCE(AVG(hours_worked), 0) as avg_hours_per_day,
        MIN(clock_in) as first_clock_in,
        MAX(clock_in) as last_clock_in
       FROM attendance 
       WHERE user_id = ? ${dateFilter}`,
      params
    );

    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getUserStats
};
