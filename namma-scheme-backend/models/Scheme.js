const mongoose = require('mongoose');

const SchemeSchema = new mongoose.Schema({
  scheme_name:  { type: String },
  slug:         { type: String },
  details:      { type: String },   // description/about
  benefits:     { type: String },   // raw text
  eligibility:  { type: String },   // raw text
  application:  { type: String },   // how to apply
  documents:    { type: String },   // documents required
  level:        { type: String },   // Central / State
  schemeCategory: { type: String },
  tags:         { type: String },

  // legacy fields (kept for backward compat)
  category:         { type: String },
  description:      { type: String },
  portal_url:       { type: String },
  officialLink:     { type: String },
  apply_link:       { type: String },
}, { strict: false, timestamps: true });

module.exports = mongoose.model('Scheme', SchemeSchema);
