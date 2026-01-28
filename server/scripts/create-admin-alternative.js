require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query, testConnection } = require('../config/db');

async function createAlternativeAdmin() {
  try {
    console.log('🔍 Checking database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Cannot connect to database. Please check your XAMPP MySQL is running.');
      process.exit(1);
    }

    console.log('✅ Database connected');
    
    // Create admin with the email user is trying to use
    const email = 'admin@initialventures.com';
    const password = 'admin123';
    const name = 'System Administrator';

    console.log('🔐 Hashing password...');
    const passwordHash = await bcrypt.hash(password, 10);

    console.log('🔍 Checking if admin user exists...');
    const existingAdmin = await query('SELECT id, email, password_hash FROM users WHERE email = ?', [email]);

    if (existingAdmin.length > 0) {
      console.log('📝 Updating existing admin user...');
      await query(
        'UPDATE users SET password_hash = ?, name = ?, role = "admin", status = "active" WHERE email = ?',
        [passwordHash, name, email]
      );
      console.log('✅ Admin user password updated successfully!');
    } else {
      console.log('➕ Creating new admin user...');
      await query(
        'INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, "admin", "active")',
        [email, passwordHash, name]
      );
      console.log('✅ Admin user created successfully!');
    }

    // Verify the password works
    console.log('🔐 Verifying password hash...');
    const verifyUser = await query('SELECT password_hash FROM users WHERE email = ?', [email]);
    if (verifyUser.length > 0) {
      const isValid = await bcrypt.compare(password, verifyUser[0].password_hash);
      if (isValid) {
        console.log('✅ Password verification successful!');
      } else {
        console.error('❌ Password verification failed!');
      }
    }

    console.log('\n📋 Admin Credentials:');
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n✅ Setup complete! You can now login with these credentials.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin:', error);
    process.exit(1);
  }
}

createAlternativeAdmin();
