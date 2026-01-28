-- AI Attendance System Database Schema
-- Run this script in MySQL/phpMyAdmin to create the database

CREATE DATABASE IF NOT EXISTS ai_attendance;
USE ai_attendance;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'employee', 'student') NOT NULL DEFAULT 'employee',
    facial_descriptors JSON DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    avatar_url VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    department VARCHAR(100) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_status (status)
);

-- Attendance records table
CREATE TABLE IF NOT EXISTS attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    clock_in DATETIME NOT NULL,
    clock_out DATETIME DEFAULT NULL,
    hours_worked DECIMAL(5,2) DEFAULT NULL,
    status ENUM('present', 'late', 'absent', 'overtime', 'half_day') DEFAULT 'present',
    location_verified BOOLEAN DEFAULT FALSE,
    clock_in_location JSON DEFAULT NULL,
    clock_out_location JSON DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_clock_in (clock_in),
    INDEX idx_status (status)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type ENUM('annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
    approved_by INT DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    rejection_reason TEXT DEFAULT NULL,
    document_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
    id INT PRIMARY KEY AUTO_INCREMENT,
    generated_by INT NOT NULL,
    type ENUM('attendance_summary', 'hours_report', 'individual_performance', 'leave_report') NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_path VARCHAR(500) DEFAULT NULL,
    file_type ENUM('pdf', 'csv', 'xlsx') DEFAULT 'pdf',
    parameters JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_generated_by (generated_by),
    INDEX idx_type (type)
);

-- AI Chat history table
CREATE TABLE IF NOT EXISTS ai_chat_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    message TEXT NOT NULL,
    response TEXT NOT NULL,
    intent VARCHAR(100) DEFAULT NULL,
    context JSON DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('info', 'warning', 'success', 'error') DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    action_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read)
);

-- Settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Weekly schedule table (set by admin, viewed by employees/students)
CREATE TABLE IF NOT EXISTS weekly_schedule (
    id INT PRIMARY KEY AUTO_INCREMENT,
    day_of_week ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday') NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    subject VARCHAR(255) DEFAULT NULL,
    description TEXT DEFAULT NULL,
    location VARCHAR(255) DEFAULT 'Main Office',
    is_active BOOLEAN DEFAULT TRUE,
    applies_to ENUM('all', 'employee', 'student') DEFAULT 'all',
    created_by INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_day (day_of_week),
    INDEX idx_applies_to (applies_to)
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, description) VALUES
('work_start_time', '09:00', 'Default work start time'),
('work_end_time', '17:00', 'Default work end time'),
('late_threshold_minutes', '15', 'Minutes after start time to be considered late'),
('overtime_threshold_hours', '8', 'Hours after which overtime is calculated'),
('office_latitude', '-26.1942', 'Office location latitude'),
('office_longitude', '28.0578', 'Office location longitude'),
('location_radius_meters', '5000', 'Allowed radius from office for clock in/out (5000m = 5km)'),
('company_name', 'Initium Venture Solutions', 'Company name for reports')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- Insert default admin user (password: admin123)
-- Run 'npm run setup-admin' after database setup to create/update admin user with correct password hash
-- INSERT INTO users (email, password_hash, name, role, status) VALUES
-- ('admin@initiumventures.com', 'PLACEHOLDER_HASH', 'System Administrator', 'admin', 'active')
-- ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Create view for attendance statistics
CREATE OR REPLACE VIEW attendance_stats AS
SELECT 
    u.id as user_id,
    u.name,
    u.role,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_days,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_days,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_days,
    COUNT(CASE WHEN a.status = 'overtime' THEN 1 END) as overtime_days,
    COALESCE(SUM(a.hours_worked), 0) as total_hours,
    COALESCE(AVG(a.hours_worked), 0) as avg_hours_per_day
FROM users u
LEFT JOIN attendance a ON u.id = a.user_id
GROUP BY u.id, u.name, u.role;
