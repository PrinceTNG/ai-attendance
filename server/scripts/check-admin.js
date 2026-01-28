require('dotenv').config();
const { query, testConnection } = require('../config/db');

async function checkAdmin() {
  try {
    console.log('🔍 Checking database connection...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Cannot connect to database.');
      process.exit(1);
    }

    console.log('✅ Database connected\n');
    
    // Check all admin users
    const admins = await query('SELECT id, email, name, role, status FROM users WHERE role = "admin"');
    
    console.log('📋 Admin users in database:');
    if (admins.length === 0) {
      console.log('   ❌ No admin users found!');
    } else {
      admins.forEach(admin => {
        console.log(`   ✅ ${admin.email} - ${admin.name} (${admin.status})`);
      });
    }
    
    // Check if the user's email exists
    const userEmail = 'admin@initialventures.com';
    const userCheck = await query('SELECT id, email, role, status FROM users WHERE email = ?', [userEmail]);
    
    console.log(`\n🔍 Checking for: ${userEmail}`);
    if (userCheck.length > 0) {
      console.log(`   ✅ Found: ${userCheck[0].email} (${userCheck[0].role})`);
    } else {
      console.log(`   ❌ Not found in database`);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAdmin();
