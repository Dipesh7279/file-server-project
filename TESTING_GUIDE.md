# FileServer - Comprehensive Testing Guide

## 🧪 Testing Strategy

This guide covers complete testing of the FileServer project focusing on quality and reliability.

### Testing Phases
1. **Unit Tests** - Individual functions
2. **Integration Tests** - API endpoints
3. **E2E Tests** - User workflows
4. **Manual Tests** - Critical paths

---

## 📋 Setup Testing Environment

### Install Testing Dependencies

```bash
# Backend testing
cd server
npm install --save-dev jest supertest @testing-library/node

# Frontend testing
cd client
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# Global test runner
npm install -g jest
```

### Create Jest Configuration

**server/jest.config.js**
```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  coveragePathIgnorePatterns: ['/node_modules/'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'middleware/**/*.js',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

---

## 🔧 Backend Testing

### 1. Unit Tests for Controllers

**server/__tests__/authController.test.js**
```javascript
const authController = require('../controllers/authController');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

jest.mock('../models/User');

describe('Auth Controller', () => {
  
  describe('Register', () => {
    test('should register user with valid data', async () => {
      const mockUser = { _id: '123', email: 'test@test.com' };
      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      const req = {
        body: {
          username: 'testuser',
          email: 'test@test.com',
          password: 'Test123!@#',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    test('should reject duplicate email', async () => {
      User.findOne.mockResolvedValue({ email: 'test@test.com' });

      const req = {
        body: {
          email: 'test@test.com',
          password: 'Test123!@#',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe('Login', () => {
    test('should login with valid credentials', async () => {
      const mockUser = {
        _id: '123',
        email: 'test@test.com',
        password: await require('bcryptjs').hash('Test123!@#', 10),
      };
      User.findOne.mockResolvedValue(mockUser);

      const req = {
        body: {
          username: 'testuser',
          password: 'Test123!@#',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should reject invalid password', async () => {
      User.findOne.mockResolvedValue(null);

      const req = {
        body: {
          username: 'testuser',
          password: 'WrongPassword',
        },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      };

      await authController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
```

### 2. Integration Tests for API Endpoints

**server/__tests__/api.test.js**
```javascript
const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const mongoose = require('mongoose');

describe('FileServer API', () => {
  let token;
  let userId;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_MONGODB_URI);
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  describe('Authentication Endpoints', () => {
    
    test('POST /auth/register - should register new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'TestPass123!',
        });

      expect(res.status).toBe(201);
      expect(res.body.user).toHaveProperty('_id');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
    });

    test('POST /auth/login - should login successfully', async () => {
      // First create user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'logintest',
          email: 'login@example.com',
          password: 'TestPass123!',
        });

      // Then login
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'logintest',
          password: 'TestPass123!',
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      token = res.body.accessToken;
      userId = res.body.user._id;
    });

    test('POST /auth/login - should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'WrongPass',
        });

      expect(res.status).toBe(401);
    });
  });

  describe('File Endpoints', () => {
    
    test('GET /files - should list files for authenticated user', async () => {
      const res = await request(app)
        .get('/api/files')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.files)).toBe(true);
    });

    test('POST /files/upload - should upload file', async () => {
      const res = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${token}`)
        .field('name', 'testfile.txt')
        .attach('file', Buffer.from('test content'), 'test.txt');

      expect(res.status).toBe(201);
      expect(res.body.file).toHaveProperty('_id');
      expect(res.body.file.name).toBe('testfile.txt');
    });

    test('GET /files/:id/download - should download file', async () => {
      // Create file first
      const uploadRes = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('download test'), 'download.txt');

      const fileId = uploadRes.body.file._id;

      // Download file
      const res = await request(app)
        .get(`/api/files/${fileId}/download`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    test('DELETE /files/:id - should delete file', async () => {
      // Create file first
      const uploadRes = await request(app)
        .post('/api/files/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', Buffer.from('delete test'), 'delete.txt');

      const fileId = uploadRes.body.file._id;

      // Delete file
      const res = await request(app)
        .delete(`/api/files/${fileId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Folder Endpoints', () => {
    
    test('POST /folders - should create folder', async () => {
      const res = await request(app)
        .post('/api/folders')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test Folder' });

      expect(res.status).toBe(201);
      expect(res.body.folder.name).toBe('Test Folder');
    });

    test('GET /folders - should list folders', async () => {
      const res = await request(app)
        .get('/api/folders')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.folders)).toBe(true);
    });
  });

  describe('Admin Endpoints', () => {
    
    test('GET /admin/system-stats - should get stats for admin', async () => {
      const res = await request(app)
        .get('/api/admin/system-stats')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.stats).toHaveProperty('totalUsers');
      expect(res.body.stats).toHaveProperty('totalFiles');
    });
  });
});
```

### 3. Run Backend Tests

```bash
cd server

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test authController.test.js

# Run in watch mode
npm test -- --watch
```

---

## 🎨 Frontend Testing

### 1. Component Unit Tests

**client/renderer/components/__tests__/LoginPage.test.jsx**
```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../LoginPage';

describe('LoginPage Component', () => {
  
  test('should render login form', () => {
    render(<LoginPage onLoginSuccess={() => {}} />);
    
    expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('should show email error for invalid email', () => {
    render(<LoginPage onLoginSuccess={() => {}} />);
    
    const emailInput = screen.getByPlaceholderText(/email/i);
    fireEvent.change(emailInput, { target: { value: 'invalid' } });
    fireEvent.blur(emailInput);

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  test('should show password error for weak password', () => {
    render(<LoginPage onLoginSuccess={() => {}} />);
    
    const passwordInput = screen.getByPlaceholderText(/password/i);
    fireEvent.change(passwordInput, { target: { value: 'weak' } });
    fireEvent.blur(passwordInput);

    expect(screen.getByText(/password must/i)).toBeInTheDocument();
  });
});
```

### 2. Run Frontend Tests

```bash
cd client

# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test LoginPage.test.jsx

# Run in watch mode
npm test -- --watch
```

---

## 🔄 E2E Testing (Cypress)

### Setup E2E Tests

```bash
cd client
npm install --save-dev cypress

# Initialize cypress
npx cypress open
```

**client/cypress/integration/fileserver.spec.js**
```javascript
describe('FileServer E2E Tests', () => {
  
  before(() => {
    cy.visit('http://localhost:3000');
  });

  describe('Authentication Flow', () => {
    
    it('should register new user', () => {
      // Click register tab
      cy.contains('Register').click();

      // Fill form
      cy.get('input[placeholder="Username"]').type('e2euser');
      cy.get('input[placeholder="Email"]').type('e2e@test.com');
      cy.get('input[placeholder="Password"]').type('TestPass123!@#');

      // Submit
      cy.contains('Register').click();

      // Should show success
      cy.contains('Registration successful').should('be.visible');
    });

    it('should login user', () => {
      // Fill login form
      cy.get('input[placeholder="Username"]').type('e2euser');
      cy.get('input[placeholder="Password"]').type('TestPass123!@#');

      // Submit
      cy.contains('Login').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Files').should('be.visible');
    });
  });

  describe('File Operations', () => {
    
    it('should upload file', () => {
      // Click upload button
      cy.contains('📤 Upload').click();

      // Upload file
      cy.get('input[type="file"]').attachFile('test-file.pdf');

      // Should show success
      cy.contains('Upload successful').should('be.visible');
    });

    it('should create folder', () => {
      // Click create folder
      cy.contains('📁 New Folder').click();

      // Enter name
      cy.get('input[placeholder="Folder name"]').type('Test Folder');

      // Submit
      cy.contains('Create').click();

      // Should show folder in list
      cy.contains('Test Folder').should('be.visible');
    });

    it('should download file', () => {
      // Right-click file
      cy.contains('test-file.pdf').rightclick();

      // Click download
      cy.contains('Download').click();

      // File should be downloaded
      cy.readFile('cypress/downloads/test-file.pdf').should('exist');
    });

    it('should delete file', () => {
      // Right-click file
      cy.contains('test-file.pdf').rightclick();

      // Click delete
      cy.contains('Delete').click();

      // Confirm
      cy.contains('Yes, delete').click();

      // Should be gone
      cy.contains('test-file.pdf').should('not.exist');
    });
  });

  describe('File Sharing', () => {
    
    it('should create share link', () => {
      // Right-click file
      cy.contains('document.pdf').rightclick();

      // Click share
      cy.contains('Share').click();

      // Select public
      cy.get('input[value="public"]').click();

      // Create share
      cy.contains('Create Share').click();

      // Should show link
      cy.contains('Share link copied').should('be.visible');
    });
  });

  describe('Admin Functions', () => {
    
    it('should view admin dashboard', () => {
      // Login as admin
      cy.get('input[placeholder="Username"]').type('admin');
      cy.get('input[placeholder="Password"]').type('AdminPassword123!');
      cy.contains('Login').click();

      // Should see admin panel
      cy.contains('⚙️ Admin Dashboard').should('be.visible');

      // Click admin tab
      cy.contains('Admin Dashboard').click();

      // Should show stats
      cy.contains('Total Users').should('be.visible');
      cy.contains('Total Files').should('be.visible');
    });
  });
});
```

### Run E2E Tests

```bash
cd client

# Open Cypress UI
npm run cypress:open

# Run headless
npm run cypress:run

# Run specific spec
npm run cypress:run -- --spec "cypress/integration/fileserver.spec.js"
```

---

## ✅ Manual Testing Checklist

### Authentication
- [ ] Register with valid data
- [ ] Register with duplicate email (should fail)
- [ ] Register with weak password (should fail)
- [ ] Login with correct credentials
- [ ] Login with wrong password (should fail)
- [ ] Logout successfully
- [ ] Token refresh on 401
- [ ] Account lock after 5 failed attempts

### File Operations
- [ ] Upload single file
- [ ] Upload multiple files
- [ ] Upload large file (>500MB)
- [ ] Download file
- [ ] Delete file (should go to trash)
- [ ] Restore from trash
- [ ] Rename file
- [ ] Search files
- [ ] Sort files (by name, size, date)

### Folder Operations
- [ ] Create folder
- [ ] Create nested folder
- [ ] Navigate folders
- [ ] Rename folder
- [ ] Delete folder (with files)
- [ ] Move file to folder

### Sharing
- [ ] Create public share link
- [ ] Create private share link
- [ ] Create protected share (with password)
- [ ] Access shared file
- [ ] Set download limit
- [ ] Set expiration
- [ ] Revoke share link

### Admin Features
- [ ] View all users
- [ ] View user statistics
- [ ] Suspend user
- [ ] Reactivate user
- [ ] View activity logs
- [ ] View system stats
- [ ] Check storage usage

### Performance
- [ ] Upload 10MB file (should be fast)
- [ ] Download 10MB file (should be fast)
- [ ] List 1000 files (should load < 2 sec)
- [ ] Search across 1000 files (should be fast)

### Error Handling
- [ ] Try upload without auth (should fail)
- [ ] Try download non-existent file (should fail)
- [ ] Try delete others' files (should fail)
- [ ] Try admin functions as regular user (should fail)
- [ ] Server down (should show error)

---

## 📊 Test Coverage Goals

| Component | Target | Status |
|-----------|--------|--------|
| Controllers | 80% | 🔄 In Progress |
| Models | 75% | 🔄 In Progress |
| Routes | 85% | 🔄 In Progress |
| Middleware | 90% | 🔄 In Progress |
| Frontend Components | 70% | ⏳ Next |
| API Integration | 80% | ⏳ Next |
| E2E Workflows | 100% | ⏳ Next |

---

## 🚀 Testing Workflow

1. **Write Tests** - Before or with code
2. **Run Tests** - Ensure all pass
3. **Check Coverage** - Aim for 70%+ per file
4. **Manual Test** - Critical paths
5. **Fix Issues** - Update code
6. **Document** - Record results

---

## 📝 Test Report Template

```markdown
# Test Report - [Date]

## Summary
- Tests Run: X
- Tests Passed: X
- Tests Failed: X
- Coverage: X%

## Backend Tests
- Unit Tests: ✅ Passed
- Integration Tests: ✅ Passed
- Coverage: 75%

## Frontend Tests
- Component Tests: ✅ Passed
- Coverage: 65%

## E2E Tests
- Auth Flow: ✅ Passed
- File Operations: ✅ Passed
- Admin Functions: ✅ Passed

## Manual Tests
- Critical Paths: ✅ Passed
- Edge Cases: ✅ Passed
- Performance: ✅ Acceptable

## Issues Found
- [Issue 1]: Description and fix
- [Issue 2]: Description and fix

## Recommendation
✅ Ready for [Production/Next Phase]
```

---

**Testing Phase**: Ready to Begin
**Target Completion**: 2-3 weeks
**Success Criteria**: 70%+ coverage, all manual tests pass
