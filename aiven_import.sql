-- MySQL-compatible version for Aiven
-- No MariaDB-specific features

SET FOREIGN_KEY_CHECKS=0;
SET SESSION sql_mode = 'NO_ENGINE_SUBSTITUTION,NO_ZERO_DATE,NO_ZERO_IN_DATE';

-- Drop existing tables if any
DROP TABLE IF EXISTS `reports`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `ai_chat_history`;
DROP TABLE IF EXISTS `leave_requests`;
DROP TABLE IF EXISTS `weekly_schedule`;
DROP TABLE IF EXISTS `attendance`;
DROP TABLE IF EXISTS `settings`;
DROP TABLE IF EXISTS `users`;

-- Users table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('admin','employee','student') NOT NULL DEFAULT 'employee',
  `facial_descriptors` longtext DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `avatar_url` varchar(500) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_email` (`email`),
  KEY `idx_role` (`role`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert your users
INSERT INTO `users` VALUES 
(1,'admin@initiumventures.com','$2a$10$GAIZzCrAet5.6xW.3PqP2ODgiyyJJB5m6qEvIykKXmninsWqHqJD.','System Administrator','admin',NULL,'active',NULL,NULL,NULL,'2026-01-21 11:31:43','2026-01-24 18:31:50'),
(4,'admin@initialventures.com','$2a$10$sdI.kKymuBa9dykUWIEzc.ehy8xhiPf2cBZfjnc0S28AB6LkOUxg6','System Administrator','admin',NULL,'active',NULL,NULL,NULL,'2026-01-21 13:44:35','2026-01-21 13:44:35'),
(5,'Lunga.student@university.com','$2a$10$nyF63Qq4X0R6ihyiL1q2h.7MYQS1vb0P4ddOipHk1H0eWHicvo4C.','Prince Mthethwa','student','[-0.15034517645835876,-0.024321677163243294,0.008619613945484161]','active',NULL,NULL,NULL,'2026-01-21 14:30:25','2026-01-21 14:30:25');

-- Attendance table
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime DEFAULT NULL,
  `hours_worked` decimal(5,2) DEFAULT NULL,
  `status` enum('present','late','absent','overtime','half_day') DEFAULT 'present',
  `location_verified` tinyint(1) DEFAULT 0,
  `clock_in_location` longtext DEFAULT NULL,
  `clock_out_location` longtext DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_clock_in` (`clock_in`),
  KEY `idx_status` (`status`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AI Chat History
CREATE TABLE `ai_chat_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `response` text NOT NULL,
  `intent` varchar(100) DEFAULT NULL,
  `context` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `ai_chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Leave Requests
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `type` enum('annual','sick','personal','maternity','paternity','unpaid') NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','rejected','cancelled') DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `document_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `approved_by` (`approved_by`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`),
  KEY `idx_dates` (`start_date`,`end_date`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `leave_requests_ibfk_2` FOREIGN KEY (`approved_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Notifications
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` enum('info','warning','success','error') DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT 0,
  `action_url` varchar(500) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Settings
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert settings
INSERT INTO `settings` VALUES 
(1,'work_start_time','09:00','Default work start time','2026-01-21 11:29:26'),
(2,'work_end_time','17:00','Default work end time','2026-01-21 11:29:26'),
(3,'late_threshold_minutes','15','Minutes after start time to be considered late','2026-01-21 11:29:26'),
(4,'overtime_threshold_hours','8','Hours after which overtime is calculated','2026-01-21 11:29:26'),
(5,'office_latitude','-26.1942','Office location latitude','2026-01-24 22:06:19'),
(6,'office_longitude','28.0578','Office location longitude','2026-01-24 22:06:19'),
(7,'location_radius_meters','5000','Allowed radius from office for clock in/out','2026-01-24 22:06:19'),
(8,'company_name','Initium Venture Solutions','Company name for reports','2026-01-21 11:29:26');

-- Weekly Schedule
CREATE TABLE `weekly_schedule` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `day_of_week` enum('monday','tuesday','wednesday','thursday','friday','saturday','sunday') NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `location` varchar(255) DEFAULT 'Main Office',
  `is_active` tinyint(1) DEFAULT 1,
  `applies_to` enum('all','employee','student') DEFAULT 'all',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_day` (`day_of_week`),
  KEY `idx_applies_to` (`applies_to`),
  CONSTRAINT `weekly_schedule_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Reports
CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `generated_by` int(11) NOT NULL,
  `type` enum('attendance_summary','hours_report','individual_performance','leave_report') NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_type` enum('pdf','csv','xlsx') DEFAULT 'pdf',
  `parameters` longtext DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_generated_by` (`generated_by`),
  KEY `idx_type` (`type`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS=1;

-- Done! Your database structure is ready.
-- You can now use the app and it will populate with new data.
