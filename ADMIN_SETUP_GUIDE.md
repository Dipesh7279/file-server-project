# Admin Account Management Guide

## How the System Identifies Admins

The system uses the **User.role** field to determine if a user is an admin:

```javascript
// User model
role: {
  type: String,
  enum: ["admin", "user"],
  default: "user"  // New users are created as "user" by default
}
```

When a user logs in:
- Backend checks `user.role`
- If role === "admin", `isAdmin` property is set to `true`
- Frontend routes admin users to AdminDashboard

---

## How to Create an Admin Account

### Method 1: Create via MongoDB (Direct Database)

```bash
# Connect to MongoDB and run these commands:
db.users.updateOne(
  { username: "admin" },
  { $set: { role: "admin" } }
)
```

### Method 2: Create a New Admin User (Recommended)

1. **First, register a normal user account:**
   - Go to Login page → Click "Register"
   - Fill in username, email, password
   - Create the account

2. **Then, promote them to admin via MongoDB:**
   ```bash
   # Find the user by username and update role
   db.users.findOneAndUpdate(
     { username: "your_username" },
     { $set: { role: "admin" } },
     { returnDocument: "after" }
   )
   ```

3. **Verify the change:**
   ```bash
   db.users.findOne({ username: "your_username" })
   # Should show: role: "admin"
   ```

4. **Log out and log back in** - Now use the "Admin" tab to access admin panel

---

## Step-by-Step Example

### Create First Admin Account

**Step 1: Register normal account**
- Login page → "Register" tab
- Username: `admin`
- Email: `admin@example.com`
- Password: `Admin@123`

**Step 2: Open MongoDB** (or use MongoDB Compass)
```bash
mongosh  # or mongo for older versions
use fileserver  # use your database name
db.users.findOne({ username: "admin" })  # Verify user exists
```

**Step 3: Promote to admin**
```bash
db.users.updateOne(
  { username: "admin" },
  { $set: { role: "admin" } }
)
```

**Step 4: Verify**
```bash
db.users.findOne({ username: "admin" })
# Output should include: role: 'admin'
```

**Step 5: Log out and log back in**
- Logout from app
- Click "Admin" tab on login page
- Enter username: `admin`
- Enter password: `Admin@123`
- You should now see Admin Dashboard ✅

---

## What Admins Can Do

After logging in as admin:
- View admin dashboard
- See system analytics
- Manage users (if admin panel is fully implemented)
- Access admin features

---

## Create Additional Admins

Repeat steps 1-5 for any other admin accounts you need.

---

## Troubleshooting

**Q: I promoted a user to admin but login still shows user dashboard**
- A: Log out completely and log back in. The role is checked on login.

**Q: Admin tab not showing anything / admin dashboard not loading**
- A: Check browser console for errors. Verify `role: "admin"` in database.

**Q: How do I check if a user is admin?**
```bash
db.users.findOne({ username: "username" })
# Look for: role: 'admin'
```

**Q: How to remove admin privileges?**
```bash
db.users.updateOne(
  { username: "admin_username" },
  { $set: { role: "user" } }
)
```

---

## API Implementation (Optional)

For a UI-based admin creation, an endpoint like this could be added:

```javascript
POST /api/admin/promote
Body: { userId: "user_id" }
Response: { message: "User promoted to admin" }
```

But for now, use the MongoDB method above.
