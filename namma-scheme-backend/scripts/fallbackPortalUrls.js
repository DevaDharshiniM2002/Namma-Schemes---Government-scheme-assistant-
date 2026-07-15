const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const Scheme = require('../models/Scheme');

// Category → best fallback portal
const CATEGORY_FALLBACK = {
  'scholarship': 'https://scholarships.gov.in',
  'education': 'https://scholarships.gov.in',
  'agriculture': 'https://agricoop.nic.in',
  'farming': 'https://agricoop.nic.in',
  'health': 'https://nhp.gov.in',
  'housing': 'https://pmayg.nic.in',
  'skill': 'https://www.pmkvyofficial.org',
  'employment': 'https://www.ncs.gov.in',
  'women': 'https://wcd.nic.in',
  'pension': 'https://nsap.nic.in',
  'disability': 'https://disabilityaffairs.gov.in',
  'minority': 'https://minorityaffairs.gov.in',
  'tribal': 'https://tribal.nic.in',
  'sc': 'https://socialjustice.gov.in',
  'st': 'https://tribal.nic.in',
  'obc': 'https://socialjustice.gov.in',
  'business': 'https://msme.gov.in',
  'msme': 'https://msme.gov.in',
  'startup': 'https://www.startupindia.gov.in',
  'fisheries': 'https://dof.gov.in',
  'animal': 'https://dahd.nic.in',
  'social': 'https://socialjustice.gov.in',
  'labour': 'https://labour.gov.in',
  'research': 'https://dst.gov.in',
  'science': 'https://dst.gov.in',
  'sports': 'https://yas.nic.in',
  'culture': 'https://indiaculture.gov.in',
  'transport': 'https://morth.nic.in',
  'energy': 'https://mnre.gov.in',
  'water': 'https://jaljeevanmission.gov.in',
  'food': 'https://dfpd.gov.in',
  'insurance': 'https://jansuraksha.gov.in',
  'loan': 'https://www.mudra.org.in',
  'finance': 'https://www.india.gov.in',
};

function getFallbackUrl(scheme) {
  const text = `${scheme.scheme_name} ${scheme.category || ''}`.toLowerCase();
  for (const [key, url] of Object.entries(CATEGORY_FALLBACK)) {
    if (text.includes(key)) return url;
  }
  return 'https://www.india.gov.in';
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const schemes = await Scheme.find({ portal_url: { $in: [null, ''] } }, { scheme_name: 1, category: 1 }).lean();
  console.log(`Applying fallback URLs to ${schemes.length} schemes`);

  let updated = 0;
  for (const s of schemes) {
    const portal_url = getFallbackUrl(s);
    await Scheme.updateOne({ _id: s._id }, { $set: { portal_url } });
    updated++;
    if (updated % 100 === 0) console.log(`[${updated}/${schemes.length}] ${s.scheme_name.slice(0, 50)} → ${portal_url}`);
  }

  console.log(`\nDone! Applied fallback URLs to ${updated} schemes`);
  await mongoose.disconnect();
}

run().catch(e => { console.error(e); process.exit(1); });
