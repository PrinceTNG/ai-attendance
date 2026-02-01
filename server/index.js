require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { testConnection } = require('./config/db');

// Import routes
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const userRoutes = require('./routes/users');
const reportRoutes = require('./routes/reports');
const aiRoutes = require('./routes/ai');
const notificationRoutes = require('./routes/notifications');
const settingsRoutes = require('./routes/settings');
const leaveRoutes = require('./routes/leave');
const scheduleRoutes = require('./routes/schedule');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbConnected = await testConnection();
  res.status(dbConnected ? 200 : 503).json({
    status: dbConnected ? 'healthy' : 'unhealthy',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test admin endpoint (for debugging)
app.get('/api/test-admin', async (req, res) => {
  try {
    const { queryOne } = require('./config/db');
    const admin = await queryOne('SELECT id, email, name, role, status FROM users WHERE email = ?', ['admin@initiumventures.com']);
    
    if (admin) {
      res.json({
        exists: true,
        user: admin,
        message: 'Admin user exists. Run "npm run fix-admin" in server directory to reset password.'
      });
    } else {
      res.json({
        exists: false,
        message: 'Admin user does not exist. Run "npm run fix-admin" in server directory to create it.'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/users', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/test', require('./routes/test'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const startServer = async () => {
  try {
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.error('⚠️  Warning: Database connection failed. Server will start but database operations will fail.');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:5173'}`);
      
      // Keep-alive: Ping database every 20 minutes to prevent Aiven auto-sleep
      if (process.env.NODE_ENV === 'production') {
        console.log('🔄 Database keep-alive enabled (pings every 20 minutes)');
        setInterval(async () => {
          try {
            await testConnection();
            console.log('✅ Database keep-alive ping successful');
          } catch (error) {
            console.warn('⚠️ Database keep-alive ping failed:', error.message);
          }
        }, 20 * 60 * 1000); // 20 minutes
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
