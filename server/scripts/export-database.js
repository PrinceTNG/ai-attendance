/**
 * Database Export Script
 * Exports the entire ai_attendance database to a SQL file
 * 
 * Usage: node scripts/export-database.js [output-file]
 * Example: node scripts/export-database.js backup.sql
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Get output filename from command line or use default
const outputFile = process.argv[2] || `ai_attendance_backup_${new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]}.sql`;
const outputPath = path.join(__dirname, '..', '..', outputFile);

// Database configuration (from .env or defaults)
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_attendance',
  port: process.env.DB_PORT || 3306
};

// Find mysqldump executable
const xamppPath = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
const systemPath = 'mysqldump';

let mysqldumpPath = xamppPath;
if (!fs.existsSync(mysqldumpPath)) {
  mysqldumpPath = systemPath;
  console.log('⚠️  XAMPP mysqldump not found, using system mysqldump');
}

// Build mysqldump command
let command = `"${mysqldumpPath}"`;
command += ` -h ${dbConfig.host}`;
command += ` -P ${dbConfig.port}`;
command += ` -u ${dbConfig.user}`;

if (dbConfig.password) {
  command += ` -p${dbConfig.password}`;
} else {
  command += ` -p`;
}

command += ` ${dbConfig.database}`;
command += ` > "${outputPath}"`;

console.log('📦 Exporting database...');
console.log(`   Database: ${dbConfig.database}`);
console.log(`   Output: ${outputPath}`);
console.log('');

// Execute mysqldump
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Export failed:', error.message);
    console.error('');
    console.error('Troubleshooting:');
    console.error('1. Ensure MySQL is running in XAMPP');
    console.error('2. Check database credentials in .env file');
    console.error('3. Verify mysqldump is available');
    console.error('');
    console.error('Manual export:');
    console.error(`   cd C:\\xampp\\mysql\\bin`);
    console.error(`   mysqldump -u ${dbConfig.user} ${dbConfig.password ? '-p' : ''} ${dbConfig.database} > "${outputPath}"`);
    process.exit(1);
  }

  if (stderr && !stderr.includes('Warning')) {
    console.error('⚠️  Warnings:', stderr);
  }

  // Check if file was created
  if (fs.existsSync(outputPath)) {
    const stats = fs.statSync(outputPath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Database exported successfully!');
    console.log(`   File: ${outputPath}`);
    console.log(`   Size: ${fileSizeMB} MB`);
    console.log('');
    console.log('📋 To import on another PC:');
    console.log(`   mysql -u root -p ai_attendance < "${outputPath}"`);
  } else {
    console.error('❌ Export file was not created');
    console.error('   Check if you have write permissions');
    process.exit(1);
  }
});
