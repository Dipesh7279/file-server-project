# 📧 SMTP EMAIL CONFIGURATION GUIDE

## What is SMTP?

**SMTP** = Simple Mail Transfer Protocol

It's a system that allows your application to **send emails** through an email server.

---

## What is `SMTP_HOST=smtp.gmail.com`?

This tells your FileServer where to send emails FROM.

```
SMTP_HOST=smtp.gmail.com
         ↑
      Email server address (Gmail's server)
```

---

## When is Email Used in FileServer?

Your FileServer uses email for:

| Feature | When | What Gets Sent |
|---------|------|----------------|
| **Email Verification** | User registers | Verification code (6 digits) |
| **Password Reset** | User clicks "Forgot Password" | Reset link |
| **Password Change Confirmation** | After password change | Confirmation email |
| **File Sharing Notification** | File shared with someone | "You've been shared a file" |

---

## Email Configuration in .env

**Location**: `server/.env`

```bash
# Email Configuration (for password reset)
SMTP_HOST=smtp.gmail.com           # Email server
SMTP_PORT=587                      # Server port
SMTP_USER=your-email@gmail.com     # Your Gmail address
SMTP_PASS=your-app-password        # Gmail app password (NOT regular password!)
EMAIL_FROM=noreply@fileserver.com  # Sender name
```

---

## How to Set Up Gmail SMTP

### ✅ Step 1: Enable 2-Factor Authentication

1. Go to: https://myaccount.google.com
2. Click **Security** (left menu)
3. Find **2-Step Verification**
4. Click **Enable** and follow steps

### ✅ Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select:
   - **App**: Mail
   - **Device**: Windows PC (or your device)
3. Click **Generate**
4. Copy the 16-character password

### ✅ Step 3: Update .env File

```bash
# server/.env

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    # Paste the 16-char app password here
EMAIL_FROM=noreply@fileserver.com
```

**Important**: Use the **app password**, NOT your regular Gmail password!

---

## Configuration for Other Email Providers

### Outlook/Office 365
```bash
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
```

### SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx...  # SendGrid API key
EMAIL_FROM=your-email@sendgrid.com
```

### AWS SES
```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-aws-ses-user
SMTP_PASS=your-aws-ses-password
EMAIL_FROM=noreply@yourdomain.com
```

### Your Own Email Server
```bash
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_USER=your-email@yourdomain.com
SMTP_PASS=your-password
EMAIL_FROM=noreply@yourdomain.com
```

---

## Testing Email Configuration

### ✅ Test 1: Verify .env is Correct

**File**: `server/.env`

```bash
# Check these values:
SMTP_HOST=smtp.gmail.com          ✅ Should match your provider
SMTP_PORT=587                     ✅ Should be 587 (TLS) or 465 (SSL)
SMTP_USER=your-email@gmail.com    ✅ Should be your email
SMTP_PASS=xxxx xxxx xxxx xxxx     ✅ Should be app password (not regular password)
EMAIL_FROM=noreply@fileserver.com ✅ Can be any name
```

### ✅ Test 2: Create Test Email Script

Create `test-email.js` in server folder:

```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Test connection
console.log('🔄 Testing SMTP connection...');
console.log('Host:', process.env.SMTP_HOST);
console.log('Port:', process.env.SMTP_PORT);
console.log('User:', process.env.SMTP_USER);

transporter.verify((error, success) => {
  if (error) {
    console.error('❌ SMTP Connection Failed:', error.message);
    process.exit(1);
  } else {
    console.log('✅ SMTP Connection Successful!');
    
    // Send test email
    console.log('\n📧 Sending test email...');
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // Send to yourself
      subject: 'FileServer Email Test',
      text: 'This is a test email from FileServer.',
      html: `<h2>FileServer Email Configuration Test</h2>
             <p>✅ If you received this email, your SMTP is configured correctly!</p>
             <p><strong>Host:</strong> ${process.env.SMTP_HOST}</p>
             <p><strong>Port:</strong> ${process.env.SMTP_PORT}</p>
             <p><strong>Sender:</strong> ${process.env.EMAIL_FROM || process.env.SMTP_USER}</p>`
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Email Send Failed:', error.message);
        process.exit(1);
      } else {
        console.log('✅ Test Email Sent Successfully!');
        console.log('Response:', info.response);
        process.exit(0);
      }
    });
  }
});
```

### ✅ Test 3: Run the Test Script

```bash
cd server
npm install nodemailer  # If not already installed
node test-email.js
```

**Expected Output if Working:**
```
🔄 Testing SMTP connection...
Host: smtp.gmail.com
Port: 587
User: your-email@gmail.com
✅ SMTP Connection Successful!

📧 Sending test email...
✅ Test Email Sent Successfully!
Response: 250 2.0.0 OK ...
```

---

## Common Email Errors & Fixes

### 1. "Invalid login: 535-5.7.8 Username and password not accepted"

**Problem**: Wrong email or password

**Solution**:
```bash
# 1. For Gmail: Use APP PASSWORD, not regular password
#    Generate from: https://myaccount.google.com/apppasswords
# 2. Check SMTP_USER is correct
# 3. Check SMTP_PASS has no extra spaces
```

### 2. "Connect ETIMEDOUT"

**Problem**: Cannot reach email server

**Solution**:
```bash
# 1. Verify SMTP_HOST is correct
# 2. Check port (usually 587 for TLS)
# 3. Check firewall allows outgoing port 587
# 4. Try pinging the server:
ping smtp.gmail.com  # Windows PowerShell
```

### 3. "550 5.1.1 The email account that you tried to reach does not exist"

**Problem**: Invalid sender email

**Solution**:
```bash
# EMAIL_FROM should exist or be generic name
# For Gmail: Must match SMTP_USER
EMAIL_FROM=your-email@gmail.com  # ✅ Correct
# OR use generic name:
EMAIL_FROM=FileServer <noreply@fileserver.com>  # ✅ Also correct
```

### 4. "Authentication failed"

**Problem**: 2FA not enabled or app password not generated

**Solution** (Gmail only):
```bash
# 1. Enable 2-Factor Auth: https://myaccount.google.com
# 2. Generate App Password: https://myaccount.google.com/apppasswords
# 3. Use the 16-character password in .env
# 4. Do NOT use your regular Gmail password
```

### 5. "Timeout waiting for 220 response"

**Problem**: Server not responding

**Solution**:
```bash
# 1. Check SMTP_HOST is correct
# 2. Verify SMTP_PORT is correct (usually 587)
# 3. Check your internet connection
# 4. Try different provider (SendGrid, AWS SES)
```

---

## How FileServer Uses Email

### Registration Flow
```
User clicks Register
  ↓
Enters email address
  ↓
FileServer sends verification code
  ↓
User receives email with code
  ↓
User enters code
  ↓
Account verified ✅
```

### Password Reset Flow
```
User clicks "Forgot Password"
  ↓
Enters email address
  ↓
FileServer sends reset link
  ↓
User receives email with link
  ↓
User clicks link
  ↓
Enters new password
  ↓
Password reset ✅
```

---

## Complete .env Example

```bash
# ==========================================
# EMAIL CONFIGURATION
# ==========================================

# Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    # 16-char app password
EMAIL_FROM=noreply@fileserver.com

# OR Outlook
# SMTP_HOST=smtp-mail.outlook.com
# SMTP_PORT=587
# SMTP_USER=your-email@outlook.com
# SMTP_PASS=your-password
# EMAIL_FROM=noreply@fileserver.com

# OR SendGrid
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASS=SG.xxxxx...
# EMAIL_FROM=your-email@sendgrid.com
```

---

## Testing in FileServer Application

### ✅ Test Email Verification

1. Start FileServer:
   ```bash
   cd server
   npm start
   ```

2. Open client GUI (Electron)

3. Click "Register"

4. Enter:
   - Username: `testuser`
   - Email: Your real email
   - Password: `Test@123456`

5. Click **Register**

6. Check your email inbox for verification code

7. If you get email → ✅ SMTP is working!

---

## Troubleshooting Checklist

| Check | Action | Status |
|-------|--------|--------|
| .env file exists | Check: `server/.env` | ✅ |
| SMTP_HOST is set | Check: `SMTP_HOST=smtp.gmail.com` | ✅ |
| SMTP_PORT is set | Check: `SMTP_PORT=587` | ✅ |
| SMTP_USER is set | Check: Your email address | ✅ |
| SMTP_PASS is set | Check: App password (not regular password) | ✅ |
| nodemailer installed | Run: `npm list nodemailer` | ✅ |
| Can reach server | Ping: `ping smtp.gmail.com` | ✅ |
| 2FA enabled (Gmail) | Check: https://myaccount.google.com | ✅ |
| App password created (Gmail) | Check: https://myaccount.google.com/apppasswords | ✅ |

---

## Gmail Setup Step-by-Step

### 1️⃣ Enable 2-Step Verification
```
1. Go to https://myaccount.google.com
2. Click "Security" in left menu
3. Find "2-Step Verification"
4. Click "Enable"
5. Follow verification steps
6. Click "Turn on"
```

### 2️⃣ Generate App Password
```
1. Go to https://myaccount.google.com/apppasswords
2. App: Select "Mail"
3. Device: Select your device or "Windows PC"
4. Click "Generate"
5. Copy the 16-character password shown
6. Paste into .env SMTP_PASS
```

### 3️⃣ Update .env
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=xxxx xxxx xxxx xxxx    # The 16-char password
EMAIL_FROM=noreply@fileserver.com
```

### 4️⃣ Test
```bash
cd server
node test-email.js
# Should see: ✅ SMTP Connection Successful!
```

---

## Summary

| Question | Answer |
|----------|--------|
| What is SMTP? | Email sending system |
| What is SMTP_HOST? | Email server address |
| What is used for? | Sending verification codes, password resets, notifications |
| How to configure? | 1. Get email (Gmail, Outlook, etc) 2. Generate app password 3. Update .env |
| How to test? | Run test-email.js script or register in app |
| Is it required? | Yes, for email verification and password reset |

---

**Your FileServer email is now configured and tested! 📧✅**
