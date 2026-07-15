const express = require('express');
const router = express.Router();

const LANG_NAMES = {
  en: 'English', hi: 'Hindi', ta: 'Tamil'
};

function getFallbackReply(message, language) {
  const msg = (message || '').toLowerCase();
  if (language === 'ta') {
    if (msg.includes('eligib') || msg.includes('தகுதி')) return 'தகுதி சரிபார்க்க, மேலே உள்ள Eligibility Checker பக்கத்திற்கு செல்லுங்கள். உங்கள் வயது, வருமானம், மாநிலம் கொடுத்தால் பொருத்தமான திட்டங்கள் காட்டப்படும்.';
    if (msg.includes('apply') || msg.includes('விண்ணப்ப')) return 'விண்ணப்பிக்க: 1. Register செய்யுங்கள் 2. Login செய்யுங்கள் 3. Browse Schemes போய் திட்டம் தேர்வு செய்யுங்கள் 4. Apply Now கிளிக் செய்யுங்கள்.';
    if (msg.includes('scheme') || msg.includes('திட்ட')) return 'Browse Schemes பக்கத்தில் 386 அரசு திட்டங்கள் உள்ளன. Category மூலம் தேடலாம் - Health, Education, Agriculture, Employment போன்றவை.';
    if (msg.includes('document') || msg.includes('ஆவண')) return 'பொதுவாக தேவையான ஆவணங்கள்: Aadhaar Card, Income Certificate, Caste Certificate, Bank Passbook, Passport Photo.';
    return 'நான் உங்களுக்கு உதவ தயாராக இருக்கிறேன். திட்டங்கள் தேட Browse Schemes போகலாம். தகுதி சரிபார்க்க Eligibility Checker உபயோகிக்கலாம்.';
  }
  if (language === 'hi') {
    if (msg.includes('eligib') || msg.includes('पात्रता')) return 'पात्रता जांचने के लिए Eligibility Checker पेज पर जाएं। अपनी उम्र, आय और राज्य दर्ज करें।';
    if (msg.includes('apply') || msg.includes('आवेदन')) return 'आवेदन करने के लिए: 1. Register करें 2. Login करें 3. Browse Schemes में जाएं 4. Apply Now पर क्लिक करें।';
    if (msg.includes('scheme') || msg.includes('योजना')) return 'Browse Schemes में 386 सरकारी योजनाएं हैं। Health, Education, Agriculture, Employment जैसी categories में खोजें।';
    return 'मैं आपकी मदद के लिए तैयार हूं। योजनाएं देखने के लिए Browse Schemes जाएं।';
  }
  // English fallback
  if (msg.includes('eligib')) return 'To check eligibility, go to the Eligibility Checker page. Enter your age, income, occupation and state to find matching schemes.';
  if (msg.includes('apply')) return 'To apply: 1. Register on the website 2. Login 3. Go to Browse Schemes 4. Select a scheme 5. Click Apply Now 6. Fill details and submit.';
  if (msg.includes('scheme')) return 'Browse Schemes has 386 government schemes. You can filter by category: Health, Education, Agriculture, Employment, Housing, and more.';
  if (msg.includes('document')) return 'Common documents needed: Aadhaar Card, Income Certificate, Caste Certificate (if applicable), Bank Passbook, Passport Photo.';
  if (msg.includes('register') || msg.includes('login')) return 'Click the Register button at the top right to create an account. Then Login to access all features including applying for schemes.';
  return 'I can help you find government schemes, check eligibility, and guide you to apply. Try asking about specific schemes, eligibility criteria, or how to apply.';
}

router.post('/', async (req, res) => {
  try {
    const { message, history = [], language = 'en' } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const langName = LANG_NAMES[language] || 'English';

    const systemPrompt = `You are "Namma Scheme AI Assistant" for the Namma Scheme website, helping Indian citizens find and apply for government schemes.

LANGUAGE RULES:
- The user's selected language is: ${langName} (code: ${language})
- ALWAYS reply in the same language the user writes in.
- Auto-detect the user's language from their message and switch to it.
- Support ONLY Tamil, English, and Hindi.
- If user writes in any other language, reply: "Currently only Tamil, English, and Hindi are supported."
- If user mixes languages, reply in the dominant language.
- For Tamil: use simple spoken Tamil (colloquial), NOT formal or literary Tamil.
  Example: say "நீங்கள் இதுக்கு apply பண்ணலாம்" instead of "தகுதியானவர்கள் விண்ணப்பிக்கலாம்"

SPEECH-FRIENDLY RULES:
- Use simple, short, clear sentences.
- Avoid symbols, emojis, and complex formatting.
- Responses must be easy to read aloud.
- Avoid technical jargon.

YOUR PURPOSE:
1. Help users find suitable government schemes.
2. Check eligibility step by step.
3. Explain how to apply.
4. List required documents.
5. Guide how to use the Namma Scheme website.

RESPONSE STYLE:
- Be polite and helpful.
- Keep answers short and clear.
- Use numbered steps when explaining a process.
- Be extra patient with rural users and first-time internet users.

SCHEME GUIDANCE:
- When user asks about schemes, ask for age, income, category, state if needed.
- Suggest relevant schemes based on their profile.
- For each scheme explain: who can apply, benefits, how to apply.
- REGION: Prioritize Tamil Nadu schemes first. If not available, suggest central government schemes.
- Example schemes by category:
  Students: PM Scholarship, NSP, Vidyalakshmi
  Farmers: PM Kisan, Fasal Bima, Kisan Credit Card
  Women: Mahila Shakti Kendra, Beti Bachao, Ujjwala
  Health: Ayushman Bharat, PMJAY
  Business: Mudra Yojana, Startup India
  Housing: PM Awas Yojana
  Employment: MGNREGA, Skill India
  Senior Citizens: IGNOAPS, Varishtha Pension
  Disabled: ADIP Scheme, Divyangjan
  SC/ST: Post Matric Scholarship, Dr. Ambedkar schemes

WEBSITE NAVIGATION HELP:
- Register: Click the Register button at the top right.
- Login: Click Login at the top right.
- Browse Schemes: Click Browse Schemes in the menu.
- Eligibility: Click Eligibility Checker in the menu.
- Dashboard: Available after login, shows your profile and applied schemes.

APPLICATION STEPS:
1. Register on the website.
2. Login to your account.
3. Go to Browse Schemes or use Eligibility Checker.
4. Find your scheme and click View Details.
5. Click Apply Now.
6. Fill in your details.
7. Upload required documents.
8. Submit and save your application ID.

STRICT RULES:
- Do NOT give false information.
- Do NOT guess unknown schemes.
- If unsure, say: "Please check the official government website for confirmation."
- Keep responses under 120 words.
- Always end with a helpful follow-up question.`;

    const chatHistory = [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: `Understood. I am Namma Scheme AI Assistant. I will reply in the user's language (Tamil, English, or Hindi only), use simple spoken words, prioritize Tamil Nadu schemes, and never give false information.` }] }
    ];

    if (history && history.length > 0) {
      history.forEach(msg => {
        chatHistory.push({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        });
      });
    }

    const chat = model.startChat({
      history: chatHistory,
      generationConfig: { maxOutputTokens: 400, temperature: 0.75 }
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    res.json({ reply, language });

  } catch (error) {
    console.error('Chat error:', error.message);
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('API_KEY'))
      return res.status(200).json({ reply: getFallbackReply(req.body.message, req.body.language), language: req.body.language });
    if (error.message.includes('RESOURCE_EXHAUSTED') || error.message.includes('quota'))
      return res.status(200).json({ reply: getFallbackReply(req.body.message, req.body.language), language: req.body.language });
    res.status(200).json({ reply: getFallbackReply(req.body.message, req.body.language), language: req.body.language });
  }
});

module.exports = router;
