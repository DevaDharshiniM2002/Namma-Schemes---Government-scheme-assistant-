const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

// Admin middleware
function adminMiddleware(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    if (decoded.role !== 'admin' && decoded.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    req.adminId = decoded.adminId;
    req.role = decoded.role;
    next();
  } catch (e) {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Admin Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    let admin = await Admin.findOne({ $or: [{ email }, { username }] });
    if (admin) {
      return res.status(400).json({ message: 'Admin already exists' });
    }

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    admin = new Admin({
      username,
      email,
      password: hashedPassword,
      role: role || 'admin',
      permissions: ['view_schemes', 'view_users', 'view_applications']
    });

    await admin.save();

    const payload = { adminId: admin._id, role: admin.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({ 
      token, 
      admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { adminId: admin._id, role: admin.role };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ 
      token, 
      admin: { id: admin._id, username: admin.username, email: admin.email, role: admin.role }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Admin Profile
router.get('/profile', adminMiddleware, async (req, res) => {
  try {
    const admin = await Admin.findById(req.adminId).select('-password');
    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Users
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const users = await User.find().select('-password').limit(100);
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Schemes
router.get('/schemes', adminMiddleware, async (req, res) => {
  try {
    const Scheme = require('../models/Scheme');
    const schemes = await Scheme.find().limit(100);
    res.json({ count: schemes.length, schemes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get All Applications
router.get('/applications', adminMiddleware, async (req, res) => {
  try {
    const Application = require('../models/Application');
    const applications = await Application.find().limit(100);
    res.json({ count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get Statistics
router.get('/stats', adminMiddleware, async (req, res) => {
  try {
    const User = require('../models/User');
    const Scheme = require('../models/Scheme');
    const Application = require('../models/Application');

    const totalUsers = await User.countDocuments();
    const totalSchemes = await Scheme.countDocuments();
    const totalApplications = await Application.countDocuments();

    res.json({
      totalUsers,
      totalSchemes,
      totalApplications,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
