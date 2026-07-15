const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  schemeId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' },
  type:       { type: String, enum: ['new_scheme', 'deadline', 'missed'], required: true },
  message:    { type: String, required: true },
  sentAt:     { type: Date, default: Date.now },
  delivered:  { type: Boolean, default: false }
}, { timestamps: true });

// Prevent duplicate: same user + scheme + type within 7 days
NotificationSchema.index({ userId: 1, schemeId: 1, type: 1, sentAt: 1 });

module.exports = mongoose.model('Notification', NotificationSchema);
