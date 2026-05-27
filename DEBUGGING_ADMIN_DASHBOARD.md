# Debugging Admin Dashboard Issue

## Problem
Login as admin and user shows the same features - AdminDashboard not displaying.

## Root Cause Checklist

### 1. **Verify User is Actually Admin in Database**

```bash
# Open MongoDB console
db.users.findOne({ username: "admin_username" })

# Look for:
{
  username: "admin_username",
  email: "...",
  role: "admin",  # ← MUST BE "admin"
  ...
}
```

❌ **Problem**: If `role: "user"` → User needs to be promoted
✅ **Solution**: Run `db.users.updateOne({ username: "admin_username" }, { $set: { role: "admin" } })`

---

### 2. **Check Browser Console Logs**

Open browser Developer Tools (F12 → Console) and look for:

```javascript
// Should see when logging in:
Login response: { user: {...}, accessToken: "...", ... }
User data: { ..., role: "admin", isAdmin: true }
isAdmin: true

// Should see when app renders:
Rendering dashboard - user: { ..., isAdmin: true }
user.isAdmin: true
Should show admin? true
```

❌ **Problem**: If you see `isAdmin: false` or `isAdmin: undefined`  
✅ **Solution**: Backend not returning correct data (see step 3)

---

### 3. **Verify Backend is Returning isAdmin**

Check server response when logging in:

```javascript
// In browser Network tab:
// POST /api/auth/login
// Response should include:
{
  "message": "Login successful",
  "user": {
    "id": "...",
    "username": "admin_username",
    "email": "...",
    "role": "admin",
    "isAdmin": true  # ← MUST BE PRESENT
  },
  "accessToken": "...",
  "refreshToken": "..."
}
```

❌ **Problem**: No `isAdmin` field in response  
✅ **Solution**: Restart server (backend code was updated with isAdmin field)

---

### 4. **Verify Email is Verified**

```bash
# Check in MongoDB:
db.users.findOne({ username: "admin_username" })

# Look for:
isEmailVerified: true
```

❌ **Problem**: If `isEmailVerified: false` → Can't login  
✅ **Solution**: In dev mode, this should auto-verify. For production, verify via email link.

---

### 5. **Check React App Code**

Login → Create Admin Account → Check Browser Console

**Follow these steps:**

1. Open browser DevTools (F12)
2. Go to Console tab
3. Clear console
4. Click "Admin" tab on login page
5. Enter username and password
6. Watch the console logs

**Expected output:**
```
Login response: {...}
User data: {..., isAdmin: true}
isAdmin: true
Rendering dashboard - user: {..., isAdmin: true}
Should show admin? true
```

Then you should see the **Admin Dashboard with tabs: Stats, Users, Logs**

---

## Step-by-Step Fix

### Step 1: Verify Database
```bash
# Connect to MongoDB
db.users.find({ role: "admin" })  # Should show admin users
```

### Step 2: Restart Server
```bash
# Kill current server and restart
npm start
# This loads the updated auth controller with isAdmin field
```

### Step 3: Clear Browser Cache
```bash
# In browser:
1. Press F12 (DevTools)
2. Go to Application tab
3. Clear Local Storage
4. Clear Cookies
5. Refresh page
```

### Step 4: Login Again
1. Click "Admin" tab
2. Enter admin credentials
3. Check console for logs
4. Should see Admin Dashboard

---

## Expected Behavior

### Regular User Login
```
Role: "user"
isAdmin: false
Dashboard shows: File manager, folders, uploads
```

### Admin User Login
```
Role: "admin"
isAdmin: true
AdminDashboard shows: Stats, Users, Activity Logs tabs
```

---

## Common Issues & Solutions

### ❌ Issue: Still seeing user dashboard after admin login
**Cause**: `isAdmin` not being set correctly  
**Fix**:
1. Verify `role: "admin"` in database
2. Restart server
3. Clear browser cache
4. Log out and log back in

### ❌ Issue: Login fails with "Account is deactivated"
**Cause**: User `isActive` is false  
**Fix**: 
```bash
db.users.updateOne({ username: "admin" }, { $set: { isActive: true } })
```

### ❌ Issue: Console shows `isAdmin: undefined`
**Cause**: Backend not updated  
**Fix**: Restart server with `npm start`

### ❌ Issue: Can't find admin user in database
**Cause**: Username not promoted to admin  
**Fix**: Promote the user:
```bash
db.users.updateOne(
  { username: "your_username" },
  { $set: { role: "admin" } }
)
```

---

## Verification Script

Run this in MongoDB to verify setup:

```javascript
// Check if admin user exists
const admin = db.users.findOne({ username: "admin" });
console.log("Admin user:", admin);
console.log("Role:", admin?.role);
console.log("Is admin?", admin?.role === "admin");
console.log("Email verified?", admin?.isEmailVerified);
console.log("Account active?", admin?.isActive);
```

---

## Need More Help?

1. Check browser console for errors (F12 → Console)
2. Check network tab (F12 → Network) for API responses
3. Verify database using MongoDB Compass or mongosh
4. Restart the application
5. Try clearing cache and relogging in
