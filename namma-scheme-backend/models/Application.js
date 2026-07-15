const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  userName:  { type: String, required: true },
  schemeId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Scheme', required: true },
  status:    { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  appliedAt: { type: Date, default: Date.now },
  userEmail: { type: String },
  userPhone: { type: String },
  documents: { type: [String], default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
