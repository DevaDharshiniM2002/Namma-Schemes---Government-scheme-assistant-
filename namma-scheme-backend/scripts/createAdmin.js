const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const Admin = require('../models/Admin');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let admin = await Admin.findOne({ email: 'admin@nammascheme.com' });
    if (admin) {
      console.log('Admin already exists');
      await mongoose.disconnect();
      return;
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    admin = new Admin({
      username: 'admin',
      email: 'admin@nammascheme.com',
      password: hashedPassword,
      role: 'superadmin',
      permissions: ['view_schemes', 'view_users', 'view_applications', 'manage_admins']
    });

    await admin.save();
    console.log('✓ Admin created successfully!');
    console.log('Email: admin@nammascheme.com');
    console.log('Password: Admin@123');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

createAdmin();
