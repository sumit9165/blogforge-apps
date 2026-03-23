const mysql = require('mysql2/promise');
require('dotenv').config();

// ──────────────────────────────────────────────────────────────
// mysql2 supports these authPlugins natively.
// If your MySQL/MariaDB uses a different plugin (e.g. auth_gssapi_client,
// sha256_password, caching_sha2_password) you may get a connection error.
//
// FIXES (run ONE of these in your MySQL/MariaDB shell):
//
//  Option A — Change root to use mysql_native_password (most compatible):
//    ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
//    FLUSH PRIVILEGES;
//
//  Option B — Create a dedicated app user with native password:
//    CREATE USER 'blogforge'@'localhost' IDENTIFIED WITH mysql_native_password BY 'StrongPass123!';
//    GRANT ALL PRIVILEGES ON blogforge.* TO 'blogforge'@'localhost';
//    FLUSH PRIVILEGES;
//
//  Option C — If using MariaDB, use mysql_native_password:
//    ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('your_password');
//    FLUSH PRIVILEGES;
//
//  After any of the above, update your backend/.env accordingly.
// ──────────────────────────────────────────────────────────────

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'blogforge',

  // ── Explicit auth plugin override ──────────────────────────
  // Forces mysql2 to use the standard password auth plugin.
  // This resolves "unknown plugin auth_gssapi_client" errors.
  authPlugins: {
    auth_gssapi_client: () => () => Buffer.alloc(0),
    // Uncomment below if you see "caching_sha2_password" errors instead:
    // caching_sha2_password: () => () => Buffer.alloc(0),
  },

  waitForConnections: true,
  connectionLimit:    process.env.NODE_ENV === 'production' ? 20 : 10,
  queueLimit:         0,
  enableKeepAlive:    true,
  keepAliveInitialDelay: 0,
  charset:            'utf8mb4',
  timezone:           'Z',
  connectTimeout:     10000,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    const [[{ version }]] = await conn.query('SELECT VERSION() AS version');
    console.log(`✅ MySQL connected — server version: ${version}`);
    conn.release();
  } catch (err) {
    console.error('❌ MySQL connection failed:', err.message);
    console.error('\n📋 Troubleshooting guide:');
    console.error('  1. Is MySQL/MariaDB running?');
    console.error('     Windows: Check Services → "MySQL" or "MariaDB"');
    console.error('     Or run:  mysql -u root -p  (to test CLI access)');
    console.error('');
    console.error('  2. Auth plugin error (auth_gssapi_client / unknown plugin)?');
    console.error('     Run this in your MySQL shell:');
    console.error("     ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';");
    console.error('     FLUSH PRIVILEGES;');
    console.error('');
    console.error('  3. Check your backend/.env values:');
    console.error(`     DB_HOST     = ${process.env.DB_HOST     || '(not set → localhost)'}`);
    console.error(`     DB_PORT     = ${process.env.DB_PORT     || '(not set → 3306)'}`);
    console.error(`     DB_USER     = ${process.env.DB_USER     || '(not set → root)'}`);
    console.error(`     DB_PASSWORD = ${process.env.DB_PASSWORD ? '(set)' : '(empty — may need a password)'}`);
    console.error(`     DB_NAME     = ${process.env.DB_NAME     || '(not set → blogforge)'}`);
    console.error('');
    console.error('  4. Database does not exist yet? Run:  npm run migrate');
    process.exit(1);
  }
}

module.exports = { pool, testConnection };
