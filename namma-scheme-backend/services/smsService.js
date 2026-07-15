const https = require('https');

/**
 * Send SMS via Twilio API
 */
async function sendSMS(phone, message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken  = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    console.warn('[SMS] Twilio credentials not set — skipping SMS send');
    return { success: false, reason: 'no_credentials' };
  }

  // Normalize: add +91 for Indian numbers
  const mobile = phone.replace(/\D/g, '').replace(/^(91|0)/, '').slice(-10);
  if (mobile.length !== 10) {
    console.warn(`[SMS] Invalid phone: ${phone}`);
    return { success: false, reason: 'invalid_phone' };
  }
  const toNumber = `+91${mobile}`;

  const payload = new URLSearchParams({
    To:   toNumber,
    From: fromNumber,
    Body: message
  }).toString();

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.twilio.com',
      path:     `/2010-04-01/Accounts/${accountSid}/Messages.json`,
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization':  'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64')
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.sid) {
            console.log(`[SMS] Sent to ${toNumber}: "${message.slice(0, 50)}..."`);
            resolve({ success: true, sid: json.sid });
          } else {
            console.error('[SMS] Twilio error:', json.message);
            resolve({ success: false, reason: json.message });
          }
        } catch {
          resolve({ success: false, reason: 'parse_error' });
        }
      });
    });

    req.on('error', (e) => {
      console.error('[SMS] Request error:', e.message);
      resolve({ success: false, reason: e.message });
    });

    req.write(payload);
    req.end();
  });
}

module.exports = { sendSMS };
