# ✦ BlogForge

> A beautiful, secure, full-stack blogging platform — **React + Vite** frontend, **Express.js + MySQL/MariaDB** backend. Write, publish, and share stories that matter.

![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)
![MySQL](https://img.shields.io/badge/MySQL-8.0%20%7C%20MariaDB%2012-blue)
![Docker](https://img.shields.io/badge/Docker-ready-2496ED)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## Table of Contents

1. [Features](#features)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Quick Start — Choose Your Setup](#quick-start--choose-your-setup)
   - [Option A: XAMPP (MariaDB 12) — Easiest for Windows](#option-a-xampp-mariadb-12--easiest-for-windows)
   - [Option B: MySQL Workbench (MySQL 8.0)](#option-b-mysql-workbench-mysql-80)
   - [Option C: Docker Compose — One Command](#option-c-docker-compose--one-command)
5. [Environment Variables](#environment-variables)
6. [Database Schema](#database-schema)
7. [API Reference](#api-reference)
8. [Security Architecture](#security-architecture)
9. [Production Deployment](#production-deployment)
   - [Option 1: Docker Compose (Recommended)](#option-1-docker-compose-recommended)
   - [Option 2: VPS with Nginx + PM2](#option-2-vps-with-nginx--pm2)
10. [Configuration Reference](#configuration-reference)
11. [Troubleshooting](#troubleshooting)

---

## Features

| Feature | Details |
|---|---|
| ✍️ Rich text editor | Tiptap — headings, bold, italic, code blocks, blockquotes, lists, links |
| 🌍 Public blog feed | Anyone reads published posts — no account needed |
| 🔐 Auth system | JWT + httpOnly cookies + rotating refresh tokens |
| 📝 Draft / Publish | Save drafts privately, publish when ready |
| 🕐 Timestamps | Created, updated, published dates all tracked |
| 👁️ View counter | Auto-increments per post visit |
| 🔍 Search & pagination | Search title + excerpt, paginated results |
| 🏷️ Tags | Up to 10 tags per post |
| 🛡️ Security | CSRF (double-submit cookie), XSS sanitization, DDoS rate limiting, Helmet |
| 📱 Responsive | Mobile-first, hamburger nav |
| 🐳 Docker ready | Dev + production Docker Compose configs included |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, React Router 6, Tiptap (rich editor), Axios |
| Backend | Express.js, Node.js ≥ 18 |
| Database | MySQL 8.0 or MariaDB 10+ / 12 (via mysql2 connection pool) |
| Auth | JWT (15m access + 30d refresh), bcrypt (cost 12) |
| Security | Helmet, CORS, express-rate-limit, express-slow-down, xss sanitizer |
| Logging | Winston |
| Container | Docker, Docker Compose, Nginx |

---

## Project Structure

```
blogforge/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js            # MySQL/MariaDB pool + auth plugin handling
│   │   │   └── migrate.js       # DB schema migration (idempotent)
│   │   ├── controllers/
│   │   │   ├── authController.js  # Register/login/logout/refresh/CSRF
│   │   │   └── blogController.js  # Full CRUD + view counter
│   │   ├── middleware/
│   │   │   ├── auth.js            # JWT verify, optionalAuth, CSRF check
│   │   │   ├── rateLimiter.js     # 4-layer DDoS protection
│   │   │   └── validation.js      # express-validator rules
│   │   ├── routes/
│   │   │   ├── auth.js            # /api/auth/*
│   │   │   └── blogs.js           # /api/blogs/* + /api/my/blogs/*
│   │   ├── utils/
│   │   │   ├── helpers.js         # Slug, read-time, UUID, XSS sanitize
│   │   │   └── logger.js          # Winston logger
│   │   └── server.js              # Express entry point
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx / .css
│   │   │   ├── Footer.jsx / .css
│   │   │   ├── BlogCard.jsx / .css
│   │   │   └── RichEditor.jsx / .css  # Tiptap wrapper
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx        # Global auth state
│   │   ├── pages/
│   │   │   ├── HomePage.jsx / .css
│   │   │   ├── BlogListPage.jsx / .css
│   │   │   ├── BlogDetailPage.jsx / .css
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── AuthPage.css
│   │   │   ├── DashboardPage.jsx / .css
│   │   │   ├── EditorPage.jsx / .css
│   │   │   └── NotFoundPage.jsx / .css
│   │   ├── utils/
│   │   │   └── api.js                 # Axios + CSRF + auto token refresh
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css                  # Design system
│   ├── Dockerfile
│   ├── nginx.conf                     # Nginx config for frontend container
│   ├── .env.example
│   └── package.json
│
├── docker/
│   ├── mysql/
│   │   └── init.sql                   # DB init script for Docker
│   ├── nginx/
│   │   └── prod.conf                  # Production reverse proxy config
│   └── ssl/
│       └── .gitkeep                   # Place your SSL certs here
│
├── docker-compose.yml                 # Development (hot reload)
├── docker-compose.prod.yml            # Production (built images)
├── docker-compose.override.example.yml
├── nginx.conf.example                 # Standalone Nginx (non-Docker)
├── .gitignore
├── .dockerignore
└── README.md
```

---

## Quick Start — Choose Your Setup

### Option A: XAMPP (MariaDB 12) — Easiest for Windows

> Best for: Windows users, students, quick local development

**Step 1 — Install XAMPP**

Download from https://www.apachefriends.org and install. Start the **Apache** and **MySQL** modules from the XAMPP Control Panel.

**Step 2 — Fix the auth plugin (MariaDB requires this)**

Open your browser and go to: `http://localhost/phpmyadmin`

Click **SQL** tab and run:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
FLUSH PRIVILEGES;
```

> If your root user has a password, replace `''` with `'your_password'`.

**Step 3 — Create the database**

In phpMyAdmin, click **New** in the left sidebar and create a database named `blogforge` with collation `utf8mb4_unicode_ci`.

Or run in the SQL tab:

```sql
CREATE DATABASE IF NOT EXISTS `blogforge`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

**Step 4 — Configure backend .env**

Create the file `backend/.env` (copy from `backend/.env.example`):

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=blogforge

JWT_SECRET=paste_a_very_long_random_string_here_minimum_32_characters
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=paste_another_different_long_random_string_here
JWT_REFRESH_EXPIRES_IN=30d

CSRF_SECRET=another_random_string_32_chars
COOKIE_SECRET=yet_another_random_string_32_chars

ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
LOG_LEVEL=debug
```

> To generate secrets quickly, open a terminal and run:
> `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
> Run it 4 times, paste each result into the corresponding secret field.

**Step 5 — Install dependencies & run migration**

```bash
cd blogforge
npm install
npm run install:all
npm run migrate
```

**Step 6 — Start development servers**

```bash
npm run dev
```

Open **http://localhost:5173** ✨

---

### Option B: MySQL Workbench (MySQL 8.0)

> Best for: developers who prefer a GUI database tool

**Step 1 — Install MySQL 8.0**

Download MySQL Community Server from https://dev.mysql.com/downloads/mysql/

During installation, choose **"Use Legacy Authentication Method"** when prompted (this avoids auth plugin issues with Node.js).

**Step 2 — Connect in MySQL Workbench**

Open MySQL Workbench → click the **+** next to "MySQL Connections":

| Field | Value |
|---|---|
| Connection Name | BlogForge Local |
| Hostname | 127.0.0.1 |
| Port | 3306 |
| Username | root |
| Password | (your root password) |

Click **Test Connection** — it should say "Successfully made the MySQL connection".

**Step 3 — Fix auth plugin (if you chose strong auth during install)**

In MySQL Workbench, open a new query tab and run:

```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```

**Step 4 — Create a dedicated database user (recommended)**

```sql
CREATE DATABASE IF NOT EXISTS `blogforge`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create a dedicated user (safer than using root)
CREATE USER 'blogforge_user'@'localhost'
  IDENTIFIED WITH mysql_native_password BY 'StrongPass123!';

GRANT ALL PRIVILEGES ON `blogforge`.* TO 'blogforge_user'@'localhost';
FLUSH PRIVILEGES;
```

**Step 5 — Configure backend .env**

```env
PORT=5000
NODE_ENV=development

DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=blogforge_user
DB_PASSWORD=StrongPass123!
DB_NAME=blogforge

JWT_SECRET=<generate with: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate another>
JWT_REFRESH_EXPIRES_IN=30d

CSRF_SECRET=<generate another>
COOKIE_SECRET=<generate another>

ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
LOG_LEVEL=debug
```

**Step 6 — Run migration & start**

```bash
npm run install:all
npm run migrate
npm run dev
```

**Viewing your data in Workbench:**

After running the app, go to MySQL Workbench → your connection → expand `blogforge` in the left panel. You'll see `users`, `blogs`, and `refresh_tokens` tables. Right-click any table → **Select Rows** to view data.

---

### Option C: Docker Compose — One Command

> Best for: developers who want zero local MySQL setup, or teams

**Prerequisites:**
- Docker Desktop installed and running (https://www.docker.com/products/docker-desktop/)
- Docker Compose v2 (included with Docker Desktop)

**Step 1 — Create backend/.env**

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — the Docker setup will override `DB_HOST` automatically, so you only need to set secrets:

```env
PORT=5000
NODE_ENV=development

# These are overridden by docker-compose but still needed
DB_HOST=db
DB_PORT=3306
DB_USER=blogforge
DB_PASSWORD=blogforge_pass
DB_NAME=blogforge

JWT_SECRET=<64-char random string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<64-char random string>
JWT_REFRESH_EXPIRES_IN=30d
CSRF_SECRET=<32-char random string>
COOKIE_SECRET=<32-char random string>

ALLOWED_ORIGINS=http://localhost:5173
COOKIE_SECURE=false
COOKIE_SAME_SITE=lax
LOG_LEVEL=debug
```

**Step 2 — Start everything**

```bash
docker-compose up
```

This starts 3 containers:
- `blogforge-db` — MySQL 8.0 on port 3306
- `blogforge-api` — Express API on port 5000
- `blogforge-web` — React/Vite dev server on port 5173

**Step 3 — Run migration (first time only)**

```bash
docker-compose exec backend npm run migrate
```

Open **http://localhost:5173** ✨

**Useful Docker commands:**

```bash
# View logs for all services
docker-compose logs -f

# View logs for one service
docker-compose logs -f backend

# Restart one service
docker-compose restart backend

# Stop everything
docker-compose down

# Stop and remove volumes (wipes database!)
docker-compose down -v

# Connect to MySQL inside the container
docker-compose exec db mysql -u root -pblogforge_root_pass blogforge
```

**Connect MySQL Workbench to Docker MySQL:**

When Docker is running, add a Workbench connection with:

| Field | Value |
|---|---|
| Hostname | 127.0.0.1 |
| Port | 3306 |
| Username | root |
| Password | blogforge_root_pass |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | No | `5000` | Server port |
| `NODE_ENV` | No | `development` | `development` or `production` |
| `DB_HOST` | No | `localhost` | MySQL/MariaDB host |
| `DB_PORT` | No | `3306` | MySQL/MariaDB port |
| `DB_USER` | No | `root` | Database username |
| `DB_PASSWORD` | No | _(empty)_ | Database password |
| `DB_NAME` | No | `blogforge` | Database name |
| `JWT_SECRET` | **Yes** | — | Min 32 chars, signs access tokens |
| `JWT_EXPIRES_IN` | No | `15m` | Access token lifetime |
| `JWT_REFRESH_SECRET` | **Yes** | — | Min 32 chars, signs refresh tokens |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token lifetime |
| `CSRF_SECRET` | **Yes** | — | Min 32 chars |
| `COOKIE_SECRET` | **Yes** | — | Min 32 chars |
| `ALLOWED_ORIGINS` | No | `http://localhost:5173` | Comma-separated CORS origins |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Max auth requests per window |
| `COOKIE_SECURE` | No | `false` | `true` in production (HTTPS) |
| `COOKIE_SAME_SITE` | No | `lax` | `strict` in production |
| `LOG_LEVEL` | No | `debug` | `debug`/`info`/`warn`/`error` |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:5000` | Backend URL (dev only, Vite proxies in dev) |
| `VITE_APP_NAME` | `BlogForge` | App name |

---

## Database Schema

### `users`

```sql
id           VARCHAR(36) PK      -- UUID v4
username     VARCHAR(50) UNIQUE  -- 3-50 chars, alphanumeric + _ -
email        VARCHAR(255) UNIQUE -- Normalized lowercase
password_hash VARCHAR(255)       -- bcrypt cost 12
display_name VARCHAR(100)
bio          TEXT
avatar_url   VARCHAR(512)
role         ENUM('user','admin') DEFAULT 'user'
is_active    BOOLEAN DEFAULT TRUE
created_at   DATETIME
updated_at   DATETIME ON UPDATE CURRENT_TIMESTAMP
```

### `blogs`

```sql
id           VARCHAR(36) PK
user_id      VARCHAR(36) FK → users.id CASCADE DELETE
title        VARCHAR(255)
slug         VARCHAR(300) UNIQUE  -- Auto-generated from title + timestamp
excerpt      TEXT
content      LONGTEXT             -- XSS-sanitized HTML
cover_image  VARCHAR(512)
tags         JSON                 -- Array of strings, max 10
status       ENUM('draft','published') DEFAULT 'draft'
read_time    INT                  -- Auto-calculated (words ÷ 200)
views        INT DEFAULT 0        -- Auto-incremented on each read
created_at   DATETIME
updated_at   DATETIME
published_at DATETIME             -- Set on first publish
```

### `refresh_tokens`

```sql
id           VARCHAR(36) PK
user_id      VARCHAR(36) FK → users.id CASCADE DELETE
token_hash   VARCHAR(255) UNIQUE  -- SHA-256 hash of the actual token
expires_at   DATETIME
created_at   DATETIME
```

---

## API Reference

### Auth

| Method | Endpoint | Auth | CSRF | Description |
|---|---|---|---|---|
| GET | `/api/auth/csrf-token` | No | No | Get CSRF token |
| POST | `/api/auth/register` | No | ✅ | Register user |
| POST | `/api/auth/login` | No | ✅ | Login |
| POST | `/api/auth/logout` | No | ✅ | Logout (clears tokens) |
| POST | `/api/auth/refresh` | No | No | Refresh access token |
| GET | `/api/auth/me` | JWT | No | Get current user |

### Public Blogs

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/blogs` | List published blogs |
| GET | `/api/blogs/:slug` | Get single blog (increments views) |

Query params for `GET /api/blogs`: `page`, `limit` (max 20), `search`, `tag`

### Authenticated Blogs

| Method | Endpoint | Auth | CSRF | Description |
|---|---|---|---|---|
| GET | `/api/my/blogs` | JWT | No | List your blogs |
| GET | `/api/my/blogs/:id` | JWT | No | Get blog by ID (for editing) |
| POST | `/api/my/blogs` | JWT | ✅ | Create blog |
| PUT | `/api/my/blogs/:id` | JWT | ✅ | Update blog |
| DELETE | `/api/my/blogs/:id` | JWT | ✅ | Delete blog |

---

## Security Architecture

| Threat | Mitigation |
|---|---|
| **CSRF** | Double-submit cookie pattern — token in both cookie and `X-CSRF-Token` header, compared server-side on every mutation |
| **XSS** | All user input sanitized with `xss` library before storage; allowlist HTML tags for blog content; Helmet CSP headers |
| **DDoS / Brute Force** | 4-layer rate limiting: general (100/15m), auth (10/15m per IP+email), write ops (60/hr), speed limiter (progressive delay after 50 req) |
| **SQL Injection** | All queries use parameterized prepared statements via mysql2 |
| **Password theft** | bcrypt cost factor 12; passwords never stored or logged in plaintext |
| **Token theft** | JWT access tokens expire in 15m; refresh tokens stored hashed (SHA-256) in DB; logout invalidates refresh token |
| **Clickjacking** | `X-Frame-Options: DENY` via Helmet |
| **MIME sniffing** | `X-Content-Type-Options: nosniff` via Helmet |
| **Insecure cookies** | `httpOnly`, `secure` (prod), `sameSite: strict` (prod) |
| **Information leakage** | Production error messages are generic; detailed errors only in development |

---

## Production Deployment

### Option 1: Docker Compose (Recommended)

**Step 1 — Prepare your server**

```bash
# Ubuntu 22.04 — install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
# Log out and back in, then:
docker --version  # should show Docker 24+
```

**Step 2 — Clone and configure**

```bash
git clone https://github.com/yourusername/blogforge.git /var/www/blogforge
cd /var/www/blogforge

cp backend/.env.example backend/.env
nano backend/.env
```

Production `.env` values:

```env
NODE_ENV=production
PORT=5000

DB_HOST=db
DB_PORT=3306
DB_USER=blogforge
DB_PASSWORD=<strong random password — min 20 chars>
DB_NAME=blogforge

# Generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=<64-char hex>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<64-char hex, different from JWT_SECRET>
JWT_REFRESH_EXPIRES_IN=30d
CSRF_SECRET=<32-char hex>
COOKIE_SECRET=<32-char hex>

ALLOWED_ORIGINS=https://yourdomain.com
COOKIE_SECURE=true
COOKIE_SAME_SITE=strict
LOG_LEVEL=warn
```

Also set `DB_ROOT_PASSWORD` and `DB_PASSWORD` as environment variables or in a `.env` at root level:

```bash
export DB_ROOT_PASSWORD="very_strong_root_pass"
export DB_PASSWORD="strong_app_pass"
```

**Step 3 — Add SSL certificates**

```bash
# Install certbot
sudo apt install certbot -y

# Get certificate (stop any service using port 80 first)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certs to project
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem  docker/ssl/
sudo chown $USER:$USER docker/ssl/*.pem
```

**Step 4 — Update Nginx domain**

```bash
nano docker/nginx/prod.conf
# Change "yourdomain.com" to your actual domain
```

**Step 5 — Start production stack**

```bash
docker-compose -f docker-compose.prod.yml up -d

# Run migration
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Check all containers are healthy
docker-compose -f docker-compose.prod.yml ps
```

**Step 6 — Auto-renew SSL**

```bash
# Add to crontab: sudo crontab -e
0 3 * * * certbot renew --quiet && \
  cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /var/www/blogforge/docker/ssl/ && \
  cp /etc/letsencrypt/live/yourdomain.com/privkey.pem  /var/www/blogforge/docker/ssl/ && \
  docker-compose -f /var/www/blogforge/docker-compose.prod.yml restart proxy
```

---

### Option 2: VPS with Nginx + PM2

**Step 1 — Install Node.js, MySQL, Nginx, PM2**

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# MySQL 8.0
sudo apt install -y mysql-server
sudo mysql_secure_installation

# Nginx
sudo apt install -y nginx

# PM2
sudo npm install -g pm2
```

**Step 2 — Configure MySQL**

```bash
sudo mysql
```

```sql
CREATE DATABASE blogforge CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'blogforge'@'localhost' IDENTIFIED WITH mysql_native_password BY 'StrongProdPass123!';
GRANT ALL PRIVILEGES ON blogforge.* TO 'blogforge'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Step 3 — Deploy application**

```bash
git clone https://github.com/yourusername/blogforge.git /var/www/blogforge
cd /var/www/blogforge

npm run install:all

# Configure backend .env (production values)
cp backend/.env.example backend/.env
nano backend/.env   # Fill in all values

# Run migration
npm run migrate

# Build frontend
npm run build:frontend
```

**Step 4 — Start backend with PM2**

```bash
cd /var/www/blogforge/backend
pm2 start src/server.js \
  --name blogforge-api \
  --max-memory-restart 300M \
  --restart-delay 3000 \
  --log /var/www/blogforge/backend/logs/pm2.log

pm2 save
pm2 startup   # Follow the printed command to enable auto-start
```

**Step 5 — Configure Nginx**

```bash
sudo cp /var/www/blogforge/nginx.conf.example /etc/nginx/sites-available/blogforge
sudo nano /etc/nginx/sites-available/blogforge   # Replace yourdomain.com
sudo ln -s /etc/nginx/sites-available/blogforge /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

**Step 6 — SSL with Let's Encrypt**

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Configuration Reference

### Settings by Environment

| Setting | Development | Production |
|---|---|---|
| `NODE_ENV` | `development` | `production` |
| `COOKIE_SECURE` | `false` | `true` |
| `COOKIE_SAME_SITE` | `lax` | `strict` |
| `LOG_LEVEL` | `debug` | `warn` |
| `RATE_LIMIT_MAX` | `100` | `50` |
| `AUTH_RATE_LIMIT_MAX` | `10` | `5` |
| Helmet HSTS | Disabled | Enabled |
| CORS | `localhost:5173` | Your domain only |
| JWT expiry | `15m` | `15m` (keep short) |

### Token Lifetime Tuning

Shorter access tokens = more secure but more refresh calls:

```env
# More secure (default)
JWT_EXPIRES_IN=15m

# Less friction for users (less secure)
JWT_EXPIRES_IN=1h

# Keep this long — it's revocable per-logout
JWT_REFRESH_EXPIRES_IN=30d
```

---

## Troubleshooting

### ❌ `secretOrPrivateKey must have a value`
**Cause:** `backend/.env` file is missing or not being loaded.
**Fix:**
1. Confirm the file exists at exactly `blogforge/backend/.env` (not `.env.example`)
2. Confirm it contains `JWT_SECRET=...` with a non-empty value
3. Restart the server after creating/editing `.env`

---

### ❌ `unknown plugin auth_gssapi_client` (MariaDB/XAMPP)
**Fix — run in phpMyAdmin or MySQL shell:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED VIA mysql_native_password USING PASSWORD('');
FLUSH PRIVILEGES;
```

---

### ❌ `caching_sha2_password` plugin error (MySQL 8.0)
**Fix:**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;
```
Or during MySQL 8.0 install: choose **"Use Legacy Authentication Method"**.

---

### ❌ `Access denied for user 'root'@'localhost'`
**Fix:**
1. Check `DB_PASSWORD` in `backend/.env` matches your actual MySQL password
2. XAMPP default: root has no password, so `DB_PASSWORD=` (empty)
3. Test: `mysql -u root -p` in terminal — if it asks for password, set one in `.env`

---

### ❌ `ECONNREFUSED 127.0.0.1:3306`
**Cause:** MySQL/MariaDB isn't running.
**Fix:**
- **XAMPP:** Open XAMPP Control Panel → click **Start** on MySQL
- **MySQL service:** `sudo systemctl start mysql`
- **Docker:** `docker-compose up db`

---

### ❌ CSRF token errors (403 Forbidden)
**Cause:** Frontend isn't sending the CSRF token, or cookies aren't reaching the server.
**Fix:**
1. Ensure `COOKIE_SAME_SITE=lax` in development (not `strict`)
2. Ensure `COOKIE_SECURE=false` in development (HTTP)
3. Check `ALLOWED_ORIGINS` includes `http://localhost:5173`
4. Clear browser cookies and try again

---

### ❌ Docker: MySQL container keeps restarting
**Fix:**
```bash
# View MySQL logs
docker-compose logs db

# Wipe data volume and start fresh (loses all data!)
docker-compose down -v
docker-compose up
```

---

### ❌ `npm run migrate` fails — database doesn't exist
The migrate script creates the database automatically. If it fails:
1. Confirm MySQL is running
2. Confirm `DB_USER` has `CREATE DATABASE` privileges (root always does)
3. Try: `mysql -u root -p -e "SHOW DATABASES;"` to verify connection works

---

### ❌ Frontend shows blank page after `npm run dev`
1. Confirm backend is running on port 5000
2. Check browser console for errors
3. Confirm `backend/.env` has all required secrets (especially `JWT_SECRET`)
4. Hard-refresh browser: `Ctrl+Shift+R`

---

## License

MIT — free to use, modify, and distribute.

---

*Built with ✦ BlogForge*
