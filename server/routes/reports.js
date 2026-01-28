const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const {
  generateAttendanceSummary,
  generateHoursReport,
  getRecentReports,
  downloadReport
} = require('../controllers/reportController');
const { authenticateToken } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Protected report routes
router.post('/attendance-summary', authenticateToken, generateAttendanceSummary);
router.post('/hours-report', authenticateToken, generateHoursReport);
router.get('/recent', authenticateToken, getRecentReports);

// Custom auth middleware for downloads that supports query token
const authenticateDownload = (req, res, next) => {
  // Check for token in Authorization header first
  let token = req.headers.authorization?.split(' ')[1];
  
  // Fall back to query parameter token
  if (!token && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Serve report files with flexible authentication
router.get('/download/:filename', authenticateDownload, (req, res) => {
  const filename = req.params.filename;
  
  // Security: prevent directory traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const filePath = path.join(__dirname, '../reports', filename);
  
  // Check if file exists
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Report file not found' });
  }

  // Set proper content-type based on file extension
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    '.pdf': 'application/pdf',
    '.csv': 'text/csv',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  const contentType = contentTypes[ext] || 'application/octet-stream';
  
  res.setHeader('Content-Type', contentType);
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  
  const fileStream = fs.createReadStream(filePath);
  fileStream.pipe(res);
  
  fileStream.on('error', (err) => {
    console.error('Download stream error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to download file' });
    }
  });
});

module.exports = router;
