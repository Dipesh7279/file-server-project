# 🚀 QUICK FIX - Just 3 Commands

## Problem
Admin storage quota is 100MB instead of 1GB

## Solution - Run These Commands:

### 1️⃣ Update Database
```bash
cd C:\Users\vinit\file-server-project.worktrees\agents-cross-platform-gui-file-server
node fix-admin-quota.js
```

**Expected output:**
```
✅ Updated 1 admin users to 1GB quota
✅ ALL QUOTAS FIXED SUCCESSFULLY!
```

### 2️⃣ Start Server (in NEW PowerShell)
```bash
cd server
npm start
```

**Wait for:**
```
Server running on port 5000
```

### 3️⃣ Start Client (in ANOTHER NEW PowerShell)
```bash
cd client
npm start
```

**Wait for Electron window**

## Test
1. Click "Admin Login"
2. Username: `testadmin`
3. Password: `TestAdmin@123`
4. Click "Login as Admin"

**You should see:**
- ✅ Admin Dashboard
- ✅ 5 Tabs (Statistics, Users, Storage, System Health, Logs)
- ✅ Storage shows 1GB quota
- ✅ System Health shows metrics

## Done! ✅

Admin now has:
- ✅ 1GB storage quota
- ✅ Storage Management tab
- ✅ System Health tab
- ✅ Full admin features
