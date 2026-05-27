# FileServer - Quick Start Guide

## 🚀 Start the Project in 5 Minutes

### 1. Terminal 1: Start MongoDB
```bash
# On Windows
mongod

# On Linux/macOS
mongod --dbpath /usr/local/var/mongodb
```

### 2. Terminal 2: Start Backend Server
```bash
cd server
npm install          # First time only
npm start            # Starts on http://localhost:5000
```

You should see:
```
✅ Server running on port 5000
✅ MongoDB connected
```

### 3. Terminal 3: Start Frontend
```bash
cd client
npm install          # First time only
npm start            # Starts React on http://localhost:3000
```

Wait for React to compile (~30 seconds).

### 4. Terminal 4: Start Electron (optional)
```bash
cd client
npm run electron     # Opens Electron app with React
```

Or combine both:
```bash
cd client
npm run dev          # Runs React + Electron together
```

---

## 🔐 Test Credentials

Once server starts, it creates default admin user:
- **Email**: admin@example.com
- **Password**: AdminPassword123!

Create another test user or login as admin.

---

## 📱 Access Points

- **Web Browser**: http://localhost:3000 (React dev server)
- **API Server**: http://localhost:5000/api
- **Electron App**: Double-click after `npm run electron`

---

## ✅ Verify Everything Works

1. **Backend API**:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should return 200 OK

2. **Frontend**:
   Open http://localhost:3000 in browser
   Should see login screen

3. **Database**:
   ```bash
   mongosh
   use fileserver
   db.users.find()
   ```
   Should show admin user

---

## 📁 Important Files

### Backend
- `server/app.js` - Main server
- `server/package.json` - Dependencies
- `.env` - Configuration (create from `.env.example`)

### Frontend
- `client/renderer/App.jsx` - React main component
- `client/renderer/components/` - UI components
- `client/renderer/api.js` - API client
- `client/main.js` - Electron main process

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connection error | Make sure `mongod` is running |
| Port 5000 in use | Kill process: `lsof -i :5000` then `kill -9 <PID>` |
| Port 3000 in use | Kill process: `lsof -i :3000` then `kill -9 <PID>` |
| React won't start | Delete `node_modules` and `npm install` again |
| Can't login | Check server logs, make sure admin user created |
| API 404 errors | Verify `REACT_APP_API_URL` in `.env` is correct |

---

## 📚 Next Steps

1. **Create a test user**: Click "Register" on login page
2. **Upload a file**: Click "📤 Upload" button
3. **Create a folder**: Click "📁 New Folder"
4. **Share a file**: Right-click file → Share
5. **View admin panel**: Login as admin, see ⚙️ Admin Dashboard

---

## 🏗️ Project Structure

```
file-server-project/
├── server/              ← Node.js + Express backend
│   ├── app.js
│   ├── models/          ← MongoDB models
│   ├── controllers/     ← Business logic
│   ├── routes/          ← API endpoints
│   └── middleware/      ← Auth, validation, rate limit
├── client/              ← React + Electron frontend
│   ├── main.js          ← Electron main
│   └── renderer/        ← React components
│       ├── App.jsx
│       ├── components/  ← UI components
│       └── api.js       ← Axios client
└── README.md            ← Full documentation
```

---

## 💡 Tips

- **Hot Reload**: React dev server automatically reloads on code changes
- **DevTools**: Press F12 in browser or Electron app for debugging
- **API Testing**: Use Postman with Bearer token from login response
- **Database**: Use `mongosh` to view/edit data directly
- **Logs**: Check server terminal for API logs and errors

---

## 🎯 Demo Walkthrough

1. Start all 3 services (MongoDB, Server, Frontend)
2. Open http://localhost:3000
3. Register: `testuser@test.com` / `TestPassword123!`
4. Login with those credentials
5. Upload a file (Click 📤 Upload)
6. Create a folder (Click 📁 New Folder)
7. Move file to folder
8. Share file (Right-click → Share)
9. Copy share link and test in incognito window
10. View Admin Dashboard (login as admin, click ⚙️)

---

## 📞 Need Help?

Check these files for more info:
- `COMPLETE_IMPLEMENTATION_GUIDE.md` - Full project guide
- `server/README.md` - Backend documentation
- `client/README.md` - Frontend documentation
- `docs/API_DOCUMENTATION.md` - API reference (coming soon)

Happy file serving! 🎉
