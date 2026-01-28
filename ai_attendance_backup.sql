-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: ai_attendance
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ai_chat_history`
--

DROP TABLE IF EXISTS `ai_chat_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ai_chat_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `response` text NOT NULL,
  `intent` varchar(100) DEFAULT NULL,
  `context` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`context`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `ai_chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ai_chat_history`
--

LOCK TABLES `ai_chat_history` WRITE;
/*!40000 ALTER TABLE `ai_chat_history` DISABLE KEYS */;
INSERT INTO `ai_chat_history` VALUES (12,5,'hi','I can help you with attendance queries, leave applications, payslip information, reporting lateness, and general HR questions. What would you like help with?','general','{\"intent\":\"general\",\"message\":\"I can help you with attendance queries, leave applications, payslip information, reporting lateness, and general HR questions. What would you like help with?\",\"suggestions\":[\"Check my attendance this month\",\"Apply for leave\",\"Generate my payslip\",\"Report lateness\",\"View my statistics\"],\"timestamp\":\"2026-01-21T14:58:12.627Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-21 14:58:12'),(13,5,'i m late','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 1 times with an average delay of 467 minutes.\",\"You tend to be late most often on Wednesdays.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":1,\"totalHours\":0,\"avgHours\":0}}','attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 1 times with an average delay of 467 minutes.\",\"You tend to be late most often on Wednesdays.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":1,\"totalHours\":0,\"avgHours\":0},\"timestamp\":\"2026-01-21T14:58:26.726Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-21 14:58:26'),(14,5,'hi','I can help you with attendance queries, leave applications, payslip information, reporting lateness, and general HR questions. What would you like help with?','general','{\"intent\":\"general\",\"message\":\"I can help you with attendance queries, leave applications, payslip information, reporting lateness, and general HR questions. What would you like help with?\",\"suggestions\":[\"Check my attendance this month\",\"Apply for leave\",\"Generate my payslip\",\"Report lateness\",\"View my statistics\"],\"timestamp\":\"2026-01-24T18:36:21.267Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-24 18:36:21'),(15,5,'i will be late today','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0,\"avgHours\":0}}','attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0,\"avgHours\":0},\"timestamp\":\"2026-01-24T18:36:43.564Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-24 18:36:43'),(16,5,'show my attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01}}','attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01},\"timestamp\":\"2026-01-24T18:58:18.048Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-24 18:58:18'),(17,5,'attendance details','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01}}','attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01},\"timestamp\":\"2026-01-24T18:58:34.316Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-24 18:58:34'),(18,5,'attendance details','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01}}','attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01},\"timestamp\":\"2026-01-24T18:58:36.312Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-24 18:58:36'),(19,5,'Show me AI predictions about my attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01}}','attendance','{\"intent\":\"attendance\",\"insights\":[\"Your attendance rate is 0.0% this month. Consider improving your consistency.\",\"You\'ve been late 2 times with an average delay of 582 minutes.\",\"You tend to be late most often on Saturdays.\",\"You\'ve worked 0.0 hours this month, averaging 0.0 hours per day.\"],\"stats\":{\"attendanceRate\":0,\"presentDays\":0,\"lateDays\":2,\"totalHours\":0.02,\"avgHours\":0.01},\"timestamp\":\"2026-01-24T18:58:37.898Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-24 18:58:37'),(20,5,'lets talk','I can help you with attendance queries, leave applications, payslip information, reporting lateness, and general HR questions. What would you like help with?','general','{\"intent\":\"general\",\"message\":\"I can help you with attendance queries, leave applications, payslip information, reporting lateness, and general HR questions. What would you like help with?\",\"suggestions\":[\"Check my attendance this month\",\"Apply for leave\",\"Generate my payslip\",\"Report lateness\",\"View my statistics\"],\"timestamp\":\"2026-01-24T18:58:44.448Z\",\"ai_processed\":true,\"confidence\":0.8}','2026-01-24 18:58:44');
/*!40000 ALTER TABLE `ai_chat_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `attendance`
--

DROP TABLE IF EXISTS `attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `clock_in` datetime NOT NULL,
  `clock_out` datetime DEFAULT NULL,
  `hours_worked` decimal(5,2) DEFAULT NULL,
  `status` enum('present','late','absent','overtime','half_day') DEFAULT 'present',
  `location_verified` tinyint(1) DEFAULT 0,
  `clock_in_location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`clock_in_location`)),
  `clock_out_location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`clock_out_location`)),
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_clock_in` (`clock_in`),
  KEY `idx_status` (`status`),
  CONSTRAINT `attendance_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `attendance`
--

LOCK TABLES `attendance` WRITE;
/*!40000 ALTER TABLE `attendance` DISABLE KEYS */;
INSERT INTO `attendance` VALUES (4,5,'2026-01-21 16:47:15','2026-01-21 16:47:30',0.00,'late',1,'{\"latitude\":-26.200706469392067,\"longitude\":28.05801754836939}','{\"latitude\":-26.200706469392067,\"longitude\":28.05801754836939}',NULL,'2026-01-21 14:47:15','2026-01-21 14:47:30'),(5,5,'2026-01-24 20:36:05','2026-01-24 20:37:01',0.02,'late',1,'{\"latitude\":-26.20074677391158,\"longitude\":28.05806326181607}','{\"latitude\":-26.20074677391158,\"longitude\":28.05806326181607}',NULL,'2026-01-24 18:36:05','2026-01-24 18:37:01'),(6,5,'2026-01-24 23:44:38',NULL,NULL,'late',1,'{\"latitude\":-26.200738408706414,\"longitude\":28.058038224461086}',NULL,NULL,'2026-01-24 21:44:38','2026-01-24 21:44:38'),(7,5,'2026-01-25 00:41:41','2026-01-25 00:42:52',0.02,'present',1,'{\"latitude\":-26.200738408706414,\"longitude\":28.058038224461086}','{\"latitude\":-26.200738408706414,\"longitude\":28.058038224461086}',NULL,'2026-01-24 22:41:41','2026-01-24 22:42:52'),(8,5,'2026-01-25 01:07:27','2026-01-25 01:10:28',0.05,'present',1,'{\"latitude\":-26.200641617571602,\"longitude\":28.05811643991731}','{\"latitude\":-26.200701549881295,\"longitude\":28.058154328639677}',NULL,'2026-01-24 23:07:27','2026-01-24 23:10:28'),(9,5,'2026-01-25 01:10:33','2026-01-25 01:10:38',0.00,'present',1,'{\"latitude\":-26.200701549881295,\"longitude\":28.058154328639677}','{\"latitude\":-26.200701549881295,\"longitude\":28.058154328639677}',NULL,'2026-01-24 23:10:33','2026-01-24 23:10:38'),(10,5,'2026-01-25 01:17:01','2026-01-25 01:17:14',0.00,'present',1,'{\"latitude\":-26.200701549881295,\"longitude\":28.058154328639677}','{\"latitude\":-26.200701549881295,\"longitude\":28.058154328639677}',NULL,'2026-01-24 23:17:01','2026-01-24 23:17:14'),(11,5,'2026-01-25 01:22:29','2026-01-25 01:22:54',0.01,'present',1,'{\"latitude\":-26.20070813840866,\"longitude\":28.05807153790798}','{\"latitude\":-26.20070813840866,\"longitude\":28.05807153790798}',NULL,'2026-01-24 23:22:29','2026-01-24 23:22:54'),(12,5,'2026-01-28 21:59:21','2026-01-28 21:59:36',0.00,'late',1,'{\"latitude\":-26.200608002554024,\"longitude\":28.057983439182873}','{\"latitude\":-26.200608002554024,\"longitude\":28.057983439182873}',NULL,'2026-01-28 19:59:21','2026-01-28 19:59:36');
/*!40000 ALTER TABLE `attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary table structure for view `attendance_stats`
--

DROP TABLE IF EXISTS `attendance_stats`;
/*!50001 DROP VIEW IF EXISTS `attendance_stats`*/;
SET @saved_cs_client     = @@character_set_client;
SET character_set_client = utf8;
/*!50001 CREATE VIEW `attendance_stats` AS SELECT
 1 AS `user_id`,
  1 AS `name`,
  1 AS `role`,
  1 AS `present_days`,
  1 AS `late_days`,
  1 AS `absent_days`,
  1 AS `overtime_days`,
  1 AS `total_hours`,
  1 AS `avg_hours_per_day` */;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
INSERT INTO `leave_requests` VALUES (1,5,'sick','2026-01-28','2026-01-29',NULL,'approved',1,'2026-01-24 20:37:52',NULL,NULL,'2026-01-24 18:35:46','2026-01-24 18:37:52');
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,1,'Late Arrival','Prince Mthethwa clocked in late at 14:48:19','warning',1,NULL,'2026-01-21 12:48:19'),(4,1,'Late Arrival','Prince Mthethwa clocked in late at 14:52:22','warning',1,NULL,'2026-01-21 12:52:22'),(7,1,'New User Registration','Phumla Rhalarala (phumla@initialventures.com) has registered as student','info',1,NULL,'2026-01-21 13:35:54'),(8,1,'AI Detected: Leave Request','User requested leave application assistance via AI chatbot. Intent confidence: High.','info',1,NULL,'2026-01-21 13:46:43'),(9,1,'AI Detected: Leave Request','User requested leave application assistance via AI chatbot. Intent confidence: High.','info',1,NULL,'2026-01-21 14:00:42'),(10,1,'AI Detected: Leave Request','User requested leave application assistance via AI chatbot. Intent confidence: High.','info',1,NULL,'2026-01-21 14:11:08'),(11,1,'New User Registration','Prince Mthethwa (Lunga.student@university.com) has registered as student','info',1,NULL,'2026-01-21 14:30:25'),(12,1,'Late Arrival','Prince Mthethwa clocked in late at 16:47:15','warning',1,NULL,'2026-01-21 14:47:15'),(13,5,'Late Clock In','You clocked in late at 16:47:15. Please ensure you arrive on time.','warning',1,NULL,'2026-01-21 14:47:15'),(14,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0 hours.','success',1,NULL,'2026-01-21 14:47:30'),(15,1,'New Leave Request','A new sick leave request has been submitted.','info',1,NULL,'2026-01-24 18:35:46'),(16,1,'Late Arrival','Prince Mthethwa clocked in late at 20:36:05','warning',1,NULL,'2026-01-24 18:36:05'),(17,5,'Late Clock In','You clocked in late at 20:36:05. Please ensure you arrive on time.','warning',1,NULL,'2026-01-24 18:36:05'),(18,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0.02 hours.','success',1,NULL,'2026-01-24 18:37:01'),(19,5,'Leave Request Approved','Your sick leave request from Wed Jan 28 2026 00:00:00 GMT+0200 (South Africa Standard Time) to Thu Jan 29 2026 00:00:00 GMT+0200 (South Africa Standard Time) has been approved.','success',1,NULL,'2026-01-24 18:37:52'),(20,1,'Late Arrival','Prince Mthethwa clocked in late at 23:44:38','warning',1,NULL,'2026-01-24 21:44:38'),(21,5,'Late Clock In','You clocked in late at 23:44:38. Please ensure you arrive on time.','warning',1,NULL,'2026-01-24 21:44:38'),(22,5,'Clock In Successful','You have successfully clocked in at 00:41:41. Have a productive day!','success',0,NULL,'2026-01-24 22:41:41'),(23,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0.02 hours.','success',0,NULL,'2026-01-24 22:42:52'),(24,5,'Clock In Successful','You have successfully clocked in at 01:07:27. Have a productive day!','success',0,NULL,'2026-01-24 23:07:27'),(25,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0.05 hours.','success',0,NULL,'2026-01-24 23:10:28'),(26,5,'Clock In Successful','You have successfully clocked in at 01:10:33. Have a productive day!','success',0,NULL,'2026-01-24 23:10:33'),(27,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0 hours.','success',0,NULL,'2026-01-24 23:10:38'),(28,5,'Clock In Successful','You have successfully clocked in at 01:17:01. Have a productive day!','success',0,NULL,'2026-01-24 23:17:01'),(29,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0 hours.','success',0,NULL,'2026-01-24 23:17:14'),(30,1,'Clock In','Prince Mthethwa clocked in at 01:22:29','info',0,NULL,'2026-01-24 23:22:30'),(31,5,'Clock In Successful','You have successfully clocked in at 01:22:29. Have a productive day!','success',0,NULL,'2026-01-24 23:22:30'),(32,1,'Clock Out','Prince Mthethwa clocked out. Hours worked: 0.01 hours.','info',0,NULL,'2026-01-24 23:22:54'),(33,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0.01 hours.','success',0,NULL,'2026-01-24 23:22:54'),(34,1,'Late Arrival','Prince Mthethwa clocked in late at 21:59:21','warning',0,NULL,'2026-01-28 19:59:21'),(35,5,'Late Clock In','You clocked in late at 21:59:21. Please ensure you arrive on time.','warning',0,NULL,'2026-01-28 19:59:21'),(36,1,'Clock Out','Prince Mthethwa clocked out. Hours worked: 0 hours.','info',0,NULL,'2026-01-28 19:59:36'),(37,5,'Clock Out Successful','You have successfully clocked out. Total hours worked today: 0 hours.','success',0,NULL,'2026-01-28 19:59:36');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reports` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `generated_by` int(11) NOT NULL,
  `type` enum('attendance_summary','hours_report','individual_performance','leave_report') NOT NULL,
  `period_start` date NOT NULL,
  `period_end` date NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `file_type` enum('pdf','csv','xlsx') DEFAULT 'pdf',
  `parameters` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`parameters`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_generated_by` (`generated_by`),
  KEY `idx_type` (`type`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`generated_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (1,1,'attendance_summary','2026-01-14','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-21T12-12-43-072Z.pdf','pdf','{}','2026-01-21 12:12:43'),(2,1,'attendance_summary','2026-01-14','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-21T12-12-46-646Z.csv','csv','{}','2026-01-21 12:12:46'),(3,1,'hours_report','2026-01-14','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\hours_report_2026-01-21T12-12-50-593Z.pdf','pdf','{}','2026-01-21 12:12:50'),(4,1,'attendance_summary','2025-12-31','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-21T12-51-01-198Z.csv','csv','{}','2026-01-21 12:51:01'),(5,1,'attendance_summary','2026-01-14','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-21T12-51-31-285Z.pdf','pdf','{}','2026-01-21 12:51:31'),(6,1,'attendance_summary','2026-01-14','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-21T12-51-44-474Z.pdf','pdf','{}','2026-01-21 12:51:44'),(7,1,'attendance_summary','2025-12-31','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-21T13-44-53-225Z.csv','csv','{}','2026-01-21 13:44:53'),(8,1,'hours_report','2026-01-14','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\hours_report_2026-01-21T13-45-24-308Z.pdf','pdf','{}','2026-01-21 13:45:24'),(9,1,'attendance_summary','2026-01-14','2026-01-21','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-21T14-57-16-868Z.pdf','pdf','{}','2026-01-21 14:57:16'),(10,1,'attendance_summary','2025-12-31','2026-01-24','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-24T18-34-24-302Z.csv','csv','{}','2026-01-24 18:34:24'),(11,1,'attendance_summary','2026-01-17','2026-01-24','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-24T18-37-59-062Z.pdf','pdf','{}','2026-01-24 18:37:59'),(12,1,'attendance_summary','2026-01-17','2026-01-24','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-24T21-39-59-102Z.pdf','pdf','{}','2026-01-24 21:39:59'),(13,1,'hours_report','2026-01-17','2026-01-24','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\hours_report_2026-01-24T21-40-10-341Z.pdf','pdf','{}','2026-01-24 21:40:10'),(14,1,'attendance_summary','2026-01-17','2026-01-24','C:\\Users\\mthet\\OneDrive\\Desktop\\AI attendance\\server\\reports\\attendance_summary_2026-01-24T21-40-18-594Z.pdf','pdf','{}','2026-01-24 21:40:18');
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `settings`
--

DROP TABLE IF EXISTS `settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text NOT NULL,
  `description` text DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=50 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `settings`
--

LOCK TABLES `settings` WRITE;
/*!40000 ALTER TABLE `settings` DISABLE KEYS */;
INSERT INTO `settings` VALUES (1,'work_start_time','09:00','Default work start time','2026-01-21 11:29:26'),(2,'work_end_time','17:00','Default work end time','2026-01-21 11:29:26'),(3,'late_threshold_minutes','15','Minutes after start time to be considered late','2026-01-21 11:29:26'),(4,'overtime_threshold_hours','8','Hours after which overtime is calculated','2026-01-21 11:29:26'),(5,'office_latitude','-26.1942','Office location latitude','2026-01-24 22:06:19'),(6,'office_longitude','28.0578','Office location longitude','2026-01-24 22:06:19'),(7,'location_radius_meters','5000','Allowed radius from office for clock in/out','2026-01-24 22:06:19'),(8,'company_name','Initium Venture Solutions','Company name for reports','2026-01-21 11:29:26');
/*!40000 ALTER TABLE `settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `role` enum('admin','employee','student') NOT NULL DEFAULT 'employee',
  `facial_descriptors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`facial_descriptors`)),
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin@initiumventures.com','$2a$10$GAIZzCrAet5.6xW.3PqP2ODgiyyJJB5m6qEvIykKXmninsWqHqJD.','System Administrator','admin',NULL,'active',NULL,NULL,NULL,'2026-01-21 11:31:43','2026-01-24 18:31:50'),(4,'admin@initialventures.com','$2a$10$sdI.kKymuBa9dykUWIEzc.ehy8xhiPf2cBZfjnc0S28AB6LkOUxg6','System Administrator','admin',NULL,'active',NULL,NULL,NULL,'2026-01-21 13:44:35','2026-01-21 13:44:35'),(5,'Lunga.student@university.com','$2a$10$nyF63Qq4X0R6ihyiL1q2h.7MYQS1vb0P4ddOipHk1H0eWHicvo4C.','Prince Mthethwa','student','[-0.15034517645835876,-0.024321677163243294,0.008619613945484161,0.004836723208427429,-0.014334654435515404,-0.014001519419252872,0.06583934277296066,-0.08988989889621735,0.20036640763282776,-0.039913054555654526,0.28100425004959106,0.04050721600651741,-0.17601187527179718,-0.1703675389289856,0.08169423788785934,0.07346337288618088,-0.1837196797132492,-0.06757867336273193,-0.10818357765674591,-0.09998561441898346,-0.06340048462152481,-0.02157297544181347,0.02307027019560337,0.02115618623793125,-0.09095752239227295,-0.2703133523464203,-0.09560676664113998,-0.1852005124092102,0.15616895258426666,-0.06106690689921379,0.0044179349206388,0.07246913015842438,-0.1851562112569809,-0.12098857015371323,0.02200552076101303,0.09642791002988815,0.020533761009573936,-0.008435151539742947,0.18601645529270172,-0.07636673003435135,-0.11738560348749161,-0.015072534792125225,-0.017526328563690186,0.2520385682582855,0.12460721284151077,0.03552807867527008,-0.01367166731506586,0.009854395873844624,0.10250943154096603,-0.20669777691364288,0.04404542222619057,0.09112586081027985,0.19919933378696442,-0.007517035119235516,0.000056073564337566495,-0.20450416207313538,-0.01907828263938427,0.06979281455278397,-0.21034027636051178,0.053616076707839966,0.04893284663558006,-0.11731118708848953,-0.10906650125980377,-0.039934191852808,0.23105894029140472,0.08580093830823898,-0.12260965257883072,-0.15471041202545166,0.24232633411884308,-0.09758466482162476,0.07535790652036667,0.11356554180383682,-0.1436254382133484,-0.16637186706066132,-0.22342351078987122,0.12676142156124115,0.4018889367580414,0.06691330671310425,-0.14559224247932434,0.013705526478588581,-0.20744207501411438,0.012322109192609787,-0.07836220413446426,0.024134516716003418,-0.052926018834114075,-0.020624477416276932,-0.09429650008678436,-0.01837330125272274,0.10493708401918411,-0.021523255854845047,0.02612174302339554,0.17153801023960114,-0.007197064347565174,-0.013989279977977276,-0.01620319113135338,-0.03661183640360832,-0.03740514814853668,-0.013748222030699253,-0.07021921873092651,0.0082497987896204,0.06347784399986267,-0.13558903336524963,0.07197260111570358,0.098839171230793,-0.21212027966976166,0.1575331687927246,0.008960658684372902,-0.010459820739924908,0.10025686770677567,0.013549625873565674,-0.04123710095882416,-0.07492255419492722,0.19572202861309052,-0.32294461131095886,0.2054789513349533,0.1887231469154358,0.06876737624406815,0.18519003689289093,-0.023769531399011612,0.137471541762352,-0.03685423731803894,0.029460445046424866,-0.21249541640281677,-0.05641020089387894,0.004654919728636742,-0.09050372242927551,-0.04473203048110008,0.05511995777487755]','active',NULL,NULL,NULL,'2026-01-21 14:30:25','2026-01-21 14:30:25');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `weekly_schedule`
--

DROP TABLE IF EXISTS `weekly_schedule`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `weekly_schedule`
--

LOCK TABLES `weekly_schedule` WRITE;
/*!40000 ALTER TABLE `weekly_schedule` DISABLE KEYS */;
INSERT INTO `weekly_schedule` VALUES (1,'thursday','09:00:00','15:30:00','Presentations',NULL,'Main Office',1,'student',1,'2026-01-24 22:06:31','2026-01-24 22:06:31'),(2,'monday','09:00:00','10:00:00','LLM',NULL,'Main Office',1,'all',1,'2026-01-24 22:07:28','2026-01-24 22:07:28');
/*!40000 ALTER TABLE `weekly_schedule` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `attendance_stats`
--

/*!50001 DROP VIEW IF EXISTS `attendance_stats`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_unicode_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`localhost` SQL SECURITY DEFINER */
/*!50001 VIEW `attendance_stats` AS select `u`.`id` AS `user_id`,`u`.`name` AS `name`,`u`.`role` AS `role`,count(case when `a`.`status` = 'present' then 1 end) AS `present_days`,count(case when `a`.`status` = 'late' then 1 end) AS `late_days`,count(case when `a`.`status` = 'absent' then 1 end) AS `absent_days`,count(case when `a`.`status` = 'overtime' then 1 end) AS `overtime_days`,coalesce(sum(`a`.`hours_worked`),0) AS `total_hours`,coalesce(avg(`a`.`hours_worked`),0) AS `avg_hours_per_day` from (`users` `u` left join `attendance` `a` on(`u`.`id` = `a`.`user_id`)) group by `u`.`id`,`u`.`name`,`u`.`role` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-28 22:39:07
