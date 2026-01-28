const { query } = require('../config/db');

// Create notification helper
const createNotification = async (userId, title, message, type = 'info', actionUrl = null) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, action_url) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, title, message, type, actionUrl]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Notify admin about important events
const notifyAdmin = async (title, message, type = 'info') => {
  try {
    // Get admin user ID
    const admin = await query('SELECT id FROM users WHERE role = "admin" LIMIT 1');
    if (admin.length > 0) {
      await createNotification(admin[0].id, title, message, type);
    }
  } catch (error) {
    console.error('Error notifying admin:', error);
  }
};

// Notify user about their attendance events
const notifyUser = async (userId, title, message, type = 'info') => {
  await createNotification(userId, title, message, type);
};

module.exports = {
  createNotification,
  notifyAdmin,
  notifyUser
};
