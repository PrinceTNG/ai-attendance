-- Fix: Add missing avatar_url column to users table
-- Run this in DBeaver connected to your Aiven MySQL database

-- Add avatar_url column to users table
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL AFTER status;

-- Verify the column was added
DESCRIBE users;

-- Test query to make sure it works
SELECT id, email, name, role, status, avatar_url, phone, department, facial_descriptors, created_at 
FROM users 
LIMIT 1;
