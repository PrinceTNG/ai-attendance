const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { query, queryOne } = require('../config/db');

// Ensure reports directory exists
const reportsDir = path.join(__dirname, '../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Serve static reports
const express = require('express');
const reportsRouter = express.Router();
reportsRouter.use('/download', express.static(reportsDir));

// Generate PDF report
const generatePDF = async (data, filename) => {
  return new Promise((resolve, reject) => {
    const filePath = path.join(reportsDir, filename);
    const doc = new PDFDocument({ margin: 50 });

    doc.pipe(fs.createWriteStream(filePath));

    // Header
    doc.fontSize(20).text('Attendance Report', { align: 'center' });
    doc.moveDown();

    // Add content based on report type
    if (data.type === 'attendance_summary') {
      doc.fontSize(16).text('Summary Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Period: ${data.periodStart} to ${data.periodEnd}`);
      doc.moveDown();
      
      if (data.summary) {
        doc.fontSize(14);
        doc.text(`Total Users: ${data.summary.totalUsers || 0}`);
        doc.text(`Total Records: ${data.summary.totalRecords || 0}`);
        doc.text(`Present Days: ${data.summary.presentDays || 0}`);
        doc.text(`Late Days: ${data.summary.lateDays || 0}`);
        doc.text(`Absent Days: ${data.summary.absentDays || 0}`);
        doc.text(`Total Hours: ${data.summary.totalHours || 0}`);
        doc.moveDown();
        
        if (data.records && data.records.length > 0) {
          doc.fontSize(12);
          doc.text('Recent Records:', { underline: true });
          doc.moveDown(0.5);
          data.records.slice(0, 20).forEach((record, index) => {
            doc.text(`${index + 1}. ${record.user} - ${record.date} - ${record.hours || 0}h - ${record.status}`);
          });
        }
      }
    } else if (data.type === 'hours_report') {
      doc.fontSize(16).text('Hours Report', { align: 'center' });
      doc.moveDown();
      
      if (data.users) {
        data.users.forEach((user, index) => {
          doc.text(`${index + 1}. ${user.name}: ${user.totalHours} hours`);
        });
      }
    }

    doc.end();

    doc.on('end', () => resolve(filePath));
    doc.on('error', reject);
  });
};

// Generate CSV report
const generateCSV = async (data, filename) => {
  const filePath = path.join(reportsDir, filename);
  let csvContent = '';

  if (data.type === 'attendance_summary') {
    csvContent = 'Date,User,Clock In,Clock Out,Hours,Status\n';
    if (data.records) {
      data.records.forEach(record => {
        csvContent += `${record.date},${record.user},${record.clockIn},${record.clockOut},${record.hours},${record.status}\n`;
      });
    }
  } else if (data.type === 'hours_report') {
    csvContent = 'User,Total Hours,Present Days,Late Days\n';
    if (data.users) {
      data.users.forEach(user => {
        csvContent += `${user.name},${user.totalHours},${user.presentDays},${user.lateDays}\n`;
      });
    }
  }

  fs.writeFileSync(filePath, csvContent);
  return filePath;
};

// Generate attendance summary report
const generateAttendanceSummary = async (req, res) => {
  try {
    const { periodStart, periodEnd, role, fileType = 'pdf' } = req.body;
    const generatedBy = req.user.id;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Get attendance data
    let sql = `
      SELECT a.*, u.name as user_name, u.role 
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE DATE(a.clock_in) BETWEEN ? AND ?
    `;
    const params = [periodStart, periodEnd];

    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    sql += ' ORDER BY a.clock_in DESC';

    const records = await query(sql, params);

    // Get total users count
    let userCountSql = 'SELECT COUNT(DISTINCT user_id) as total FROM attendance WHERE DATE(clock_in) BETWEEN ? AND ?';
    const userCountParams = [periodStart, periodEnd];
    if (role) {
      userCountSql = `
        SELECT COUNT(DISTINCT a.user_id) as total 
        FROM attendance a
        JOIN users u ON a.user_id = u.id
        WHERE DATE(a.clock_in) BETWEEN ? AND ? AND u.role = ?
      `;
      userCountParams.push(role);
    }
    const userCountResult = await queryOne(userCountSql, userCountParams);
    const totalUsers = userCountResult?.total || 0;

    // Calculate summary
    const summary = {
      totalUsers: totalUsers,
      totalRecords: records.length,
      presentDays: records.filter(r => r.status === 'present' || r.status === 'overtime').length,
      lateDays: records.filter(r => r.status === 'late').length,
      absentDays: records.filter(r => r.status === 'absent').length,
      totalHours: records.reduce((sum, r) => sum + (parseFloat(r.hours_worked || 0)), 0).toFixed(2)
    };

    const reportData = {
      type: 'attendance_summary',
      periodStart,
      periodEnd,
      summary,
      records: records.map(r => ({
        date: r.clock_in.toISOString().split('T')[0],
        user: r.user_name,
        clockIn: r.clock_in,
        clockOut: r.clock_out,
        hours: r.hours_worked,
        status: r.status
      }))
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `attendance_summary_${timestamp}.${fileType}`;

    let filePath;
    if (fileType === 'csv') {
      filePath = await generateCSV(reportData, filename);
    } else {
      filePath = await generatePDF(reportData, filename);
    }

    // Save report record
    await query(
      `INSERT INTO reports (generated_by, type, period_start, period_end, file_path, file_type, parameters)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        generatedBy,
        'attendance_summary',
        periodStart,
        periodEnd,
        filePath,
        fileType,
        JSON.stringify({ role })
      ]
    );

    res.json({
      success: true,
      message: 'Report generated successfully',
      filePath: filePath,
      filename: filename,
      summary
    });
  } catch (error) {
    console.error('Generate attendance summary error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Generate hours report
const generateHoursReport = async (req, res) => {
  try {
    const { periodStart, periodEnd, role, fileType = 'pdf' } = req.body;
    const generatedBy = req.user.id;

    if (!periodStart || !periodEnd) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    // Get user hours data
    let sql = `
      SELECT 
        u.id,
        u.name,
        u.role,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
        COALESCE(SUM(a.hours_worked), 0) as total_hours
      FROM users u
      LEFT JOIN attendance a ON u.id = a.user_id AND DATE(a.clock_in) BETWEEN ? AND ?
      WHERE 1=1
    `;
    const params = [periodStart, periodEnd];

    if (role) {
      sql += ' AND u.role = ?';
      params.push(role);
    }

    sql += ' GROUP BY u.id, u.name, u.role ORDER BY total_hours DESC';

    const users = await query(sql, params);

    const reportData = {
      type: 'hours_report',
      periodStart,
      periodEnd,
      users: users.map(u => ({
        name: u.name,
        role: u.role,
        totalHours: parseFloat(u.total_hours),
        presentDays: u.present_days,
        lateDays: u.late_days
      }))
    };

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `hours_report_${timestamp}.${fileType}`;

    let filePath;
    if (fileType === 'csv') {
      filePath = await generateCSV(reportData, filename);
    } else {
      filePath = await generatePDF(reportData, filename);
    }

    // Save report record
    await query(
      `INSERT INTO reports (generated_by, type, period_start, period_end, file_path, file_type, parameters)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        generatedBy,
        'hours_report',
        periodStart,
        periodEnd,
        filePath,
        fileType,
        JSON.stringify({ role })
      ]
    );

    res.json({
      success: true,
      message: 'Report generated successfully',
      filePath: filePath,
      filename: filename,
      users: reportData.users
    });
  } catch (error) {
    console.error('Generate hours report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
};

// Get recent reports
const getRecentReports = async (req, res) => {
  try {
    const userId = req.user.role === 'admin' ? null : req.user.id;
    
    let sql = `SELECT r.*, u.name as generated_by_name 
               FROM reports r
               JOIN users u ON r.generated_by = u.id
               WHERE 1=1`;
    const params = [];

    if (userId) {
      sql += ' AND r.generated_by = ?';
      params.push(userId);
    }

    sql += ' ORDER BY r.created_at DESC LIMIT 20';

    const reports = await query(sql, params);

    res.json({ reports });
  } catch (error) {
    console.error('Get recent reports error:', error);
    res.status(500).json({ error: 'Failed to get reports' });
  }
};

// Download report file
const downloadReport = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(reportsDir, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Report file not found' });
    }

    res.download(filePath, filename);
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
};

module.exports = {
  generateAttendanceSummary,
  generateHoursReport,
  getRecentReports,
  downloadReport
};
