-- Add missing columns to users table in Aiven MySQL
-- Run these commands one by one in DBeaver

-- 1. Add avatar_url column
ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) DEFAULT NULL;

-- 2. Add phone column (if missing)
ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL;

-- 3. Add department column (if missing)
ALTER TABLE users ADD COLUMN department VARCHAR(100) DEFAULT NULL;

-- 4. Verify all columns are now present
DESCRIBE users;

-- 5. Test the query that was failing
SELECT id, email, name, role, status, avatar_url, phone, department, facial_descriptors, created_at 
FROM users 
LIMIT 1;
