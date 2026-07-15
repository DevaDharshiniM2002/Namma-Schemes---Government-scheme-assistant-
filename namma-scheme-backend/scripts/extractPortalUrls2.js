const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

// Broader regex — also catches .org.in, .co.in, .net, .org, .in domains
const URL_REGEX = /https?:\/\/(?!.*myscheme)[^\s"')]+/gi;

// Fallback: extract domain-like patterns even without http
const DOMAIN_REGEX = /(?:www\.)?[\w-]+\.(?:gov\.in|nic\.in|org\.in|co\.in|edu\.in|ac\.in|res\.in|net\.in)[^\s"'))]*/gi;

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const schemes = await Scheme.find({ portal_url: { $in: [null, ''] } }).lean();
  console.log(`Found ${schemes.length} schemes without portal_url`);

  let updated = 0, noUrl = 0;

  for (const s of schemes) {
    const text = [
      Array.isArray(s.how_to_apply) ? s.how_to_apply.join(' ') : s.how_to_apply,
      s.description,
      s.application
    ].filter(Boolean).join(' ');

    // Try full URL first
    const urlMatches = text.match(URL_REGEX);
    let portal_url = null;

    if (urlMatches?.length) {
      const govUrl = urlMatches.find(u => /\.gov\.in|\.nic\.in/.test(u));
      portal_url = (govUrl || urlMatches[0]).replace(/[.,);]+$/, '');
    } else {
      // Fallback: bare domain pattern → prepend https://
      const domainMatches = text.match(DOMAIN_REGEX);
      if (domainMatches?.length) {
        const raw = domainMatches[0].replace(/[.,);]+$/, '');
        portal_url = raw.startsWith('http') ? raw : 'https://' + raw;
      }
    }

    if (!portal_url) { noUrl++; continue; }

    await Scheme.updateOne({ _id: s._id }, { $set: { portal_url } });
    updated++;
    console.log(`[${updated}] ${s.scheme_name.slice(0, 60)} → ${portal_url}`);
  }

  console.log(`\nDone! Updated ${updated} | No URL found: ${noUrl}`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
