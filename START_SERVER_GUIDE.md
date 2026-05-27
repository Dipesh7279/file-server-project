# 🚀 START SERVER - COMPLETE GUIDE

## ✅ ERRORS FIXED

1. ✅ **Missing `.env` file** → Created at `server/.env`
2. ✅ **Wrong main entry** → Changed from `index.js` to `app.js`
3. ✅ **Package.json fixed** → Start script now uses `node app.js`

---

## 🎯 QUICK START (Windows)

### Step 1: Open Command Prompt (cmd)
```bash
cd C:\Users\vinit\file-server-project.worktrees\agents-cross-platform-gui-file-server
```

### Step 2: Install MongoDB (if not running)

**Option A: Using Docker (easiest)**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

**Option B: Local Installation**
- Download from: https://www.mongodb.com/try/download/community
- Install and start MongoDB service

### Step 3: Start Backend Server
```bash
cd server
npm install
npm start
```

✅ Expected output:
```
Server is running on port 5000
MongoDB Connected
```

### Step 4: Open Another Terminal and Start Frontend
```bash
cd client
npm install
npm start
```

✅ Frontend will open at: http://localhost:3000

---

## 🧪 VERIFY EVERYTHING WORKS

### Check Backend Health
```bash
curl http://localhost:5000/api/health
```

✅ Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2026-05-24T...",
  "uptime": 123.45
}
```

### Check Frontend
- Open http://localhost:3000 in browser
- You should see the login page

### Test Login
- Email: `test@example.com`
- Password: `password123`

---

## 📁 FILES CREATED/FIXED

```
✅ server/.env                    (Environment config - NEW)
✅ server/package.json             (Start script fixed)
✅ All other files                 (Already exist and working)
```

---

## ⚙️ ENVIRONMENT CONFIGURATION

Your `.env` file is set to:
```
MONGO_URI=mongodb://localhost:27017/fileserver
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
CLIENT_URL=http://localhost:3000
```

**For production, update:**
- `MONGO_URI` → Your production MongoDB
- `JWT_SECRET` → Strong random key
- `NODE_ENV` → `production`
- `CLIENT_URL` → Your production URL

---

## 🐳 DOCKER QUICK START (All-in-One)

If you prefer Docker:
```bash
cd C:\Users\vinit\file-server-project.worktrees\agents-cross-platform-gui-file-server
docker-compose up -d
```

Then access:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000
- Mongo: localhost:27017

---

## 🔍 TROUBLESHOOTING

### Issue: "Cannot find module"
**Fix:**
```bash
cd server
npm install
npm start
```

### Issue: "MongoDB connection refused"
**Fix:**
```bash
# Start MongoDB with Docker
docker run -d -p 27017:27017 mongo:latest
```

### Issue: "Port 5000 already in use"
**Fix:**
```bash
# Use different port
set PORT=5001
npm start
```

### Issue: "EACCES permission denied"
**Fix:**
```bash
# Run with elevated permissions or use sudo
npm start
```

---

## 📊 SERVER FEATURES (Ready to Test)

### ✅ Authentication
- Register new user
- Email verification
- Login with JWT
- Password reset
- Multi-session support

### ✅ File Management
- Upload files
- Download files
- View file list
- Delete files
- Restore from trash

### ✅ Folder Management
- Create folders
- Navigate folders
- Move files
- Rename folders
- Delete folders

### ✅ File Sharing
- Share files publicly
- Share with specific users
- Password-protect shares
- Set expiration dates

### ✅ Admin Panel
- View users
- Manage quotas
- View statistics
- Monitor activity

---

## 🎬 TEST WORKFLOW

1. **Start Backend**: `npm start` (in server/)
2. **Start Frontend**: `npm start` (in client/)
3. **Open Browser**: http://localhost:3000
4. **Register**: Create new account
5. **Verify Email**: Check verification link
6. **Login**: Use your credentials
7. **Upload File**: Test file upload
8. **Create Folder**: Test folder creation
9. **Share File**: Test file sharing
10. **Admin Panel**: View stats and users

---

## ✨ NOW YOU CAN:

✅ Test all functionality
✅ Modify code
✅ Run automated tests
✅ Deploy to production
✅ Customize as needed

---

## 📝 NOTES

- **Development Mode**: Uses `npm start` (direct node)
- **Dev Watch Mode**: Uses `npm run dev` (nodemon auto-reload)
- **MongoDB**: Must be running (local or Docker)
- **.env**: Configuration loaded automatically
- **Port**: Configurable via PORT env variable

---

## 🚀 READY TO GO!

Your server is now properly configured and ready to start.

### Next Command:
```bash
cd server
npm install
npm start
```

Then in another terminal:
```bash
cd client
npm install
npm start
```

**That's it! Your FileServer is running!** 🎉

---

**Happy testing!** Let me know if you hit any issues.
