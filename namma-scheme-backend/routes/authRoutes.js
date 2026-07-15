const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many login attempts, please try again after 15 minutes' }
});

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

function validatePassword(password) {
  if (!PASSWORD_REGEX.test(password)) {
    return 'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';
  }
  return null;
}

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, age, gender, phone, state, category } = req.body;
    
    // Check if user exists
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Validate password strength
    const pwError = validatePassword(password);
    if (pwError) return res.status(400).json({ message: pwError });

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name, email, password: hashedPassword, age, gender, phone, state, category
    });

    await user.save();

    // Create token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email }});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Match password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const payload = { userId: user._id };
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, age: user.age, gender: user.gender }});
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Auth middleware
function authMiddleware(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET || 'secret').userId;
    next();
  } catch (e) {
    return res.status(401).json({ message: e.name === 'TokenExpiredError' ? 'jwt expired' : 'Invalid token' });
  }
}

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password').populate('appliedSchemes');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const { name, phone, age, gender, state, category, occupation, income, education, address, photo } = req.body;
    const updateFields = {};
    if (name       !== undefined) updateFields.name       = name;
    if (phone      !== undefined) updateFields.phone      = phone;
    if (age        !== undefined) updateFields.age        = age;
    if (gender     !== undefined) updateFields.gender     = gender;
    if (state      !== undefined) updateFields.state      = state;
    if (category   !== undefined) updateFields.category   = category;
    if (occupation !== undefined) updateFields.occupation = occupation;
    if (income     !== undefined) updateFields.income     = income;
    if (education  !== undefined) updateFields.education  = education;
    if (address    !== undefined) updateFields.address    = address;
    if (photo      !== undefined) updateFields.photo      = photo;
    const updated = await User.findByIdAndUpdate(
      req.userId,
      { $set: updateFields },
      { new: true }
    ).select('-password -appliedSchemes');
    res.json(updated);
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
