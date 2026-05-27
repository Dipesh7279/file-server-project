# Complete Admin System Guide

## How Admin Features Work

### System Architecture

```
┌─────────────────┐
│  User Registers │
│  (role: user)   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ Admin Promotes to Admin  │
│ (role: admin)           │
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ User Logs In with Creds      │
│ Backend Checks role field    │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Backend Returns:                     │
│ - role: "admin"                      │
│ - isAdmin: true                      │
└────────┬─────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│ Frontend Checks user.isAdmin         │
│ - If true → Show AdminDashboard      │
│ - If false → Show UserDashboard      │
└──────────────────────────────────────┘
```

---

## Quick Start: Create First Admin

### Prerequisites
- MongoDB running
- Server running (npm start)
- User account created

### Steps

**1. Create a regular user:**
- App Login page → Register tab
- Fill: username, email, password
- Click "Create Account"

**2. Promote to admin via MongoDB:**
```bash
# Open MongoDB console (mongosh or mongo)
db.users.updateOne(
  { username: "your_username" },
  { $set: { role: "admin" } }
)
```

**3. Verify in database:**
```bash
db.users.findOne({ username: "your_username" })
# Check that role field shows "admin"
```

**4. Login as admin:**
- Logout if logged in
- Click "Admin" tab on login page
- Enter username and password
- Should see Admin Dashboard with tabs

---

## What Admins Can Do

### Admin Dashboard Features

1. **Stats Tab**
   - System statistics
   - User count
   - Storage metrics

2. **Users Tab**
   - View all users
   - Suspend/reactivate users
   - User management

3. **Activity Logs Tab**
   - View system activity
   - Track user actions
   - Monitor file operations

---

## API Endpoints

### Authentication Endpoints

```javascript
POST /api/auth/login
// Request:
{ username: "admin", password: "password" }

// Response (if admin):
{
  user: {
    id: "...",
    username: "admin",
    role: "admin",
    isAdmin: true  // ← Key field
  },
  accessToken: "...",
  refreshToken: "..."
}
```

```javascript
GET /api/auth/profile
// Response includes:
{
  user: {
    id: "...",
    username: "admin",
    role: "admin",
    isAdmin: true  // ← Computed field
  }
}
```

### Admin Endpoints

```javascript
GET /admin/system-stats       // Get system statistics
GET /admin/users              // List all users
GET /admin/activity-logs      // View activity logs
PUT /admin/users/:id/suspend  // Suspend user
PUT /admin/users/:id/reactivate // Reactivate user
```

---

## Database Schema

### User Collection

```javascript
{
  _id: ObjectId,
  username: "admin",
  email: "admin@example.com",
  password: "hashed_password",
  role: "admin",              // ← Determines admin status
  isActive: true,
  isEmailVerified: true,
  storageQuota: 1073741824,   // 1 GB for admin (1024*1024*1024)
  storageUsed: 0,
  createdAt: Date,
  updatedAt: Date,
  ...
}
```

**Role Values:**
- `"user"` - Regular user (default) → **100 MB storage quota**
- `"admin"` - Administrator → **1 GB storage quota**

---

## Troubleshooting

### Admin Not Showing AdminDashboard?

**Check 1: Database**
```bash
db.users.findOne({ username: "admin" })
# Verify: role: "admin"
```

**Check 2: Browser Console (F12)**
```javascript
// Should show:
isAdmin: true
// Should NOT show:
isAdmin: false
isAdmin: undefined
```

**Check 3: Network Tab (F12)**
- Login request response should include `isAdmin: true`

**Check 4: App Restart**
- Restart backend server (`npm start`)
- Clear browser cache (Ctrl+Shift+Delete)
- Log out and log back in

---

## Testing

### Manual Test Checklist

- [ ] Create regular user account
- [ ] Promote to admin via MongoDB
- [ ] Logout and log back in
- [ ] Click "Admin" tab on login
- [ ] Login with admin credentials
- [ ] Verify AdminDashboard appears
- [ ] Check console for `isAdmin: true`
- [ ] Click through Stats, Users, Logs tabs

---

## Promoting Multiple Admins

To create multiple admin accounts:

```javascript
// Create User 1
db.users.insertOne({
  username: "admin1",
  email: "admin1@example.com",
  password: "hashed",
  role: "admin",
  isActive: true,
  isEmailVerified: true
})

// Create User 2
db.users.insertOne({
  username: "admin2",
  email: "admin2@example.com",
  password: "hashed",
  role: "admin",
  isActive: true,
  isEmailVerified: true
})
```

Or promote existing users:
```javascript
db.users.updateMany(
  { username: { $in: ["user1", "user2"] } },
  { $set: { role: "admin" } }
)
```

---

## Security Notes

⚠️ **Important:**
- Never expose `role` field in public APIs (already excluded)
- `isAdmin` is computed from role on backend
- Admins should have strong passwords
- Consider 2FA for admin accounts in future
- Review activity logs regularly
- Limit number of admins

---

## File Locations

- **Frontend Admin Component**: `client/renderer/components/AdminDashboard.jsx`
- **Frontend Login**: `client/renderer/components/LoginPage.jsx`
- **Backend Auth Controller**: `server/controllers/authController.js`
- **User Model**: `server/models/user.js`
- **Setup Guide**: `ADMIN_SETUP_GUIDE.md`
- **Debugging Guide**: `DEBUGGING_ADMIN_DASHBOARD.md`

---

## Related Documentation

- See `ADMIN_SETUP_GUIDE.md` for initial setup
- See `DEBUGGING_ADMIN_DASHBOARD.md` for troubleshooting
