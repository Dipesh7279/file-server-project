/**
 * FIX SCRIPT: Update all admin users to 1GB storage quota
 * 
 * This script:
 * 1. Connects to MongoDB
 * 2. Updates ALL admin users (role='admin') to 1GB quota
 * 3. Verifies the changes
 * 4. Shows before/after
 */

const mongoose = require('mongoose');
require('dotenv').config();

const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  role: { type: String, default: 'user' },
  storageQuota: Number,
  storageUsed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const ADMIN_QUOTA = 1073741824; // 1GB = 1024*1024*1024
const USER_QUOTA = 104857600;   // 100MB

async function fixAdminQuota() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/fileserver';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // BEFORE: Check current quotas
    console.log('📊 BEFORE FIX:');
    const adminsBefore = await User.find({ role: 'admin' });
    adminsBefore.forEach(user => {
      const quotaGB = (user.storageQuota / (1024 * 1024 * 1024)).toFixed(3);
      console.log(`  👑 ${user.username}: ${quotaGB} GB (${user.storageQuota} bytes)`);
    });

    // FIX: Update admin users
    console.log('\n🔧 UPDATING ADMINS TO 1GB...');
    const adminUpdate = await User.updateMany(
      { role: 'admin' },
      { $set: { storageQuota: ADMIN_QUOTA } }
    );
    console.log(`✅ Updated ${adminUpdate.modifiedCount} admin users`);

    // FIX: Ensure regular users are 100MB
    console.log('\n🔧 UPDATING USERS TO 100MB...');
    const userUpdate = await User.updateMany(
      { role: 'user' },
      { $set: { storageQuota: USER_QUOTA } }
    );
    console.log(`✅ Updated ${userUpdate.modifiedCount} regular users`);

    // AFTER: Verify all quotas
    console.log('\n📊 AFTER FIX:');
    const adminsAfter = await User.find({ role: 'admin' });
    const usersAfter = await User.find({ role: 'user' });

    console.log('\n👑 ADMIN USERS:');
    adminsAfter.forEach(user => {
      const quotaGB = (user.storageQuota / (1024 * 1024 * 1024)).toFixed(3);
      const usedMB = (user.storageUsed / (1024 * 1024)).toFixed(2);
      console.log(`  ✓ ${user.username}: ${quotaGB} GB | Used: ${usedMB} MB`);
    });

    console.log('\n👤 REGULAR USERS:');
    usersAfter.forEach(user => {
      const quotaMB = (user.storageQuota / (1024 * 1024)).toFixed(0);
      const usedMB = (user.storageUsed / (1024 * 1024)).toFixed(2);
      console.log(`  ✓ ${user.username}: ${quotaMB} MB | Used: ${usedMB} MB`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✅ ALL QUOTAS FIXED SUCCESSFULLY!');
    console.log('='.repeat(50));

    await mongoose.disconnect();
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    process.exit(1);
  }
}

fixAdminQuota();
