-- ============================================================
-- BlogForge — MySQL init script
-- Runs automatically on first container startup
-- ============================================================

-- Ensure database exists with correct charset
CREATE DATABASE IF NOT EXISTS `blogforge`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Grant privileges to app user
GRANT ALL PRIVILEGES ON `blogforge`.* TO 'blogforge'@'%';
FLUSH PRIVILEGES;
