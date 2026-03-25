# System Design - File Server Project

## Overview
This project is a cross-platform GUI-based file server built using Node.js and MongoDB.

It allows users to:
- Upload files
- Download files
- Manage files and folders
- Authenticate securely
- Support multiple users

---

## Architecture Type
Client-Server Architecture

- Client: Electron desktop app
- Server: Node.js (Express)
- Database: MongoDB
- Storage: Local file system



## Components

### 1. Client (Electron App)
- Login/Register UI
- File upload/download interface
- Dashboard to manage files

### 2. Server (Node.js)
- Handles API requests
- Authentication (JWT)
- File handling (upload/download)
- Business logic

### 3. Database (MongoDB)
- Stores user data
- Stores file metadata

### 4. File Storage
- Stores actual files on disk (local machine)


## Data Flow

1. User logs in from Electron app
2. Request goes to Node.js server
3. Server verifies user using JWT
4. User uploads file
5. Server stores file in local storage
6. File metadata stored in MongoDB
7. Client fetches file list from server


## Key Features

- Authentication (JWT + bcrypt)
- File upload/download
- File management (delete, rename)
- Multi-user support
- Role-Based Access Control (RBAC)
- Secure communication (HTTPS)

## Architecture Diagram

Client (Electron App)
        ↓
   HTTP/HTTPS
        ↓
Node.js Server (Express)
   ↓            ↓
MongoDB     File Storage


## API Design

### Authentication APIs
- POST /api/auth/register → Register user
- POST /api/auth/login → Login user

### File APIs
- POST /api/files/upload → Upload file
- GET /api/files → Get file list
- GET /api/files/:id → Download file
- DELETE /api/files/:id → Delete file
- PUT /api/files/:id → Rename file

### Directory APIs
- POST /api/folders → Create folder
- GET /api/folders → Get folders
- DELETE /api/folders/:id → Delete folder


## Database Design (MongoDB)

### Users Collection
- _id
- username
- password (hashed)
- role (admin/user)
- createdAt

### Files Collection
- _id
- filename
- path
- size
- userId
- createdAt

### Folders Collection
- _id
- name
- userId
- createdAt

## Security Design

- Passwords stored using bcrypt hashing
- JWT used for authentication
- Protected routes using middleware
- File validation (size/type)
- Prevent unauthorized access


## Role-Based Access Control (RBAC)

Roles:
- Admin → Full access
- User → Limited access (own files only)

Permissions:
- Upload file
- Delete own file
- Admin can delete any file

## Final Architecture

[ Electron Client ]
        ↓
   HTTP/HTTPS
        ↓
[ Node.js Server ]
   ↓           ↓
[ MongoDB ]  [ File Storage ]