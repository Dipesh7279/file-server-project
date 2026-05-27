# FileServer API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except auth endpoints) require Bearer token:
```
Authorization: Bearer <accessToken>
```

---

## Authentication Endpoints

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "SecurePass123!"
}

Response 201:
{
  "user": {
    "_id": "...",
    "username": "johndoe",
    "email": "john@example.com",
    "isVerified": false,
    "storageQuota": 5368709120,
    "storageUsed": 0
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "SecurePass123!"
}

Response 200:
{
  "user": { /* user object */ },
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Verify Email
```
POST /auth/verify-email
Content-Type: application/json

{
  "code": "123456"
}

Response 200:
{
  "message": "Email verified successfully"
}
```

### Refresh Token
```
POST /auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}

Response 200:
{
  "accessToken": "...",
  "refreshToken": "..."
}
```

### Reset Password
```
POST /auth/reset-password
Content-Type: application/json

{
  "email": "john@example.com",
  "newPassword": "NewPass123!",
  "resetToken": "token_from_email"
}

Response 200:
{
  "message": "Password reset successfully"
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer <token>

Response 200:
{
  "message": "Logged out successfully"
}
```

---

## File Endpoints

### List Files
```
GET /files?folderId=<id>&page=1&limit=50
Authorization: Bearer <token>

Response 200:
{
  "files": [
    {
      "_id": "...",
      "name": "document.pdf",
      "size": 1024000,
      "mimeType": "application/pdf",
      "userId": "...",
      "folderId": null,
      "hash": "sha256hash",
      "isDeleted": false,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

### Upload File
```
POST /files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- file: <binary>
- folderId: (optional) "..."

Response 201:
{
  "file": {
    "_id": "...",
    "name": "document.pdf",
    "size": 1024000,
    "hash": "sha256hash",
    "userId": "...",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Download File
```
GET /files/:fileId/download
Authorization: Bearer <token>

Response 200: <binary file content>
```

### Delete File
```
DELETE /files/:fileId
Authorization: Bearer <token>

Response 200:
{
  "message": "File deleted successfully",
  "movedTo": "trash_id"
}
```

### Rename File
```
PUT /files/:fileId
Authorization: Bearer <token>

{
  "name": "new_filename.pdf"
}

Response 200:
{
  "file": { /* updated file */ }
}
```

### Get File Versions
```
GET /files/:fileId/versions
Authorization: Bearer <token>

Response 200:
{
  "versions": [
    {
      "_id": "...",
      "fileId": "...",
      "version": 1,
      "size": 1024000,
      "hash": "...",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Restore File Version
```
PUT /files/:fileId/versions/:versionId/restore
Authorization: Bearer <token>

Response 200:
{
  "message": "Version restored successfully",
  "file": { /* restored file */ }
}
```

### Search Files
```
GET /files/search?name=document&page=1&limit=20
Authorization: Bearer <token>

Response 200:
{
  "results": [ /* matching files */ ],
  "total": 5,
  "page": 1
}
```

### List Trash
```
GET /files/trash
Authorization: Bearer <token>

Response 200:
{
  "files": [ /* deleted files */ ],
  "total": 3
}
```

---

## Folder Endpoints

### List All Folders
```
GET /folders
Authorization: Bearer <token>

Response 200:
{
  "folders": [
    {
      "_id": "...",
      "name": "Documents",
      "userId": "...",
      "parentID": null,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Create Folder
```
POST /folders
Authorization: Bearer <token>

{
  "name": "New Folder",
  "parentID": null  // optional, for nested folders
}

Response 201:
{
  "folder": {
    "_id": "...",
    "name": "New Folder",
    "userId": "...",
    "parentID": null,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### Delete Folder
```
DELETE /folders/:folderId
Authorization: Bearer <token>

Response 200:
{
  "message": "Folder deleted successfully"
}
```

### Rename Folder
```
PUT /folders/:folderId
Authorization: Bearer <token>

{
  "name": "Renamed Folder"
}

Response 200:
{
  "folder": { /* updated folder */ }
}
```

### Get Folder Contents
```
GET /folders/:folderId/contents
Authorization: Bearer <token>

Response 200:
{
  "folders": [ /* subfolders */ ],
  "files": [ /* files in this folder */ ]
}
```

---

## File Sharing Endpoints

### Create Share Link
```
POST /share/create
Authorization: Bearer <token>

{
  "fileId": "...",
  "accessType": "public",     // public, private, protected
  "shareType": "download",     // view, download
  "password": "optional",      // required if protected
  "expiresIn": 604800,        // seconds, optional
  "maxDownloads": 10          // optional
}

Response 201:
{
  "shareLink": {
    "_id": "...",
    "token": "share_token_123",
    "fileId": "...",
    "accessType": "public",
    "createdBy": "...",
    "createdAt": "2024-01-15T10:30:00Z",
    "expiresAt": "2024-01-22T10:30:00Z"
  }
}
```

### List My Shares
```
GET /share/my-shares
Authorization: Bearer <token>

Response 200:
{
  "shares": [ /* all shared files by user */ ]
}
```

### Get Share Info (without auth, for public shares)
```
GET /share/:token

Response 200:
{
  "shareLink": {
    "token": "...",
    "fileName": "document.pdf",
    "fileSize": 1024000,
    "accessType": "public",
    "expiresAt": "2024-01-22T10:30:00Z",
    "requiresPassword": false,
    "downloadsLeft": 10
  }
}
```

### Download Shared File
```
GET /share/:token/download?password=optional

Response 200: <binary file content>
```

### Update Share
```
PUT /share/:shareId
Authorization: Bearer <token>

{
  "isActive": true,
  "maxDownloads": 20
}

Response 200:
{
  "shareLink": { /* updated share */ }
}
```

### Delete Share
```
DELETE /share/:shareId
Authorization: Bearer <token>

Response 200:
{
  "message": "Share deleted successfully"
}
```

---

## Admin Endpoints

### Get All Users
```
GET /admin/users?page=1&limit=20
Authorization: Bearer <admin_token>

Response 200:
{
  "users": [
    {
      "_id": "...",
      "username": "john",
      "email": "john@example.com",
      "isActive": true,
      "storageUsed": 104857600,
      "storageQuota": 5368709120,
      "createdAt": "2024-01-10T10:30:00Z"
    }
  ],
  "total": 25
}
```

### Get User Stats
```
GET /admin/users/:userId/stats
Authorization: Bearer <admin_token>

Response 200:
{
  "user": { /* user object */ },
  "stats": {
    "totalFiles": 15,
    "totalFolders": 3,
    "storageUsed": 104857600,
    "lastLogin": "2024-01-15T10:30:00Z",
    "fileCount": 15,
    "folderCount": 3
  }
}
```

### Suspend User
```
PUT /admin/users/:userId/suspend
Authorization: Bearer <admin_token>

Response 200:
{
  "message": "User suspended successfully"
}
```

### Reactivate User
```
PUT /admin/users/:userId/reactivate
Authorization: Bearer <admin_token>

Response 200:
{
  "message": "User reactivated successfully"
}
```

### Get System Statistics
```
GET /admin/system-stats
Authorization: Bearer <admin_token>

Response 200:
{
  "stats": {
    "totalUsers": 150,
    "activeUsers": 120,
    "totalFiles": 5000,
    "totalStorage": 524288000000,
    "usedStorage": 104857600000,
    "logsToday": 2500,
    "newUsersToday": 5
  }
}
```

### Get Activity Logs
```
GET /admin/activity-logs?action=upload&userId=&page=1&limit=50
Authorization: Bearer <admin_token>

Response 200:
{
  "logs": [
    {
      "_id": "...",
      "userId": "...",
      "action": "upload",
      "description": "Uploaded file.pdf",
      "ipAddress": "192.168.1.1",
      "status": "success",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 100
}
```

### Get Storage Stats
```
GET /admin/storage-stats
Authorization: Bearer <admin_token>

Response 200:
{
  "stats": {
    "totalQuota": 750368709120,
    "usedStorage": 104857600000,
    "availableStorage": 645511109120,
    "utilizationPercent": 14.0,
    "topUsers": [
      { "username": "john", "usage": 50000000000 }
    ]
  }
}
```

### Reset User Password (Admin)
```
PUT /admin/users/:userId/reset-password
Authorization: Bearer <admin_token>

{
  "newPassword": "TempPassword123!"
}

Response 200:
{
  "message": "Password reset successfully"
}
```

### Delete User (Admin)
```
DELETE /admin/users/:userId
Authorization: Bearer <admin_token>

Response 200:
{
  "message": "User deleted successfully",
  "filesDeleted": 25,
  "storageFreed": 104857600
}
```

---

## User Profile Endpoints

### Get Profile
```
GET /users/profile
Authorization: Bearer <token>

Response 200:
{
  "user": {
    "_id": "...",
    "username": "john",
    "email": "john@example.com",
    "isVerified": true,
    "isAdmin": false,
    "storageUsed": 104857600,
    "storageQuota": 5368709120,
    "createdAt": "2024-01-10T10:30:00Z"
  }
}
```

### Update Profile
```
PUT /users/profile
Authorization: Bearer <token>

{
  "email": "newemail@example.com",
  "username": "newusername"
}

Response 200:
{
  "user": { /* updated user */ }
}
```

### Change Password
```
POST /users/change-password
Authorization: Bearer <token>

{
  "currentPassword": "CurrentPass123!",
  "newPassword": "NewPass123!"
}

Response 200:
{
  "message": "Password changed successfully"
}
```

### Get Storage Info
```
GET /users/storage
Authorization: Bearer <token>

Response 200:
{
  "used": 104857600,
  "quota": 5368709120,
  "percentage": 1.95,
  "remaining": 5263851520
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

### Common Status Codes
- **200**: Success
- **201**: Created
- **400**: Bad Request (validation error)
- **401**: Unauthorized (invalid/missing token)
- **403**: Forbidden (no permission)
- **404**: Not Found
- **409**: Conflict (duplicate, etc)
- **413**: Payload Too Large
- **429**: Too Many Requests (rate limited)
- **500**: Server Error

### Common Error Codes
- `INVALID_CREDENTIALS` - Login failed
- `EMAIL_ALREADY_EXISTS` - Email already registered
- `FILE_NOT_FOUND` - File doesn't exist
- `INSUFFICIENT_STORAGE` - Storage quota exceeded
- `UNAUTHORIZED` - Authentication required
- `FORBIDDEN` - Insufficient permissions
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INVALID_TOKEN` - Token invalid or expired

---

## Rate Limiting

- **Login**: 100 requests per 15 minutes
- **Register**: 10 requests per hour
- **Password Reset**: 5 requests per hour
- **General API**: 1000 requests per 15 minutes per user

Header response:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1610700000
```

---

## Pagination

Use `page` and `limit` query parameters:
```
GET /files?page=2&limit=25

Response:
{
  "data": [...],
  "page": 2,
  "limit": 25,
  "total": 150,
  "totalPages": 6,
  "hasNextPage": true,
  "hasPrevPage": true
}
```

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"AdminPassword123!"}'
```

### List Files
```bash
curl -X GET http://localhost:5000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Upload File
```bash
curl -X POST http://localhost:5000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "folderId=optional_folder_id"
```

---

**API Version**: 1.0
**Last Updated**: 2024-01-15
