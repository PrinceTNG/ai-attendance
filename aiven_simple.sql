-- Simple MySQL schema for Aiven - No errors!
-- Run this in DBeaver

-- Disable checks
SET FOREIGN_KEY_CHECKS=0;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role ENUM('admin','employee','student') DEFAULT 'employee',
  facial_descriptors TEXT,
  status ENUM('active','inactive') DEFAULT 'active',
  avatar_url VARCHAR(500),
  phone VARCHAR(20),
  department VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  clock_in DATETIME NOT NULL,
  clock_out DATETIME,
  hours_worked DECIMAL(5,2),
  status ENUM('present','late','absent','overtime','half_day') DEFAULT 'present',
  location_verified BOOLEAN DEFAULT 0,
  clock_in_location TEXT,
  clock_out_location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Leave requests
CREATE TABLE IF NOT EXISTS leave_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('annual','sick','personal','maternity','paternity','unpaid') NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  status ENUM('pending','approved','rejected','cancelled') DEFAULT 'pending',
  approved_by INT,
  approved_at DATETIME,
  rejection_reason TEXT,
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- AI chat history
CREATE TABLE IF NOT EXISTS ai_chat_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  response TEXT NOT NULL,
  intent VARCHAR(100),
  context TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('info','warning','success','error') DEFAULT 'info',
  is_read BOOLEAN DEFAULT 0,
  action_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Weekly schedule
CREATE TABLE IF NOT EXISTS weekly_schedule (
  id INT AUTO_INCREMENT PRIMARY KEY,
  day_of_week ENUM('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject VARCHAR(255),
  description TEXT,
  location VARCHAR(255) DEFAULT 'Main Office',
  is_active BOOLEAN DEFAULT 1,
  applies_to ENUM('all','employee','student') DEFAULT 'all',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Settings
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Reports
CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  generated_by INT NOT NULL,
  type ENUM('attendance_summary','hours_report','individual_performance','leave_report') NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  file_path VARCHAR(500),
  file_type ENUM('pdf','csv','xlsx') DEFAULT 'pdf',
  parameters TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert admin user
INSERT IGNORE INTO users (id, email, password_hash, name, role, status) VALUES 
(1, 'admin@initiumventures.com', '$2a$10$GAIZzCrAet5.6xW.3PqP2ODgiyyJJB5m6qEvIykKXmninsWqHqJD.', 'System Administrator', 'admin', 'active');

-- Insert settings
INSERT IGNORE INTO settings (setting_key, setting_value, description) VALUES
('work_start_time', '09:00', 'Default work start time'),
('work_end_time', '17:00', 'Default work end time'),
('late_threshold_minutes', '15', 'Minutes after start time to be considered late'),
('overtime_threshold_hours', '8', 'Hours after which overtime is calculated'),
('office_latitude', '-26.1942', 'Office location latitude'),
('office_longitude', '28.0578', 'Office location longitude'),
('location_radius_meters', '5000', 'Allowed radius from office'),
('company_name', 'Initium Venture Solutions', 'Company name');

-- Enable checks
SET FOREIGN_KEY_CHECKS=1;

-- Done!
SELECT 'Database setup complete!' AS Status;
