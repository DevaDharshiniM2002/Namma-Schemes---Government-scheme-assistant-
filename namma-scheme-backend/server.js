const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8', '8.8.4.4']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { notifyNewScheme, notifyDeadlines, notifyMissed } = require('./services/notificationService');

dotenv.config();

const app = express();

// ============================================
// MIDDLEWARE
// ============================================

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url}`);
 if (req.body && Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:5178', 'http://localhost:5179', 'http://localhost:5180'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// MODELS
// ============================================
require('./models/Notification');
const Scheme      = require('./models/Scheme');
const User        = require('./models/User');
const Application = require('./models/Application');

// ============================================
// ROUTES
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  console.log('Health check endpoint called');
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// SCHEME ROUTES
// ============================================

// GET all schemes (with optional search & category filter)
app.get('/api/schemes', async (req, res) => {
  try {
    console.log('Fetching all schemes...');
    const { category, search, page = 1, limit = 20 } = req.query;

    let query = {};

    if (category && category !== 'All') {
      query.schemeCategory = { $regex: category, $options: 'i' };
      console.log(`Filtering by category: ${category}`);
    }

    if (search) {
      query.$or = [
        { scheme_name:    { $regex: search, $options: 'i' } },
        { schemeCategory: { $regex: search, $options: 'i' } },
        { tags:           { $regex: search, $options: 'i' } },
        { details:        { $regex: search, $options: 'i' } }
      ];
      console.log(`Searching for: ${search}`);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [schemes, total] = await Promise.all([
      Scheme.find(query).skip(skip).limit(parseInt(limit)).select('scheme_name schemeCategory tags slug level'),
      Scheme.countDocuments(query)
    ]);

    console.log(`Found ${schemes.length} schemes (total: ${total})`);

    res.json({
      success: true,
      count: schemes.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / parseInt(limit)),
      data: schemes
    });
  } catch (error) {
    console.error('Error fetching schemes:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching schemes',
      error: error.message
    });
  }
});

// POST /api/schemes — add new scheme + trigger new-scheme SMS alerts
app.post('/api/schemes', async (req, res) => {
  try {
    const scheme = await Scheme.create(req.body);
    // Fire-and-forget SMS notifications
    notifyNewScheme(scheme).catch(e => console.error('[Notify] newScheme error:', e.message));
    res.status(201).json({ success: true, data: scheme });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET scheme by ID
app.get('/api/schemes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Fetching scheme with ID: ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid scheme ID format'
      });
    }

    const scheme = await Scheme.findById(id);

    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    console.log(`Scheme found: ${scheme.scheme_name}`);
    res.json({
      success: true,
      data: scheme
    });
  } catch (error) {
    console.error('Error fetching scheme:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching scheme',
      error: error.message
    });
  }
});

// GET schemes by category
app.get('/api/schemes/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    console.log(`Fetching schemes for category: ${category}`);

    const schemes = await Scheme.find({
      schemeCategory: { $regex: category, $options: 'i' }
    }).limit(50);

    res.json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching schemes by category',
      error: error.message
    });
  }
});

// GET schemes by tags
app.get('/api/schemes/tag/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    console.log(`Fetching schemes for tag: ${tag}`);

    const schemes = await Scheme.find({
      tags: { $regex: tag, $options: 'i' }
    }).limit(50);

    res.json({
      success: true,
      count: schemes.length,
      data: schemes
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching schemes by tag',
      error: error.message
    });
  }
});

// ============================================
// APPLICATION ROUTES
// ============================================

// POST apply for scheme
app.post('/api/apply', async (req, res) => {
  try {
    console.log('Processing application...');
    const { userName, schemeId, userEmail, userPhone } = req.body;

    if (!userName || !schemeId) {
      return res.status(400).json({
        success: false,
        message: 'userName and schemeId are required'
      });
    }

    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found'
      });
    }

    const application = new Application({
      userName,
      schemeId,
      userEmail,
      userPhone,
      status: 'pending'
    });

    await application.save();
    console.log(`Application saved for ${userName} - Scheme: ${scheme.scheme_name}`);

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application._id,
      data: application
    });
  } catch (error) {
    console.error('Error processing application:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error processing application',
      error: error.message
    });
  }
});

// ============================================
// ELIGIBILITY ROUTES
// ============================================

// POST check eligibility by keywords
app.post('/api/eligibility', async (req, res) => {
  try {
    console.log('Checking eligibility...');
    const { keywords, category, level } = req.body;

    if (!keywords && !category) {
      return res.status(400).json({
        success: false,
        message: 'keywords or category is required'
      });
    }

    let query = {};

    if (category) {
      query.schemeCategory = { $regex: category, $options: 'i' };
    }

    if (level) {
      query.level = { $regex: level, $options: 'i' };
    }

    if (keywords) {
      query.$or = [
        { eligibility:  { $regex: keywords, $options: 'i' } },
        { tags:         { $regex: keywords, $options: 'i' } },
        { scheme_name:  { $regex: keywords, $options: 'i' } },
        { details:      { $regex: keywords, $options: 'i' } }
      ];
    }

    const eligibleSchemes = await Scheme.find(query).limit(20);
    console.log(`${eligibleSchemes.length} eligible schemes found`);

    res.json({
      success: true,
      eligible: eligibleSchemes.length > 0,
      message: eligibleSchemes.length > 0
        ? `Found ${eligibleSchemes.length} eligible schemes`
        : 'No eligible schemes found for your profile',
      schemes: eligibleSchemes,
      count: eligibleSchemes.length
    });
  } catch (error) {
    console.error('Error checking eligibility:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error checking eligibility',
      error: error.message
    });
  }
});

// ============================================
// STATISTICS ROUTES
// ============================================

// GET statistics
app.get('/api/stats', async (req, res) => {
  try {
    console.log('Fetching statistics...');

    const totalSchemes      = await Scheme.countDocuments();
    const totalApplications = await Application.countDocuments();
    const categories        = await Scheme.distinct('schemeCategory');
    const levels            = await Scheme.distinct('level');

    console.log(`Stats: ${totalSchemes} schemes, ${totalApplications} applications`);

    res.json({
      success: true,
      data: {
        totalSchemes,
        totalApplications,
        totalCategories: categories.length,
        totalLevels: levels.length,
        categories,
        levels
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// ── /api/eligibility-check — rule engine + Gemini personalized response ──
app.post('/api/eligibility-check', async (req, res) => {
  try {
    const { age, gender, occupation, education, land, sector, biz_size, seeking, pension, dependent } = req.body;
    const incomeRaw = req.body.income || req.body.family_income || 0;
    const ageN    = parseInt(age) || 0;
    const incomeN = parseInt(incomeRaw) || 0;
    const gen     = (gender || '').toLowerCase();
    const caste   = (req.body.caste || '').toLowerCase();

    const state = (req.body.state || '').toLowerCase();

    // Derive effective occupation from age if not provided
    let effOcc = (occupation || '').toLowerCase();
    if (!effOcc && ageN < 18) effOcc = 'student';
    if (!effOcc && ageN > 60) effOcc = 'senior';

    // Normalise occupation variants
    if (effOcc === 'self-employed') effOcc = 'self-employed';
    if (effOcc === 'working (job/business)') effOcc = 'employed (job)';

    // ── Build smart MongoDB query ──
    const occKeywords = {
      student:              ['student','scholar','education','school','scholarship'],
      senior:               ['senior','pension','elderly','old age','widow'],
      farmer:               ['farmer','agriculture','kisan','crop','farm'],
      'employed (job)':     ['employ','worker','labour','job','salary'],
      'business owner':     ['business','msme','entrepreneur','startup'],
      'self-employed':      ['self employ','artisan','craftsman','msme','business','entrepreneur','skill'],
      unemployed:           ['unemploy','welfare','bpl','skill','job seeker'],
      homemaker:            ['women','mahila','self help','shg','housewife'],
      'looking for support':['welfare','transgender','social protection','support'],
    };
    const keywords = occKeywords[effOcc] || ['welfare','scheme'];
    const orTerms = keywords.map(k => ({
      $or: [
        { tags: { $regex: k, $options: 'i' } },
        { eligibility: { $regex: k, $options: 'i' } },
        { schemeCategory: { $regex: k, $options: 'i' } }
      ]
    }));

    // Gender filter
    if (gen === 'female') orTerms.push({ $or: [{ tags: { $regex: 'women|mahila|girl', $options: 'i' } }, { eligibility: { $regex: 'women|female|girl', $options: 'i' } }] });
    if (gen === 'transgender') orTerms.push({ $or: [{ tags: { $regex: 'transgender', $options: 'i' } }, { eligibility: { $regex: 'transgender', $options: 'i' } }] });

    // State filter — include central schemes + state-specific
    const stateOrTerms = [
      { level: { $regex: 'central|national', $options: 'i' } },
      ...(state ? [{ tags: { $regex: state, $options: 'i' } }, { eligibility: { $regex: state, $options: 'i' } }] : [])
    ];

    const allSchemes = await Scheme.find({
      $and: [
        { $or: orTerms.flatMap(t => t.$or || [t]) },
        { $or: stateOrTerms }
      ]
    }).limit(80).lean();

    // Primary occupation keywords — scheme MUST match at least one to be relevant
    const primaryKeywords = {
      student:              ['student','scholar','education','school','scholarship'],
      senior:               ['senior','pension','elderly','old age','widow'],
      farmer:               ['farmer','agriculture','kisan','crop','farm'],
      'employed (job)':     ['employ','worker','labour','job','salary'],
      'business owner':     ['business','msme','entrepreneur','startup','enterprise'],
      'self-employed':      ['self employ','artisan','craftsman','msme','business','skill','entrepreneur'],
      unemployed:           ['unemploy','welfare','bpl','skill development','job seeker'],
      homemaker:            ['women','mahila','self help group','shg','housewife'],
      'looking for support':['welfare','transgender','social protection'],
    };

    const exclusionMap = {
      student:          ['farmer','agriculture','kisan','msme','pension','elderly','research fellowship','foreign study','back-to-lab'],
      senior:           ['student','school','college','farmer','agriculture','msme','startup'],
      farmer:           ['student','school','college','pension','elderly','msme','startup'],
      'employed (job)': ['farmer','agriculture','kisan','pension','elderly'],
      'business owner': ['farmer','agriculture','kisan','pension','elderly'],
      'self-employed':  ['farmer','agriculture','kisan','pension','elderly'],
      unemployed:       ['farmer','agriculture','kisan','msme','startup','pension'],
      homemaker:        ['farmer','agriculture','kisan','msme','startup','pension'],
    };

    const primaryKws = primaryKeywords[effOcc] || [];
    const exclusionKws = exclusionMap[effOcc] || [];

    const scored = allSchemes
      .filter(s => {
        const combined = `${s.scheme_name} ${s.schemeCategory} ${s.eligibility} ${s.tags} ${s.details || ''}`.toLowerCase();
        // Must match at least one primary keyword
        const matchesPrimary = primaryKws.some(k => combined.includes(k));
        // Must NOT be dominated by exclusion keywords (more than 2 hits = irrelevant)
        const exclusionHits = exclusionKws.filter(k => combined.includes(k)).length;
        return matchesPrimary && exclusionHits < 2;
      })
      .map(s => {
        const combined = `${s.scheme_name} ${s.schemeCategory} ${s.eligibility} ${s.tags} ${s.details || ''}`.toLowerCase();
        let score = 0;

        // Occupation match — how many primary keywords match (up to 40pts)
        const occHits = primaryKws.filter(k => combined.includes(k)).length;
        score += Math.min(40, occHits * 12);

        // Gender bonus (10pts)
        const genMap = { female: ['women','woman','girl','mahila','widow','maternity'], transgender: ['transgender','trans'] };
        if (genMap[gen] && genMap[gen].some(k => combined.includes(k))) score += 10;

        // Caste (15pts)
        const casteMap = { sc: ['sc ','scheduled caste','dalit'], st: ['st ','scheduled tribe','tribal','adivasi'], obc: ['obc','other backward'], ews: ['ews','economically weaker'] };
        if ((casteMap[caste] || []).some(k => combined.includes(k))) score += 15;

        // Age range match (25pts)
        const ageNums = [...(s.eligibility || '').matchAll(/(\d+)\s*(?:years?|yrs?)/gi)].map(m => parseInt(m[1]));
        if (ageNums.length >= 2) {
          const [mn, mx] = [Math.min(...ageNums), Math.max(...ageNums)];
          if (ageN >= mn && ageN <= mx) score += 25;
          else if (ageN < mn - 3 || ageN > mx + 3) score -= 25;
        } else {
          score += 5;
        }

        // Penalize adult-level schemes for young children
        if (ageN <= 12) {
          const adultTerms = ['post-matric','post matric','graduation','graduate','college','university','fellowship','research','foreign study','higher education','undergraduate','postgraduate','diploma','iti','professional'];
          const adultHits = adultTerms.filter(k => combined.includes(k)).length;
          if (adultHits > 0) score -= adultHits * 20;
        }

        // Income match (10pts)
        const incNums = [...(s.eligibility || '').matchAll(/(\d[\d,]*)/g)]
          .map(m => parseInt(m[1].replace(/,/g,''))).filter(n => n >= 10000 && n <= 10000000);
        if (incNums.length > 0) {
          if (incomeN > 0 && incomeN <= Math.max(...incNums)) score += 10;
          else if (incomeN > Math.max(...incNums)) score -= 10;
        } else {
          score += 5;
        }

        return { ...s, score: Math.max(0, Math.min(100, score)) };
      });

    const schemes = scored.filter(s => s.score >= 30).sort((a, b) => b.score - a.score).slice(0, 15);

    // ── Gemini personalized summary ──
    let aiSummary = '';
    if (process.env.GEMINI_API_KEY && schemes.length > 0) {
      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        const schemeList = schemes.slice(0, 8).map((s, i) =>
          `${i+1}. ${s.scheme_name} (${s.schemeCategory || 'General'}) — Benefits: ${(s.benefits||s.details||'').slice(0,80)}`
        ).join('\n');

        const extraInfo = education ? `Education: ${education}` : land ? `Land: ${land}` : sector ? `Sector: ${sector}` : biz_size ? `Business: ${biz_size}` : seeking ? `Seeking: ${seeking}` : '';

        const prompt = `You are a government scheme advisor for India.

User Profile:
- Age: ${age}
- Gender: ${gender}
- Occupation: ${effOcc}
- Social Category: ${caste || 'General'}
- Annual Income: ₹${incomeN.toLocaleString('en-IN')}
${extraInfo ? `- ${extraInfo}` : ''}

Top matching schemes from our database:
${schemeList}

Write a short, warm, personalized recommendation (under 120 words) in simple English:
1. Address the user by their profile (e.g. "As a ${effOcc}...")
2. Highlight the top 2-3 most relevant schemes and why they match
3. End with one actionable tip
Do NOT use bullet points or markdown. Write in plain paragraphs.`;

        const result = await model.generateContent(prompt);
        aiSummary = result.response.text();
      } catch (e) {
        console.error('Gemini error:', e.message);
      }
    }

    res.json({ schemes, aiSummary });
  } catch (err) {
    console.error('eligibility-check error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Auth routes
app.use('/api/auth', require('./routes/authRoutes'));

// Admin routes
app.use('/api/admin', require('./routes/adminRoutes'));

// General chat route
app.use('/api/chat', require('./routes/chatRoutes'));

// Notification routes
app.use('/api/notifications', require('./routes/notificationRoutes'));

// ============================================
// ELIGIBILITY CHATBOT (hybrid rule + AI)
// ============================================

const { GoogleGenerativeAI } = require('@google/generative-ai');
const eligSessions = new Map();
const ELIG_TTL = 30 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of eligSessions) {
    if (now - s.createdAt >= ELIG_TTL) eligSessions.delete(id);
  }
}, 10 * 60 * 1000);

function getEligSession(sessionId) {
  const s = eligSessions.get(sessionId);
  if (s && Date.now() - s.createdAt < ELIG_TTL) return s;
  const fresh = {
    profile: { age: null, ageCategory: null, occupation: null, income: null, state: null },
    history: [],
    step: 'ask_age',
    createdAt: Date.now()
  };
  eligSessions.set(sessionId, fresh);
  return fresh;
}

function applyEligAgeRule(age) {
  if (age < 5)   return { category: null,             nextStep: 'reject' };
  if (age < 18)  return { category: 'student',        nextStep: 'ask_income_family' };
  if (age <= 25) return { category: null,             nextStep: 'ask_occupation_young' };
  if (age > 60)  return { category: 'old_age',        nextStep: 'ask_income_family' };
  return               { category: null,             nextStep: 'ask_occupation' };
}

function buildEligQuery(profile) {
  const catKeywords = {
    student:     ['student', 'education', 'scholarship'],
    old_age:     ['senior', 'pension', 'elderly', 'old age'],
    farmer:      ['farmer', 'agriculture', 'kisan', 'crop'],
    employed:    ['employment', 'skill', 'job', 'labour'],
    business:    ['business', 'msme', 'entrepreneur'],
    unemployed:  ['welfare', 'skill', 'employment'],
    transgender: ['transgender', 'welfare', 'social']
  };
  const cat = profile.ageCategory || profile.occupation || '';
  const keywords = catKeywords[cat] || ['welfare'];
  const pattern = keywords.join('|');
  const orTerms = [
    { tags:           { $regex: pattern, $options: 'i' } },
    { eligibility:    { $regex: pattern, $options: 'i' } },
    { schemeCategory: { $regex: pattern, $options: 'i' } }
  ];
  if (profile.state) {
    orTerms.push(
      { level: { $regex: 'central|national', $options: 'i' } },
      { tags:  { $regex: profile.state,      $options: 'i' } }
    );
  }
  return { $or: orTerms };
}

async function getEligAIReply(session, userMessage, matchedSchemes) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = [
    'You are Namma, a friendly assistant for Namma Scheme platform.',
    'Help users find government schemes through simple conversation, one question at a time.',
    '',
    'LANGUAGE: Detect from user message. Reply in Tamil, Hindi, or English only.',
    'For Tamil: use simple spoken Tamil, not formal.',
    '',
    'QUESTION FLOW (ask ONE at a time):',
    '1. Age',
    '2. If age under 18: skip to family income.',
    '   If age 18 to 25: ask student or working?',
    '   If age above 60: skip to income.',
    '   Else: ask occupation (farmer, student, employed, business, unemployed, transgender)',
    '3. Income: student or unemployed ask family income. Others ask annual personal income.',
    '4. State',
    '',
    'AFTER ALL DATA COLLECTED:',
    'Summarize profile in 1 line, then show top 5 matching schemes in this format:',
    'Scheme: [name]',
    'Benefit: [1 line]',
    'Eligibility: [1 line]',
    'Apply: [1 line]',
    '',
    'RULES:',
    'Never show schemes before collecting all data.',
    'Never ask for Aadhaar or bank details.',
    'Keep responses under 100 words.',
    'Be warm and simple.'
  ].join('\n');

  // Build strictly alternating history for Gemini
  const chatHistory = [
    { role: 'user',  parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. I am Namma. I will ask one question at a time and show matching schemes after collecting all details.' }] }
  ];

  // Add previous turns (exclude last user message — sent via sendMessage)
  const prevHistory = session.history.slice(0, -1);
  for (const msg of prevHistory) {
    const role = msg.role === 'user' ? 'user' : 'model';
    // Ensure strict alternation — skip if same role as last added
    const last = chatHistory[chatHistory.length - 1];
    if (last && last.role === role) continue;
    chatHistory.push({ role, parts: [{ text: msg.content }] });
  }

  let finalMessage = userMessage;
  if (matchedSchemes && matchedSchemes.length > 0) {
    const ctx = matchedSchemes.slice(0, 8).map((s, i) =>
      `${i + 1}. ${s.scheme_name} | ${s.schemeCategory || ''} | Benefits: ${(s.benefits || '').slice(0, 100)} | Eligibility: ${(s.eligibility || '').slice(0, 100)}`
    ).join('\n');
    finalMessage = `${userMessage}\n\n[SYSTEM: Profile complete. Use these matched schemes to respond:\n${ctx}]`;
  }

  const chat = model.startChat({ history: chatHistory, generationConfig: { maxOutputTokens: 500, temperature: 0.7 } });
  const result = await chat.sendMessage(finalMessage);
  return result.response.text();
}

async function processEligStep(session, message) {
  const msg = message.trim().toLowerCase();

  if (msg === 'restart') {
    session.profile = { age: null, ageCategory: null, occupation: null, income: null, state: null };
    session.history = [];
    session.step = 'ask_age';
    session.createdAt = Date.now();
    return { reply: 'Sure! Let us start again. How old are you?', step: 'ask_age', isComplete: false };
  }

  session.history.push({ role: 'user', content: message });
  let matchedSchemes = null;
  let isComplete = false;

  switch (session.step) {
    case 'ask_age': {
      const age = parseInt(msg);
      if (isNaN(age) || age < 1 || age > 120) break;
      session.profile.age = age;
      const { category, nextStep } = applyEligAgeRule(age);
      if (nextStep === 'reject') {
        session.step = 'done'; isComplete = true; break;
      }
      if (category) session.profile.ageCategory = category;
      session.step = nextStep;
      break;
    }
    case 'ask_occupation_young':
    case 'ask_occupation': {
      const occs = ['farmer','student','employed','business','unemployed','transgender','working'];
      const occ = occs.find(o => msg.includes(o));
      if (!occ) break;
      session.profile.occupation = occ === 'working' ? 'employed' : occ;
      if (!session.profile.ageCategory) session.profile.ageCategory = session.profile.occupation;
      // income type depends on occupation
      session.step = ['student','unemployed'].includes(session.profile.occupation)
        ? 'ask_income_family' : 'ask_income_personal';
      break;
    }
    case 'ask_income_family':
    case 'ask_income_personal': {
      const income = parseInt(msg.replace(/[^0-9]/g, ''));
      if (isNaN(income)) break;
      session.profile.income = income;
      session.step = 'ask_state';
      break;
    }
    case 'ask_state': {
      if (msg.length < 2) break;
      session.profile.state = message.trim();
      session.step = 'complete';
      console.log('[eligibility-chat] Profile complete:', session.profile);
      matchedSchemes = await Scheme.find(buildEligQuery(session.profile)).limit(10).lean();
      console.log(`[eligibility-chat] Matched ${matchedSchemes.length} schemes`);
      isComplete = true;
      break;
    }
    default:
      matchedSchemes = await Scheme.find(buildEligQuery(session.profile)).limit(10).lean();
      isComplete = true;
  }

  const reply = await getEligAIReply(session, message, matchedSchemes);
  session.history.push({ role: 'assistant', content: reply });
  return { reply, step: session.step, isComplete };
}

app.post('/api/eligibility-chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message?.trim())
      return res.status(400).json({ error: 'sessionId and message are required' });
    if (!process.env.GEMINI_API_KEY)
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    console.log(`[eligibility-chat] Session: ${sessionId} | Message: ${message}`);
    const session = getEligSession(sessionId);
    const result  = await processEligStep(session, message);
    res.json(result);
  } catch (err) {
    console.error('[eligibility-chat] Error:', err.message);
    if (err.message.includes('API_KEY_INVALID'))
      return res.status(500).json({ error: 'Invalid Gemini API key.' });
    if (err.message.includes('RESOURCE_EXHAUSTED'))
      return res.status(500).json({ error: 'API quota exceeded. Try again later.' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

app.delete('/api/eligibility-chat/:sessionId', (req, res) => {
  eligSessions.delete(req.params.sessionId);
  res.json({ success: true });
});

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  console.log(`404 Not Found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global Error:', err.message);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// ============================================
// DATABASE CONNECTION & SERVER START
// ============================================

const PORT = process.env.PORT || 8001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/namma-scheme';

console.log('\n' + '='.repeat(50));
console.log('NAMMA SCHEME - BACKEND SERVER');
console.log('='.repeat(50));
console.log(`Port: ${PORT}`);
console.log(`MongoDB: ${MONGO_URI}`);
console.log('='.repeat(50) + '\n');

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Atlas Connected Successfully\n');
    app.listen(PORT, () => {
      console.log(`Backend Server Running on http://localhost:${PORT}`);
      console.log(`API Base URL: http://localhost:${PORT}/api`);
      console.log('\n' + '='.repeat(50) + '\n');
    });

    // ── Cron Jobs ──────────────────────────────────────────────
    // Deadline reminders — every day at 9 AM
    const DAILY_MS  = 24 * 60 * 60 * 1000;
    const WEEKLY_MS = 7  * DAILY_MS;

    function scheduleAt(hour, fn, label) {
      const now  = new Date();
      const next = new Date(now);
      next.setHours(hour, 0, 0, 0);
      if (next <= now) next.setDate(next.getDate() + 1);
      const delay = next - now;
      setTimeout(() => { fn(); setInterval(fn, DAILY_MS); }, delay);
      console.log(`[Cron] ${label} scheduled — first run in ${Math.round(delay/60000)} min`);
    }

    scheduleAt(9,  notifyDeadlines, 'Deadline reminders (daily 9AM)');

    // Missed alerts — every Monday at 10 AM (approximated as weekly interval)
    setTimeout(() => {
      notifyMissed();
      setInterval(notifyMissed, WEEKLY_MS);
    }, 5000); // small delay after startup for first run check
    console.log('[Cron] Missed alerts scheduled (weekly)');
    // ────────────────────────────────────────────────────────────
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down server...');
  mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
