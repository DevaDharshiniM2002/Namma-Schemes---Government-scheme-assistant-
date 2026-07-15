const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('[chatbot] routes/chatbot.js loaded');

// ─── Scheme Model (safe reuse) ────────────────────────────────────────────────
function getSchemeModel() {
  if (mongoose.models.Scheme) return mongoose.models.Scheme;
  return mongoose.model('Scheme', new mongoose.Schema({
    scheme_name: String, slug: String, details: String, benefits: String,
    eligibility: String, application: String, documents: String,
    level: String, schemeCategory: String, tags: String
  }));
}

// ─── Session Store ────────────────────────────────────────────────────────────
const sessions = new Map();
const SESSION_TTL = 30 * 60 * 1000;

function getSession(sessionId) {
  const s = sessions.get(sessionId);
  if (s && Date.now() - s.createdAt < SESSION_TTL) return s;
  const fresh = {
    profile: { age: null, category: null, occupation: null, income: null, incomeType: null, state: null },
    history: [],
    step: 'ask_age',
    createdAt: Date.now()
  };
  sessions.set(sessionId, fresh);
  return fresh;
}

setInterval(() => {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.createdAt >= SESSION_TTL) sessions.delete(id);
  }
}, 10 * 60 * 1000);

// ─── Dynamic Question Flow (Rule Engine) ─────────────────────────────────────

function resolveOccupation(msg) {
  if (msg.includes('farmer') || msg.includes('agriculture') || msg.includes('விவசாய') || msg.includes('किसान')) return 'farmer';
  if (msg.includes('student') || msg.includes('படிக்கிறேன்') || msg.includes('छात्र')) return 'student';
  if (msg.includes('unemployed') || msg.includes('வேலை இல்லை') || msg.includes('बेरोजगार')) return 'unemployed';
  if (msg.includes('transgender') || msg.includes('திருநங்கை') || msg.includes('ट्रांसजेंडर')) return 'transgender';
  if (msg.includes('work') || msg.includes('employ') || msg.includes('job') || msg.includes('வேலை') || msg.includes('नौकरी') || msg.includes('business') || msg.includes('self')) return 'working';
  return null;
}

function categoryFromOccupation(occ) {
  const map = { farmer: 'farmer', student: 'student', unemployed: 'unemployed', transgender: 'transgender', working: 'working' };
  return map[occ] || occ;
}

function incomeTypeForCategory(category) {
  if (category === 'student' || category === 'unemployed') return 'family';
  return 'annual';
}

// ─── IMPROVED MongoDB Matching ─────────────────────────────────────────────────
const CATEGORY_KEYWORDS = {
  student:     ['student', 'education', 'scholarship', 'school', 'college', 'training', 'coaching'],
  farmer:      ['farmer', 'agriculture', 'kisan', 'crop', 'farming', 'paddy', 'agricultural', 'rural'],
  working:     ['employment', 'skill', 'labour', 'worker', 'job', 'business', 'msme', 'entrepreneur', 'industry'],
  unemployed:  ['unemployed', 'welfare', 'skill', 'employment', 'job', 'training', 'youth'],
  old_age:     ['senior', 'pension', 'elderly', 'old age', 'aged', 'retirement'],
  transgender: ['transgender', 'welfare', 'minority', 'lgbtq', 'social'],
};

async function matchSchemes(profile) {
  const Scheme = getSchemeModel();
  
  try {
    // Get keywords for the category
    const keywords = CATEGORY_KEYWORDS[profile.category] || [];
    
    if (keywords.length === 0) {
      console.log('[chatbot] No keywords for category:', profile.category);
      return [];
    }
    
    // Build regex pattern
    const pattern = keywords.join('|');
    
    // Primary query - match by category keywords
    let query = {
      $or: [
        { schemeCategory: { $regex: pattern, $options: 'i' } },
        { tags: { $regex: pattern, $options: 'i' } },
        { eligibility: { $regex: pattern, $options: 'i' } },
        { details: { $regex: pattern, $options: 'i' } }
      ]
    };
    
    console.log('[chatbot] Matching schemes for category:', profile.category);
    console.log('[chatbot] Keywords:', keywords);
    
    // Execute query
    let schemes = await Scheme.find(query).limit(15).lean();
    
    console.log(`[chatbot] Found ${schemes.length} schemes with category keywords`);
    
    // If no schemes found, try broader search
    if (schemes.length === 0) {
      console.log('[chatbot] No schemes found, trying broader search');
      query = {
        $or: [
          { benefits: { $regex: pattern, $options: 'i' } },
          { application: { $regex: pattern, $options: 'i' } }
        ]
      };
      schemes = await Scheme.find(query).limit(15).lean();
      console.log(`[chatbot] Broader search found ${schemes.length} schemes`);
    }
    
    // Filter by state if provided
    if (profile.state && profile.state.length > 2 && schemes.length > 0) {
      const stateSchemes = schemes.filter(s => 
        (s.level && s.level.toLowerCase().includes('central')) ||
        (s.level && s.level.toLowerCase().includes('national')) ||
        (s.tags && s.tags.toLowerCase().includes(profile.state.toLowerCase()))
      );
      
      if (stateSchemes.length > 0) {
        schemes = stateSchemes;
        console.log(`[chatbot] Filtered to ${schemes.length} schemes for state: ${profile.state}`);
      }
    }
    
    return schemes.slice(0, 10);
    
  } catch (error) {
    console.error('[chatbot] Error in matchSchemes:', error.message);
    return [];
  }
}

// ─── Gemini AI Response ───────────────────────────────────────────────────────
async function getAIReply(session, userMessage, matchedSchemes) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = `You are "Namma," a friendly assistant for the Namma Scheme platform.
Help users find government schemes through simple conversation.

LANGUAGE:
- Detect language from user messages (Tamil, Hindi, or English)
- Reply in the SAME language throughout
- For Tamil: use simple spoken Tamil, not formal Tamil
- Keep sentences short and simple — easy to read aloud
- No emojis or symbols

QUESTION FLOW (already handled by backend — do NOT re-ask these):
The backend collects: age, occupation, income, state
Your job is to present results warmly and answer follow-up questions.

WHEN SHOWING RESULTS:
- Briefly confirm the user's profile in 1 line
- Show up to 5 schemes in this format:
  Scheme Name: [name]
  What it offers: [1 line]
  Why you qualify: [1 line]
  How to apply: [1 line]

RULES:
- Never ask for Aadhaar or bank details
- If user says "restart" → say their session will be reset
- Show empathy if user mentions hardship
- Keep responses under 120 words
- If no schemes found → suggest visiting the official government portal`;

  const chatHistory = [
    { role: 'user',  parts: [{ text: systemPrompt }] },
    { role: 'model', parts: [{ text: 'Understood. I am Namma. I will present scheme results warmly and answer follow-up questions in the user\'s language.' }] }
  ];

  // Add history excluding the last user message
  session.history.slice(0, -1).forEach(msg => {
    chatHistory.push({
      role:  msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    });
  });

  let finalMessage = userMessage;
  if (matchedSchemes && matchedSchemes.length > 0) {
    const schemeContext = matchedSchemes.slice(0, 5).map((s, i) =>
      `${i + 1}. ${s.scheme_name} | Category: ${s.schemeCategory || 'General'} | Benefits: ${(s.benefits || '').slice(0, 100)} | Eligibility: ${(s.eligibility || '').slice(0, 100)}`
    ).join('\n');
    finalMessage = `${userMessage}\n\n[SYSTEM: Profile - Age: ${session.profile.age}, Category: ${session.profile.category}, State: ${session.profile.state}, Income: ${session.profile.income}. Matched schemes:\n${schemeContext}]`;
  } else {
    finalMessage = `${userMessage}\n\n[SYSTEM: No matching schemes found for profile - Age: ${session.profile.age}, Category: ${session.profile.category}, State: ${session.profile.state}]`;
  }

  const chat = model.startChat({
    history: chatHistory,
    generationConfig: { maxOutputTokens: 500, temperature: 0.7 }
  });

  const result = await chat.sendMessage(finalMessage);
  return result.response.text();
}

// ─── Step Processor ───────────────────────────────────────────────────────────
async function processStep(session, message) {
  const msg = message.trim().toLowerCase();

  if (msg === 'restart') {
    session.profile   = { age: null, category: null, occupation: null, income: null, incomeType: null, state: null };
    session.history   = [];
    session.step      = 'ask_age';
    session.createdAt = Date.now();
    return { reply: 'Sure, let us start again. How old are you?', step: 'ask_age', isComplete: false };
  }

  session.history.push({ role: 'user', content: message });

  let reply = '';
  let isComplete = false;
  let matchedSchemes = null;

  switch (session.step) {

    case 'ask_age': {
      const age = parseInt(msg);
      if (isNaN(age) || age < 1 || age > 120) {
        reply = 'Please enter a valid age. Example: 25';
        break;
      }
      session.profile.age = age;

      if (age < 18) {
        session.profile.category   = 'student';
        session.profile.occupation = 'student';
        session.profile.incomeType = 'family';
        session.step = 'ask_income';
        reply = 'What is your family\'s annual income? (Example: 80000)';
      } else if (age <= 25) {
        session.step = 'ask_occupation_young';
        reply = 'Are you a student or working? (student / working / farmer / unemployed / transgender)';
      } else if (age > 60) {
        session.profile.category   = 'old_age';
        session.profile.occupation = 'old_age';
        session.profile.incomeType = 'annual';
        session.step = 'ask_income';
        reply = 'What is your annual income? (Example: 60000)';
      } else {
        session.step = 'ask_occupation';
        reply = 'What is your occupation? (farmer / working / unemployed / transgender)';
      }
      break;
    }

    case 'ask_occupation_young':
    case 'ask_occupation': {
      const occ = resolveOccupation(msg);
      if (!occ) {
        reply = 'Please choose one: student, farmer, working, unemployed, or transgender.';
        break;
      }
      session.profile.occupation = occ;
      session.profile.category   = categoryFromOccupation(occ);
      session.profile.incomeType = incomeTypeForCategory(session.profile.category);
      session.step = 'ask_income';
      reply = session.profile.incomeType === 'family'
        ? 'What is your family\'s annual income? (Example: 80000)'
        : 'What is your annual income? (Example: 120000)';
      break;
    }

    case 'ask_income': {
      const income = parseInt(msg.replace(/[^0-9]/g, ''));
      if (isNaN(income) || income < 0) {
        reply = 'Please enter income as a number. Example: 80000';
        break;
      }
      session.profile.income = income;
      session.step = 'ask_state';
      reply = 'Which state are you from? (Example: Tamil Nadu, Bihar, Maharashtra)';
      break;
    }

    case 'ask_state': {
      if (message.trim().length < 2) {
        reply = 'Please enter your state name. Example: Tamil Nadu';
        break;
      }
      session.profile.state = message.trim();
      session.step = 'complete';
      console.log('[chatbot] Profile complete:', session.profile);
      matchedSchemes = await matchSchemes(session.profile);
      isComplete = true;
      break;
    }

    default: {
      // Conversation continues after profile is complete
      matchedSchemes = await matchSchemes(session.profile);
      isComplete = true;
    }
  }

  reply = await getAIReply(session, message, matchedSchemes);
  session.history.push({ role: 'assistant', content: reply });

  return { reply, step: session.step, isComplete };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/eligibility-chat
router.post('/eligibility-chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;

    if (!sessionId || !message?.trim()) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY not configured' });
    }

    const session = getSession(sessionId);
    console.log(`[chatbot] Session: ${sessionId} | Step: ${session.step} | Msg: ${message}`);

    const result = await processStep(session, message);
    res.json(result);

  } catch (error) {
    console.error('[chatbot] Error:', error.message);
    if (error.message.includes('API_KEY_INVALID'))
      return res.status(500).json({ error: 'Invalid Gemini API key.' });
    if (error.message.includes('RESOURCE_EXHAUSTED'))
      return res.status(500).json({ error: 'API quota exceeded. Try again later.' });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// DELETE /api/eligibility-chat/:sessionId
router.delete('/eligibility-chat/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  if (sessions.has(sessionId)) {
    sessions.delete(sessionId);
    console.log(`[chatbot] Session deleted: ${sessionId}`);
    return res.json({ success: true, message: 'Session cleared.' });
  }
  res.status(404).json({ error: 'Session not found.' });
});

module.exports = router;
