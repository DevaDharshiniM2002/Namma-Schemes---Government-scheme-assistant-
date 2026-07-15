const express = require('express');
const router  = express.Router();
const jwt     = require('jsonwebtoken');
const User    = require('../models/User');
const Notification = require('../models/Notification');
const { notifyNewScheme, notifyDeadlines, notifyMissed } = require('../services/notificationService');
const { sendSMS } = require('../services/smsService');

function auth(req, res, next) {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET || 'secret').userId;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}

// PUT /api/notifications/preferences
// Body: { smsEnabled: true, notifyCategories: ['Education','Agriculture'] }
router.put('/preferences', auth, async (req, res) => {
  try {
    const { smsEnabled, notifyCategories } = req.body;
    const update = {};
    if (smsEnabled !== undefined)        update.smsEnabled       = smsEnabled;
    if (Array.isArray(notifyCategories)) update.notifyCategories = notifyCategories;
    const user = await User.findByIdAndUpdate(req.userId, { $set: update }, { new: true }).select('-password');
    res.json({ success: true, smsEnabled: user.smsEnabled, notifyCategories: user.notifyCategories });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// GET /api/notifications/history
router.get('/history', auth, async (req, res) => {
  try {
    const logs = await Notification.find({ userId: req.userId })
      .sort({ sentAt: -1 }).limit(20).lean();
    res.json({ success: true, data: logs });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/notifications/test-sms
// Sends a test SMS to the user's registered phone
router.post('/test-sms', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user?.phone) return res.status(400).json({ message: 'No phone number on profile' });
    const result = await sendSMS(user.phone, `Hi ${user.name}, SMS notifications are active on Namma Scheme!`);
    res.json({ success: result.success, reason: result.reason });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// POST /api/notifications/trigger/:type  (admin/dev use)
// type: new_scheme | deadlines | missed
router.post('/trigger/:type', auth, async (req, res) => {
  try {
    const { type } = req.params;
    if (type === 'new_scheme') {
      const Scheme = require('../models/Scheme');
      const scheme = await Scheme.findOne();
      if (!scheme) return res.status(404).json({ message: 'No schemes in DB' });
      await notifyNewScheme(scheme);
      return res.json({ success: true, ran: 'new_scheme', scheme: scheme.scheme_name });
    }
    if (type === 'deadlines') { await notifyDeadlines(); return res.json({ success: true, ran: 'deadlines' }); }
    if (type === 'missed')    { await notifyMissed();    return res.json({ success: true, ran: 'missed' }); }
    res.status(400).json({ message: 'Unknown type. Use: new_scheme | deadlines | missed' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
