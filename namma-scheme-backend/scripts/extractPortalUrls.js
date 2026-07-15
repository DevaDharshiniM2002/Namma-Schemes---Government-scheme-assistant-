require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

const URL_REGEX = /https?:\/\/(?!.*myscheme)[^\s"')]+/gi;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const schemes = await Scheme.find({ portal_url: { $in: [null, ''] } }).lean();
  console.log(`Found ${schemes.length} schemes without portal_url`);

  let updated = 0;
  for (const s of schemes) {
    const text = [s.application, Array.isArray(s.how_to_apply) ? s.how_to_apply.join(' ') : s.how_to_apply, s.description].filter(Boolean).join(' ');
    const matches = text.match(URL_REGEX);
    if (!matches?.length) continue;

    // Prefer .gov.in or .nic.in URLs
    const govUrl = matches.find(u => /\.gov\.in|\.nic\.in/.test(u));
    const portal_url = (govUrl || matches[0]).replace(/[.,)]+$/, '');

    await Scheme.updateOne({ _id: s._id }, { $set: { portal_url } });
    updated++;
    console.log(`[${updated}] ${s.scheme_name.slice(0, 60)} → ${portal_url}`);
  }

  console.log(`\nDone! Updated ${updated} schemes with portal_url`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
