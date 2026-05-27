# 🔧 MongoDB Connection Troubleshooting Guide

## Problem: "Mongoose server selection error"

This error occurs when your Node.js application cannot connect to MongoDB.

---

## ✅ QUICK FIX CHECKLIST

### Step 1: Verify MongoDB is Running

#### Windows (PowerShell as Admin)
```powershell
# Check if MongoDB service is running
Get-Service MongoDB

# If not running, start it
Start-Service MongoDB

# Verify it started
Get-Service MongoDB | Select-Object Status

# Should show: Status: Running
```

#### Linux (Ubuntu/Debian)
```bash
# Check status
sudo systemctl status mongod

# If not running, start it
sudo systemctl start mongod

# Enable auto-start
sudo systemctl enable mongod
```

#### macOS
```bash
# Check status
brew services list | grep mongodb

# If not running, start it
brew services start mongodb-community

# Verify
brew services list
```

---

### Step 2: Verify Connection String

**File**: `server/.env`

```bash
# Should be one of these:

# Local MongoDB
MONGO_URI=mongodb://localhost:27017/fileserver

# MongoDB Atlas (Cloud)
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fileserver

# Remote MongoDB
MONGO_URI=mongodb://username:password@remote-host:27017/fileserver
```

**Make sure**:
- ✅ Hostname is correct
- ✅ Port is correct (usually 27017)
- ✅ Database name is specified (fileserver)
- ✅ Username/password are correct (if using auth)

---

### Step 3: Test MongoDB Connection Directly

#### Windows (PowerShell)
```powershell
# If MongoDB Tools are installed
mongosh
# OR
mongo

# Should connect without errors
```

#### Linux/macOS
```bash
mongosh
# OR
mongo

# Should connect without errors
```

**Expected output**:
```
Current Mongosh Log ID: ...
Connecting to:          mongodb://127.0.0.1:27017/?directConnection=true
MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017
```

If you see `ECONNREFUSED` → MongoDB is not running (see Step 1)

---

### Step 4: Check Node.js Connection

Run this test script:

```bash
cd server
node -e "
const mongoose = require('mongoose');
const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fileserver';
console.log('Testing connection to:', mongoURI);
mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('✅ Connection successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  });
"
```

---

## 🔴 Common Errors & Solutions

### 1. "ECONNREFUSED 127.0.0.1:27017"

**Cause**: MongoDB is not running

**Solution**:
```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community
```

---

### 2. "MongoServerSelectionError: connection timeout"

**Cause**: MongoDB is running but unreachable

**Solutions**:
```bash
# 1. Verify MongoDB is listening
# Windows: Check Services app
# Linux: netstat -tlnp | grep 27017
# macOS: lsof -i :27017

# 2. Check if port 27017 is open
# Windows (PowerShell)
Test-NetConnection -ComputerName localhost -Port 27017

# Linux
nc -zv localhost 27017

# macOS
nc -zv localhost 27017
```

---

### 3. "MongoAuthenticationError"

**Cause**: Wrong username/password in connection string

**Solution**:
```bash
# 1. Check your MongoDB auth credentials
# 2. If using MongoDB Atlas, verify:
#    - Username is correct
#    - Password is correct (not URL-encoded)
#    - IP whitelist includes your IP
#    - Cluster is in correct region

# 3. For local MongoDB with auth:
mongosh
> use admin
> db.auth("username", "password")
```

---

### 4. "Invalid connection string"

**Cause**: Malformed MONGO_URI

**Solution**: Use correct format:
```bash
# ✅ Correct formats:
MONGO_URI=mongodb://localhost:27017/fileserver
MONGO_URI=mongodb://user:pass@localhost:27017/fileserver
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/fileserver

# ❌ Incorrect formats:
MONGO_URI=mongodb:localhost:27017/fileserver       # Missing //
MONGO_URI=mongodb://localhost/fileserver           # Missing port
MONGO_URI=mongodb://localhost:27017                # Missing database
```

---

### 5. "getaddrinfo ENOTFOUND mongodb+srv://..."

**Cause**: DNS cannot resolve MongoDB Atlas hostname

**Solution**:
```bash
# 1. Check internet connection
# 2. Verify cluster name is correct
# 3. Check MongoDB Atlas IP whitelist

# In MongoDB Atlas Dashboard:
# - Go to Security → Network Access
# - Add your IP address (or 0.0.0.0/0 for development only)
# - Click "Add IP Address"
```

---

## 📋 COMPLETE SOLUTION STEPS

### For Local MongoDB (Development)

**1. Install MongoDB**
```bash
# Windows
choco install mongodb -y

# Linux
sudo apt install -y mongodb

# macOS
brew install mongodb-community
```

**2. Start MongoDB**
```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod

# macOS
brew services start mongodb-community
```

**3. Verify it's running**
```bash
# All platforms
mongosh
# Should connect successfully
```

**4. Check .env file**
```bash
# server/.env
MONGO_URI=mongodb://localhost:27017/fileserver
```

**5. Start FileServer**
```bash
cd server
npm install
npm start
```

**Expected output**:
```
✅ MongoDB Connected Successfully
Server is running on port 5000
```

---

### For MongoDB Atlas (Cloud)

**1. Create MongoDB Atlas Account**
- Go to https://www.mongodb.com/cloud/atlas
- Sign up (free tier available)
- Create a cluster

**2. Get Connection String**
- In MongoDB Atlas Dashboard
- Click "CONNECT"
- Choose "Connect your application"
- Copy the connection string
- Replace `<password>` and `<dbname>` with your values

**3. Update .env**
```bash
# server/.env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/fileserver
```

**4. Whitelist Your IP**
- In MongoDB Atlas: Security → Network Access
- Click "Add IP Address"
- Enter your IP or use 0.0.0.0/0 for development
- Click "Confirm"

**5. Start FileServer**
```bash
cd server
npm install
npm start
```

**Expected output**:
```
✅ MongoDB Connected Successfully
Server is running on port 5000
```

---

## 🐳 Docker Setup

### Option 1: Run MongoDB in Docker

```bash
# Pull MongoDB image
docker pull mongo:6.0

# Run MongoDB container
docker run -d \
  --name fileserver-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=fileserver \
  mongo:6.0

# Verify
docker logs fileserver-mongodb
```

### Option 2: Use docker-compose.yml

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:6.0
    container_name: fileserver-mongodb
    ports:
      - "27017:27017"
    environment:
      MONGO_INITDB_DATABASE: fileserver
    volumes:
      - mongodb_data:/data/db

  api:
    build: ./server
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      MONGO_URI: mongodb://mongodb:27017/fileserver

volumes:
  mongodb_data:
```

**Run**:
```bash
docker-compose up -d
```

---

## 🧪 Test Connection

### Test Script

Create `test-connection.js`:

```javascript
const mongoose = require('mongoose');
require('dotenv').config();

const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/fileserver';

console.log('🔄 Testing MongoDB connection...');
console.log('URI:', mongoURI);

mongoose.connect(mongoURI, {
  serverSelectionTimeoutMS: 5000,
  family: 4
})
.then(() => {
  console.log('✅ Connection successful!');
  
  // Test create collection
  mongoose.connection.db.listCollections().toArray((err, collections) => {
    if (err) {
      console.log('⚠️  Could not list collections:', err.message);
    } else {
      console.log('📋 Collections found:', collections.map(c => c.name).join(', ') || 'None yet');
    }
    process.exit(0);
  });
})
.catch(err => {
  console.error('❌ Connection failed!');
  console.error('Error:', err.message);
  process.exit(1);
});
```

**Run**:
```bash
cd server
node test-connection.js
```

---

## 🚨 Emergency Reset

If everything fails:

```bash
# 1. Remove all local MongoDB data
# Windows: Delete C:\Program Data\MongoDB\Server\6.0\data
# Linux: sudo rm -rf /var/lib/mongodb/*
# macOS: rm -rf ~/Library/Application\ Support/MongoDB/

# 2. Restart MongoDB service
# Windows: net start MongoDB
# Linux: sudo systemctl restart mongod
# macOS: brew services restart mongodb-community

# 3. Restart FileServer
cd server
npm start
```

---

## ✅ Verification Checklist

- [ ] MongoDB is running (check with mongosh)
- [ ] MONGO_URI in .env is correct
- [ ] Database name matches (fileserver)
- [ ] Port 27017 is accessible
- [ ] .env file is in server directory
- [ ] npm install completed
- [ ] No duplicate MONGO_URI declarations
- [ ] Connection string has no typos

---

## 📞 Still Not Working?

Check these files:

1. **server/.env** - Verify MONGO_URI
2. **server/config/db.js** - Check connection config
3. **server/app.js** - Check connectDB() call
4. **Console output** - Look for specific error messages

---

**The improved db.js now includes**:
- ✅ Better error messages
- ✅ Automatic retry logic
- ✅ Connection event handlers
- ✅ Troubleshooting instructions
- ✅ Support for timeouts and retries

Your MongoDB connection should now work! 🚀
