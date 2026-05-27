# 🚀 COMPLETE CROSS-PLATFORM DEPLOYMENT GUIDE
## FileServer - Windows | Linux | macOS

**Last Updated**: 2026-05-27  
**Deployment Status**: Production Ready ✅  
**Estimated Time**: 30-45 minutes (all platforms)

---

## 📋 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Option A: Docker Deployment (Recommended)](#option-a-docker-deployment-recommended)
3. [Option B: Native Deployment](#option-b-native-deployment)
4. [Configuration](#configuration)
5. [Testing & Verification](#testing--verification)
6. [Troubleshooting](#troubleshooting)
7. [Production Checklist](#production-checklist)

---

## PREREQUISITES

### All Platforms (Windows, Linux, macOS)

#### Required Software

| Software | Purpose | Check Command |
|----------|---------|----------------|
| **Git** | Version control | `git --version` |
| **Node.js 18+** | Backend runtime | `node --version` |
| **npm 9+** | Package manager | `npm --version` |
| **MongoDB 5+** | Database | `mongod --version` |

#### Optional (For Docker)

| Software | Purpose | Check Command |
|----------|---------|----------------|
| **Docker** | Containerization | `docker --version` |
| **Docker Compose** | Multi-container | `docker-compose --version` |

---

## INSTALLATION BY PLATFORM

### 🪟 WINDOWS

#### Step 1: Install Node.js
```powershell
# Option A: Using Chocolatey
choco install nodejs -y

# Option B: Manual download
# Visit https://nodejs.org/ and download LTS installer
```

#### Step 2: Verify Installation
```powershell
node --version      # Should show v18.x.x or higher
npm --version       # Should show 9.x.x or higher
```

#### Step 3: Install MongoDB (Windows)
```powershell
# Option A: Chocolatey (Recommended)
choco install mongodb -y

# Option B: Download from https://www.mongodb.com/try/download/community
# Run installer and follow prompts

# Verify
mongod --version
```

#### Step 4: Start MongoDB Service (Windows)
```powershell
# Check if running
net start MongoDB

# Or use Services:
# Win+R → services.msc → Find "MongoDB" → Start it
```

---

### 🐧 LINUX (Ubuntu/Debian)

#### Step 1: Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Step 2: Install Node.js
```bash
# Using NodeSource repository (recommended for latest)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version
npm --version
```

#### Step 3: Install MongoDB
```bash
# Add MongoDB repository
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Install
sudo apt update
sudo apt install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
mongod --version
systemctl status mongod
```

---

### 🍎 macOS

#### Step 1: Install Homebrew (if not installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Step 2: Install Node.js
```bash
brew install node

# Verify
node --version
npm --version
```

#### Step 3: Install MongoDB
```bash
# Add Homebrew Tap
brew tap mongodb/brew

# Install
brew install mongodb-community

# Start service
brew services start mongodb-community

# Verify
mongod --version
brew services list | grep mongodb
```

---

## OPTION A: DOCKER DEPLOYMENT (RECOMMENDED)

### ✅ Why Docker?
- ✅ Same on all platforms
- ✅ No version conflicts
- ✅ Easy to scale
- ✅ Production-ready
- ✅ Fast deployment

### Prerequisites for Docker
```bash
# Windows/macOS: Install Docker Desktop from https://www.docker.com/products/docker-desktop
# Linux: 
sudo apt install docker.io docker-compose

# Verify
docker --version
docker-compose --version
```

---

### 🚀 Docker Deployment Steps (All Platforms)

#### Step 1: Clone Repository
```bash
# Windows (PowerShell)
cd C:\Users\YourUsername\projects
git clone https://github.com/Dipesh7279/file-server-project.git
cd file-server-project.worktrees\agents-cross-platform-gui-file-server

# Linux/macOS (Terminal)
cd ~/projects
git clone https://github.com/Dipesh7279/file-server-project.git
cd file-server-project.worktrees/agents-cross-platform-gui-file-server
```

#### Step 2: Create .env File
```bash
# Copy from example
cp server/.env.example server/.env

# Edit with your values (see Configuration section below)
# Windows: notepad server\.env
# Linux/macOS: nano server/.env
```

#### Step 3: Build and Start with Docker Compose
```bash
# Windows (PowerShell)
docker-compose up -d --build

# Linux/macOS (Terminal)
docker-compose up -d --build
```

**What it does:**
- ✅ Pulls MongoDB image
- ✅ Builds FileServer API image
- ✅ Starts both containers
- ✅ Creates persistent volumes

#### Step 4: Verify Deployment
```bash
# Check containers running
docker ps

# Check logs
docker logs fileserver-api

# Check MongoDB
docker logs fileserver-mongodb
```

Expected output:
```
fileserver-api      Up 2 minutes
fileserver-mongodb  Up 2 minutes
```

#### Step 5: Test API
```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri http://localhost:5000/api

# Linux/macOS (Terminal)
curl http://localhost:5000/api
```

Expected: API responds (200 OK)

#### Step 6: Start Electron Client
```bash
# Windows (PowerShell)
cd client
npm install
npm start

# Linux/macOS (Terminal)
cd client
npm install
npm start
```

**Result**: Electron GUI launches ✅

---

## OPTION B: NATIVE DEPLOYMENT

### 📝 Step-by-Step (All Platforms)

#### Step 1: Clone Repository

**Windows (PowerShell)**
```powershell
cd C:\Users\YourUsername\projects
git clone https://github.com/Dipesh7279/file-server-project.git
cd file-server-project.worktrees\agents-cross-platform-gui-file-server
```

**Linux/macOS (Terminal)**
```bash
cd ~/projects
git clone https://github.com/Dipesh7279/file-server-project.git
cd file-server-project.worktrees/agents-cross-platform-gui-file-server
```

#### Step 2: Verify MongoDB Running

**Windows**
```powershell
# Check service
Get-Service MongoDB

# Or test connection
mongosh  # If installed with MongoDB 5.0+
# Or
mongo    # For older versions
```

**Linux**
```bash
sudo systemctl status mongod
# Should show: active (running)
```

**macOS**
```bash
brew services list | grep mongodb
# Should show: started
```

#### Step 3: Setup Backend

**All Platforms**
```bash
cd server
npm install
cp .env.example .env
# Edit .env with your configuration
```

**Edit .env file:**
```
MONGODB_URI=mongodb://localhost:27017/fileserver
PORT=5000
NODE_ENV=development
JWT_ACCESS_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

#### Step 4: Start Backend Server

**All Platforms**
```bash
# Development mode (with auto-reload)
npm run dev

# OR Production mode
npm start
```

Expected output:
```
Server is running on port 5000
Database connected successfully
```

**Keep this terminal open!**

#### Step 5: Setup Frontend (New Terminal/Tab)

**All Platforms**
```bash
cd client
npm install
```

#### Step 6: Start Frontend GUI

**All Platforms**
```bash
npm start
```

Expected: Electron window opens ✅

---

## CONFIGURATION

### Environment Setup (.env)

**Location**: `server/.env`

```bash
# ==========================================
# DATABASE
# ==========================================
MONGODB_URI=mongodb://localhost:27017/fileserver
MONGODB_NAME=fileserver

# ==========================================
# SERVER
# ==========================================
PORT=5000
NODE_ENV=development
API_BASE_URL=http://localhost:5000/api

# ==========================================
# SECURITY - JWT
# ==========================================
JWT_ACCESS_SECRET=your-very-secret-access-key-min-32-chars-here
JWT_REFRESH_SECRET=your-very-secret-refresh-key-min-32-chars-here
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# ==========================================
# EMAIL SERVICE (Gmail Example)
# ==========================================
# 1. Enable 2-Factor Authentication on Gmail
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Use app password below

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
SMTP_FROM=noreply@fileserver.com

# OR for other email providers:
# SMTP_HOST=smtp.outlook.com (for Outlook)
# SMTP_PORT=587
# SMTP_USER=your-email@outlook.com
# SMTP_PASSWORD=your-password

# ==========================================
# FILE UPLOAD
# ==========================================
MAX_FILE_SIZE=5368709120
MAX_FILES_PER_UPLOAD=10
UPLOAD_DIR=server/uploads

# ==========================================
# STORAGE QUOTA
# ==========================================
DEFAULT_QUOTA=5368709120
PREMIUM_QUOTA=107374182400

# ==========================================
# CLIENT
# ==========================================
CLIENT_URL=http://localhost:3000
ELECTRON_ENABLE_LOGGING=true
```

### MongoDB Connection String Examples

```bash
# Local MongoDB
MONGODB_URI=mongodb://localhost:27017/fileserver

# MongoDB Atlas (Cloud)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fileserver

# Remote MongoDB with auth
MONGODB_URI=mongodb://username:password@remote-host:27017/fileserver

# Docker container
MONGODB_URI=mongodb://mongodb:27017/fileserver
```

---

## TESTING & VERIFICATION

### 🧪 Test Checklist

#### Backend Tests

**1. Check Server Started**
```bash
# Windows (PowerShell)
Invoke-WebRequest -Uri http://localhost:5000/api

# Linux/macOS (Terminal)
curl http://localhost:5000/api
```

Expected: `200 OK` response

**2. Test Registration**
```bash
# Windows (PowerShell)
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "Test@123456"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/register `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Linux/macOS (Terminal)
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test@123456"
  }'
```

Expected: `201 Created` with access token

**3. Test Login**
```bash
# Windows (PowerShell)
$body = @{
    username = "testuser"
    password = "Test@123456"
} | ConvertTo-Json

Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
    -Method POST `
    -Body $body `
    -ContentType "application/json"

# Linux/macOS (Terminal)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123456"
  }'
```

Expected: `200 OK` with tokens

**4. Test Database**
```bash
# Windows (PowerShell)
mongosh

# Linux/macOS (Terminal)
mongo
```

Then in MongoDB shell:
```javascript
use fileserver
db.users.find()
```

Expected: See registered user document

#### Frontend Tests

**1. Check Client Starts**
- Electron window should open
- Login page should display
- No console errors

**2. Test Login**
- Enter testuser credentials
- Click login
- Should see dashboard

**3. Test File Upload**
- Go to dashboard
- Click "Upload File"
- Select a test file
- Verify it appears in file list

**4. Check File Storage**
```bash
# Windows (PowerShell)
dir server\uploads

# Linux/macOS (Terminal)
ls -la server/uploads
```

Expected: Your uploaded file is there ✅

---

## TROUBLESHOOTING

### 🔴 Common Issues

#### 1. "MongoDB Connection Failed"

**Problem**: `MongooseError: connection failed`

**Solution**:
```bash
# Check MongoDB running
# Windows: net start MongoDB
# Linux: sudo systemctl start mongod
# macOS: brew services start mongodb-community

# Verify connection
mongosh mongodb://localhost:27017
```

#### 2. "Port 5000 Already in Use"

**Problem**: `Error: listen EADDRINUSE :::5000`

**Solution**:
```bash
# Windows (PowerShell)
# Find process using port 5000
Get-Process | Where-Object {$_.Port -eq 5000}
# OR kill the process
Stop-Process -Id <PID> -Force

# Linux/macOS (Terminal)
# Find process
lsof -i :5000
# Kill it
kill -9 <PID>
```

#### 3. "Email Not Sending"

**Problem**: Verification email not arriving

**Solution**:
```bash
# 1. Check SMTP credentials in .env
# 2. For Gmail: Enable 2FA and use App Password
# 3. Check email provider's SMTP settings
# 4. Verify port (usually 587 for TLS, 465 for SSL)
# 5. Check logs for SMTP errors

# To test email:
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: { user: 'your@gmail.com', pass: 'your-app-password' }
});
transporter.verify((err, success) => {
  console.log(success ? 'SMTP OK' : err);
});
"
```

#### 4. "File Upload Fails"

**Problem**: Upload returns error or file not saved

**Solution**:
```bash
# Check permissions
# Windows: Right-click server\uploads → Properties → Security → Edit → Full Control

# Linux: 
sudo chmod -R 755 server/uploads
sudo chown -R $USER:$USER server/uploads

# macOS:
chmod -R 755 server/uploads
chown -R $USER:staff server/uploads

# Check disk space
# Windows: dir C:
# Linux: df -h
# macOS: df -h
```

#### 5. "Electron GUI Won't Start"

**Problem**: `Error: Failed to launch Electron`

**Solution**:
```bash
# Reinstall Electron
cd client
rm -rf node_modules package-lock.json
npm install
npm start

# Check for missing dependencies
npm audit fix

# On Linux, may need additional libraries:
sudo apt install libxss1 libgconf-2-4
```

#### 6. "Docker Container Won't Start"

**Problem**: `docker: Error response from daemon`

**Solution**:
```bash
# Check Docker running
docker ps

# Check container logs
docker logs fileserver-api

# Restart Docker
# Windows/macOS: Restart Docker Desktop
# Linux: sudo systemctl restart docker

# Clean up and rebuild
docker-compose down
docker-compose rm
docker-compose up -d --build
```

---

## PRODUCTION DEPLOYMENT

### 🚀 Production Environment Setup

#### Production .env (server/.env)

```bash
# ==========================================
# PRODUCTION
# ==========================================
NODE_ENV=production
PORT=5000

# ==========================================
# DATABASE - Production MongoDB Atlas
# ==========================================
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/fileserver-prod
MONGODB_NAME=fileserver-prod

# ==========================================
# SECURITY - Use Strong Secrets
# ==========================================
JWT_ACCESS_SECRET=generate-random-64-character-string-here
JWT_REFRESH_SECRET=generate-another-random-64-character-string-here
JWT_ACCESS_EXPIRY=1h
JWT_REFRESH_EXPIRY=7d

# ==========================================
# API
# ==========================================
API_BASE_URL=https://api.yourdomain.com

# ==========================================
# PRODUCTION EMAIL
# ==========================================
SMTP_HOST=your-production-smtp-server.com
SMTP_PORT=587
SMTP_USER=no-reply@yourdomain.com
SMTP_PASSWORD=your-secure-password
SMTP_FROM=FileServer <no-reply@yourdomain.com>

# ==========================================
# STORAGE
# ==========================================
UPLOAD_DIR=/var/fileserver/uploads
MAX_FILE_SIZE=5368709120

# ==========================================
# CLIENT
# ==========================================
CLIENT_URL=https://yourdomain.com
```

### Docker Production Deployment

#### Production docker-compose.yml

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6.0
    container_name: fileserver-mongodb-prod
    restart: always
    environment:
      MONGO_INITDB_DATABASE: fileserver-prod
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: strong-password-here
    volumes:
      - mongodb_data_prod:/data/db
      - mongodb_config_prod:/data/configdb
    networks:
      - fileserver-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  api:
    build: ./server
    container_name: fileserver-api-prod
    restart: always
    depends_on:
      - mongodb
    environment:
      NODE_ENV: production
      MONGODB_URI: mongodb://admin:strong-password-here@mongodb:27017/fileserver-prod?authSource=admin
      PORT: 5000
      JWT_ACCESS_SECRET: ${JWT_ACCESS_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
    ports:
      - "5000:5000"
    volumes:
      - ./server/uploads:/app/uploads
    networks:
      - fileserver-network
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  nginx:
    image: nginx:alpine
    container_name: fileserver-nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    networks:
      - fileserver-network

volumes:
  mongodb_data_prod:
  mongodb_config_prod:

networks:
  fileserver-network:
    driver: bridge
```

### Deploy to Cloud

#### AWS Deployment
```bash
# 1. Create EC2 instance (Ubuntu 20.04)
# 2. SSH into instance
# 3. Install Docker
sudo apt update && sudo apt install docker.io docker-compose -y

# 4. Clone repository
git clone https://github.com/Dipesh7279/file-server-project.git
cd file-server-project.worktrees/agents-cross-platform-gui-file-server

# 5. Configure .env
nano server/.env

# 6. Deploy
docker-compose -f docker-compose.prod.yml up -d

# 7. Setup domain (Route 53)
# Point domain to EC2 instance IP
```

#### Heroku Deployment
```bash
# 1. Install Heroku CLI
# 2. Login
heroku login

# 3. Create app
heroku create fileserver-prod

# 4. Add MongoDB addon
heroku addons:create mongolab:sandbox

# 5. Push code
git push heroku main

# 6. View logs
heroku logs --tail
```

---

## PRODUCTION CHECKLIST

### ✅ Pre-Deployment

- [ ] All tests passing
- [ ] `.env` configured with production values
- [ ] MongoDB production instance ready
- [ ] Email service configured
- [ ] SSL certificates obtained
- [ ] Backup strategy in place
- [ ] Monitoring setup (logs, metrics)
- [ ] Database backups automated

### ✅ Deployment

- [ ] Code deployed to production
- [ ] Database migrations completed
- [ ] Services started and healthy
- [ ] API responding on production URL
- [ ] Client builds for all platforms

### ✅ Post-Deployment

- [ ] Monitor logs for errors
- [ ] Test all critical features
- [ ] Load testing completed
- [ ] SSL certificate verified
- [ ] HTTPS enforced
- [ ] Rate limiting verified
- [ ] Backups tested

### ✅ Ongoing

- [ ] Daily log reviews
- [ ] Weekly backups verified
- [ ] Monthly security updates
- [ ] Performance monitoring
- [ ] User feedback collected

---

## QUICK REFERENCE

### Start Development (All Platforms)

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```

### Docker Quick Start (All Platforms)

```bash
docker-compose up -d --build
cd client && npm start
```

### Stop Services

```bash
# Docker
docker-compose down

# Native
# Kill both npm processes (Ctrl+C in terminals)
```

### View Logs

**Docker:**
```bash
docker logs fileserver-api -f
docker logs fileserver-mongodb -f
```

**Native:**
- Logs appear in the terminal where you ran `npm start` / `npm run dev`

### Database Access

**MongoDB:**
```bash
# Local
mongosh mongodb://localhost:27017/fileserver

# Docker
docker exec -it fileserver-mongodb mongosh
```

**Check data:**
```javascript
use fileserver
db.users.find()
db.files.find()
```

---

## PLATFORM-SPECIFIC NOTES

### 🪟 Windows-Specific

- Use PowerShell (as Administrator) for better compatibility
- File paths use backslashes (`\`) in native deployment
- MongoDB service runs as Windows Service
- Electron builds as NSIS installer

### 🐧 Linux-Specific

- Use bash or zsh terminal
- File permissions important (`chmod`, `chown`)
- MongoDB runs as system service
- Electron builds as AppImage or .deb
- May need additional system libraries

### 🍎 macOS-Specific

- Use Terminal or iTerm2
- Homebrew for easy package management
- Might need Xcode Command Line Tools
- Electron builds as .dmg or .app
- May need to allow Electron in Security preferences

---

## SUPPORT & HELP

### Getting Help

1. **Check logs first**
   ```bash
   # Docker
   docker logs fileserver-api

   # Native
   # Check terminal output
   ```

2. **Common issues**: See Troubleshooting section above

3. **Documentation**: Check `API_DOCUMENTATION.md`

4. **Community**: Issues on GitHub

---

**Deployment Complete! 🎉**

Your FileServer is now ready to use on Windows, Linux, or macOS!

For questions or issues, refer to the comprehensive troubleshooting section above.
