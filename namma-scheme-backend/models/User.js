const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true },
  password:   { type: String, required: true },
  age:        { type: Number },
  gender:     { type: String },
  phone:      { type: String },
  state:      { type: String },
  category:   { type: String },
  occupation: { type: String },
  income:     { type: String },
  education:  { type: String },
  address:    { type: String },
  photo:      { type: String },
  appliedSchemes:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' }],
  viewedSchemes:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'Scheme' }],
  smsEnabled:        { type: Boolean, default: false },
  notifyCategories:  [{ type: String }]  // e.g. ['Education','Agriculture']
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
