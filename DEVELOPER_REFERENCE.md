# FileServer - Developer's Quick Reference

## 🚀 Quick Start (Copy & Paste)

### Terminal 1: Start MongoDB
```bash
mongod
```

### Terminal 2: Start Backend
```bash
cd server
npm install
npm start
# Runs on http://localhost:5000
```

### Terminal 3: Start Frontend
```bash
cd client
npm install
npm start
# Runs on http://localhost:3000
```

### Terminal 4: Start Electron (Optional)
```bash
cd client
npm run electron
```

---

## 📁 Project Structure Quick Reference

```
server/
├── app.js                 ← Express entry point
├── config/db.js          ← MongoDB connection
├── middleware/           ← Auth, rate limiting
├── models/               ← 8 MongoDB schemas
├── controllers/          ← 41 functions (business logic)
├── routes/               ← 42 API endpoints
└── package.json          ← Dependencies

client/
├── main.js               ← Electron main process
├── preload.js            ← IPC bridge
├── renderer/
│   ├── App.jsx           ← React root component
│   ├── api.js            ← Axios client (30+ endpoints)
│   ├── styles-new.css    ← 14KB responsive styles
│   ├── index.jsx         ← React entry
│   └── components/
│       ├── LoginPage.jsx
│       ├── Dashboard.jsx
│       ├── FileManager.jsx
│       ├── Header.jsx
│       ├── Sidebar.jsx
│       ├── AdminDashboard.jsx
│       └── ShareModal.jsx
└── package.json          ← Electron + React config
```

---

## 🔑 Key Files

| File | Purpose | Lines |
|------|---------|-------|
| `server/app.js` | Express setup | 100+ |
| `client/main.js` | Electron setup | 370 |
| `client/renderer/App.jsx` | React root | 70 |
| `client/renderer/api.js` | API client | 150+ |
| `client/renderer/styles-new.css` | Styling | 14,600+ |

---

## 🔗 API Quick Reference

### Authentication
```javascript
POST   /auth/register          // Register user
POST   /auth/login             // Login
POST   /auth/verify-email      // Verify email
POST   /auth/refresh-token     // Refresh token
POST   /auth/reset-password    // Reset password
POST   /auth/logout            // Logout
```

### Files
```javascript
GET    /files                  // List files
POST   /files/upload           // Upload file
GET    /files/:id/download     // Download file
DELETE /files/:id              // Delete file
PUT    /files/:id              // Rename file
GET    /files/:id/versions     // Get versions
PUT    /files/:id/versions/:v/restore  // Restore version
GET    /files/search?name=     // Search files
GET    /files/trash            // List trash
```

### Folders
```javascript
GET    /folders                // List all folders
POST   /folders                // Create folder
DELETE /folders/:id            // Delete folder
PUT    /folders/:id            // Rename folder
GET    /folders/:id/contents   // Get contents
```

### Sharing
```javascript
POST   /share/create           // Create share link
GET    /share/my-shares        // List my shares
GET    /share/:token           // Get share info
GET    /share/:token/download  // Download shared
PUT    /share/:id              // Update share
DELETE /share/:id              // Delete share
```

### Admin
```javascript
GET    /admin/users            // List users
GET    /admin/users/:id/stats  // User stats
PUT    /admin/users/:id/suspend    // Suspend user
PUT    /admin/users/:id/reactivate // Reactivate
GET    /admin/system-stats     // System stats
GET    /admin/activity-logs    // Activity logs
GET    /admin/storage-stats    // Storage stats
```

---

## 🧪 Testing

### Quick Test
```bash
# Login (copy the token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminPassword123!"}'

# Use token in Authorization header
curl http://localhost:5000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Test Users
```
Email: admin@example.com
Password: AdminPassword123!

// Or register new user via API
```

---

## 📝 Common Tasks

### Add New API Endpoint

**1. Create Route**
```javascript
// server/routes/fileRoutes.js
router.get('/:id/preview', authMiddleware, fileController.getFilePreview);
```

**2. Create Controller Function**
```javascript
// server/controllers/fileController.js
getFilePreview: async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    // Logic here
    res.json({ success: true, preview: '...' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
```

**3. Add to API Client**
```javascript
// client/renderer/api.js
export const fileAPI = {
  getPreview: (fileId) => api.get(`/files/${fileId}/preview`),
};
```

**4. Use in Component**
```javascript
// client/renderer/components/FileManager.jsx
const handlePreview = async (fileId) => {
  const res = await fileAPI.getPreview(fileId);
  console.log(res.data.preview);
};
```

### Add New React Component

**1. Create File**
```javascript
// client/renderer/components/NewComponent.jsx
export default function NewComponent({ prop1, prop2 }) {
  return <div>Component here</div>;
}
```

**2. Import in App**
```javascript
// client/renderer/App.jsx
import NewComponent from './components/NewComponent';
```

**3. Use in Routing**
```javascript
// Add to conditional rendering in App.jsx
{user?.isAdmin ? <AdminDashboard /> : <NewComponent />}
```

### Add Styling

```css
/* client/renderer/styles-new.css */
.my-element {
  padding: 10px;
  background: var(--surface-color);
  border-radius: 6px;
  box-shadow: var(--shadow);
}

/* Use CSS variables */
--primary-color: #0078d4
--danger-color: #d13438
--success-color: #107c10
--text-main: #1e1e1e
--text-muted: #666
```

---

## 🐛 Debugging

### Frontend (React)
```javascript
// Open DevTools
F12  // or right-click → Inspect

// Check localStorage
localStorage.getItem('accessToken')
localStorage.getItem('user')

// Clear cache
Ctrl+Shift+Delete  // or Cmd+Shift+Delete on Mac
```

### Backend (Node.js)
```javascript
// Check server logs
npm start  // See console output

// MongoDB connection
mongosh mongodb://localhost:27017/fileserver
db.users.find()
db.files.find()
```

### Network
```javascript
// Check API calls
F12 → Network tab
Look for XHR requests to localhost:5000/api

// Common issues
- CORS: Check server/app.js CORS config
- Auth: Check Authorization header
- Tokens: Check token expiration
```

---

## ⚙️ Configuration

### Server (.env)
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fileserver
JWT_SECRET=your_secret_key
NODE_ENV=development
```

### Client (.env)
```
REACT_APP_API_URL=http://localhost:5000/api
```

---

## 📦 Build & Deploy

### Build React
```bash
cd client
npm run build
# Creates: build/ folder with optimized files
```

### Build Electron
```bash
cd client
npm run build-electron      # Auto-detects platform
npm run build-win           # Windows only
npm run build-linux         # Linux only
npm run build-mac           # macOS only
```

### Deploy Server
```bash
# Option 1: Docker
docker-compose up -d

# Option 2: PM2
pm2 start server/app.js --name fileserver

# Option 3: Manual
cd server
NODE_ENV=production npm start
```

---

## 🔍 Database Schema Quick Reference

### User
```javascript
{
  _id, username, email, password, passwordResetToken,
  isVerified, isActive, isAdmin, emailVerificationCode,
  storageQuota, storageUsed, refreshTokens[],
  lockUntil, loginAttempts, lastLogin, createdAt
}
```

### File
```javascript
{
  _id, name, size, mimeType, userId, folderId,
  hash, isDeleted, createdAt, updatedAt
}
```

### ShareLink
```javascript
{
  _id, token, fileId, createdBy, accessType,
  shareType, password, maxDownloads, downloadsCount,
  isActive, expiresAt, createdAt
}
```

---

## 🎯 Performance Tips

1. **Database**: Use indexes (already implemented)
2. **Frontend**: Lazy load components
3. **Files**: Deduplicate with SHA256 (already done)
4. **Caching**: Add Redis for sessions
5. **Compression**: Enable gzip (ready in Express)
6. **Images**: Optimize and compress

---

## 🚨 Error Handling

### Frontend
```javascript
try {
  const res = await api.post('/files/upload', data);
  console.log(res.data);
} catch (err) {
  const message = err.response?.data?.message || 'Error occurred';
  alert(message);
}
```

### Backend
```javascript
try {
  const file = await File.findById(req.params.id);
  if (!file) {
    return res.status(404).json({ message: 'File not found' });
  }
  res.json({ success: true, file });
} catch (err) {
  res.status(500).json({ message: err.message });
}
```

---

## 📚 Quick Links

| Resource | Link |
|----------|------|
| API Docs | `API_DOCUMENTATION.md` |
| Setup Guide | `QUICKSTART.md` |
| Full Guide | `COMPLETE_IMPLEMENTATION_GUIDE.md` |
| Checklist | `COMPLETION_CHECKLIST.md` |
| Architecture | `docs/ARCHITECTURE.md` |

---

## 💡 Code Examples

### Upload File
```javascript
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const res = await fileAPI.upload(formData);
    console.log('Uploaded:', res.data.file);
  } catch (err) {
    alert(err.response?.data?.message);
  }
};
```

### Create Folder
```javascript
const handleCreateFolder = async (name) => {
  try {
    const res = await folderAPI.create({ name });
    console.log('Created:', res.data.folder);
  } catch (err) {
    alert(err.response?.data?.message);
  }
};
```

### Share File
```javascript
const handleShare = async (fileId) => {
  try {
    const res = await shareAPI.create({
      fileId,
      accessType: 'public',
      shareType: 'download'
    });
    const link = `${window.location.origin}/share/${res.data.shareLink.token}`;
    navigator.clipboard.writeText(link);
    alert('Share link copied!');
  } catch (err) {
    alert(err.response?.data?.message);
  }
};
```

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Status**: Ready for Development
