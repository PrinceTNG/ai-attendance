const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

async function setupAdmin() {
  try {
    const email = 'admin@initiumventures.com';
    const password = 'admin123';
    const name = 'System Administrator';

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Check if admin exists
    const existingAdmin = await query('SELECT id FROM users WHERE email = ?', [email]);

    if (existingAdmin.length > 0) {
      // Update existing admin
      await query(
        'UPDATE users SET password_hash = ?, name = ?, role = "admin", status = "active" WHERE email = ?',
        [passwordHash, name, email]
      );
      console.log('✅ Admin user updated successfully');
    } else {
      // Create new admin
      await query(
        'INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, "admin", "active")',
        [email, passwordHash, name]
      );
      console.log('✅ Admin user created successfully');
    }

    console.log(`\nAdmin Credentials:`);
    console.log(`Email: ${email}`);
    console.log(`Password: ${password}\n`);
  } catch (error) {
    console.error('❌ Error setting up admin:', error);
    process.exit(1);
  }
}

setupAdmin();
