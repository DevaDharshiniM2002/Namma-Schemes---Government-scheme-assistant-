const User = require('../models/User');
const Notification = require('../models/Notification');
const Scheme = require('../models/Scheme');
const { sendSMS } = require('./smsService');

const MAX_PER_DAY = 3;
const DEDUP_DAYS  = 7;

// Check how many SMS sent to user today
async function todayCount(userId) {
  const start = new Date(); start.setHours(0, 0, 0, 0);
  return Notification.countDocuments({ userId, sentAt: { $gte: start } });
}

// Check if this exact notification was already sent within DEDUP_DAYS
async function alreadySent(userId, schemeId, type) {
  const since = new Date(Date.now() - DEDUP_DAYS * 24 * 60 * 60 * 1000);
  return Notification.exists({ userId, schemeId, type, sentAt: { $gte: since } });
}

async function deliver(user, schemeId, type, message) {
  if (!user.phone) return;
  if (await todayCount(user._id) >= MAX_PER_DAY) return;
  if (await alreadySent(user._id, schemeId, type)) return;

  const result = await sendSMS(user.phone, message);
  await Notification.create({
    userId: user._id,
    schemeId,
    type,
    message,
    delivered: result.success
  });
}

// ── 1. NEW SCHEME ALERT ──────────────────────────────────────────────────────
// Call this whenever a new scheme is inserted
async function notifyNewScheme(scheme) {
  const users = await User.find({ smsEnabled: true, phone: { $exists: true, $ne: '' } });
  for (const user of users) {
    // Match if user has no category preference OR scheme matches one of their categories
    const cats = user.notifyCategories || [];
    const schemeText = `${scheme.category} ${scheme.scheme_name}`.toLowerCase();
    const matches = cats.length === 0 || cats.some(c => schemeText.includes(c.toLowerCase()));
    if (!matches) continue;

    const msg = `New scheme available: ${scheme.scheme_name}. Check now on Namma Scheme!`;
    await deliver(user, scheme._id, 'new_scheme', msg);
  }
  console.log(`[Notify] New scheme alerts dispatched for: ${scheme.scheme_name}`);
}

// ── 2. DEADLINE REMINDER ─────────────────────────────────────────────────────
// Runs daily — finds schemes with deadline within 3 days
async function notifyDeadlines() {
  const now   = new Date();
  const in3   = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  // Schemes that have a deadline field set between now and 3 days from now
  const schemes = await Scheme.find({
    deadline: { $gte: now, $lte: in3 }
  }).lean();


  if (!schemes.length) {
    console.log('[Notify] No upcoming deadlines in next 3 days');
    return;
  }

  const users = await User.find({ smsEnabled: true, phone: { $exists: true, $ne: '' } });

  for (const scheme of schemes) {
    const deadlineStr = new Date(scheme.deadline).toLocaleDateString('en-IN');
    const msg = `Reminder: Last date to apply for ${scheme.scheme_name} is ${deadlineStr}. Apply soon on Namma Scheme.`;

    for (const user of users) {
      const cats = user.notifyCategories || [];
      const schemeText = `${scheme.category} ${scheme.scheme_name}`.toLowerCase();
      const matches = cats.length === 0 || cats.some(c => schemeText.includes(c.toLowerCase()));
      if (matches) await deliver(user, scheme._id, 'deadline', msg);
    }
  }
  console.log(`[Notify] Deadline reminders sent for ${schemes.length} scheme(s)`);
}

// ── 3. MISSED ALERT ──────────────────────────────────────────────────────────
// Runs weekly — finds users who haven't viewed/applied eligible schemes
async function notifyMissed() {
  const users = await User.find({ smsEnabled: true, phone: { $exists: true, $ne: '' } });

  for (const user of users) {
    const cats = user.notifyCategories || [];
    if (!cats.length) continue;

    const pattern = cats.join('|');
    const eligible = await Scheme.find({
      category: { $regex: pattern, $options: 'i' }
    }).limit(5).lean();

    const viewed  = (user.viewedSchemes  || []).map(id => id.toString());
    const applied = (user.appliedSchemes || []).map(id => id.toString());

    const missed = eligible.filter(s =>
      !viewed.includes(s._id.toString()) && !applied.includes(s._id.toString())
    );

    for (const scheme of missed.slice(0, 1)) {  // max 1 missed alert per run
      const msg = `You may miss this scheme: ${scheme.scheme_name}. Check eligibility now on Namma Scheme.`;
      await deliver(user, scheme._id, 'missed', msg);
    }
  }
  console.log('[Notify] Missed alerts job complete');
}

module.exports = { notifyNewScheme, notifyDeadlines, notifyMissed };
