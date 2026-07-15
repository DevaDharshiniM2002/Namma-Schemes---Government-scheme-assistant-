const express = require('express');
const router = express.Router();
const Scheme = require('../models/Scheme');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Get all schemes (with optional filters + pagination)
router.get('/', async (req, res) => {
  try {
    const { category, state, search, page = 1, limit = 24 } = req.query;
    let query = {};
    if (category && category !== 'All') query.schemeCategory = { $regex: category, $options: 'i' };
    if (state) query.state = state;
    if (search) {
      query.$or = [
        { scheme_name: { $regex: search, $options: 'i' } },
        { schemeCategory: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [data, total] = await Promise.all([
      Scheme.find(query).skip(skip).limit(parseInt(limit)).select('scheme_name schemeCategory tags slug'),
      Scheme.countDocuments(query)
    ]);

    res.json({ data, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Error fetching schemes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Check eligibility for a scheme using AI
router.post('/check-eligibility', async (req, res) => {
  try {
    const { schemeId, userProfile } = req.body;
    
    // Get scheme details
    const scheme = await Scheme.findById(schemeId);
    if (!scheme) {
      return res.status(404).json({ message: 'Scheme not found' });
    }

    // Basic eligibility check
    let eligible = true;
    let reasons = [];

    // Check age
    if (scheme.age_range && userProfile.age) {
      const ageMatch = scheme.age_range.match(/(\d+)\s*to\s*(\d+)/);
      if (ageMatch) {
        const minAge = parseInt(ageMatch[1]);
        const maxAge = parseInt(ageMatch[2]);
        const userAge = parseInt(userProfile.age);
        
        if (userAge < minAge || userAge > maxAge) {
          eligible = false;
          reasons.push(`Age must be between ${minAge} and ${maxAge} years`);
        }
      }
    }

    // Check gender
    if (scheme.gender && scheme.gender !== 'All' && userProfile.gender) {
      if (scheme.gender.toLowerCase() !== userProfile.gender.toLowerCase()) {
        eligible = false;
        reasons.push(`This scheme is only for ${scheme.gender}`);
      }
    }

    // Check income
    if (scheme.income_limit && userProfile.income) {
      const userIncome = parseInt(userProfile.income);
      if (userIncome > scheme.income_limit) {
        eligible = false;
        reasons.push(`Annual income must be below ₹${scheme.income_limit.toLocaleString()}`);
      }
    }

    // Use AI for detailed analysis if Gemini API is available
    let aiMessage = '';
    let recommendations = [];

    if (process.env.GEMINI_API_KEY) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
        
        const prompt = `
Analyze eligibility for this government scheme:

Scheme: ${scheme.scheme_name}
Category: ${scheme.category}
Description: ${scheme.description}
Eligibility Criteria: ${scheme.eligibility ? scheme.eligibility.join(', ') : 'Not specified'}
Age Range: ${scheme.age_range || 'Not specified'}
Gender: ${scheme.gender || 'All'}
Income Limit: ${scheme.income_limit ? '₹' + scheme.income_limit : 'Not specified'}

User Profile:
Age: ${userProfile.age}
Gender: ${userProfile.gender}
Annual Income: ₹${userProfile.income}
State: ${userProfile.state || 'Not specified'}

Provide:
1. Eligibility status (Eligible/Not Eligible)
2. Brief explanation (2-3 sentences)
3. If not eligible, suggest 2-3 alternative schemes or steps

Keep response concise and helpful.`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        aiMessage = response.text();
        
        // Extract recommendations from AI response
        const recMatch = aiMessage.match(/(?:alternative|recommend|suggest)[^\n]*:?([^]*?)(?:\n\n|$)/i);
        if (recMatch && recMatch[1]) {
          recommendations = recMatch[1]
            .split(/\n|\d+\.\s*/)
            .filter(r => r.trim().length > 10)
            .slice(0, 3);
        }
      } catch (aiError) {
        console.error('AI Error:', aiError);
        // Continue without AI analysis
      }
    }

    // Prepare response
    const response = {
      eligible,
      message: eligible 
        ? `Great news! You appear to be eligible for ${scheme.scheme_name}. ${aiMessage || 'Please verify all documents and apply through the official portal.'}`
        : `Unfortunately, you may not be eligible for this scheme. ${reasons.join('. ')}. ${aiMessage || 'Please check other schemes that might suit your profile.'}`,
      reasons: eligible ? [] : reasons,
      recommendations: recommendations.length > 0 ? recommendations : [
        'Check other schemes in the same category',
        'Verify your eligibility criteria',
        'Contact scheme helpline for clarification'
      ],
      aiAnalysis: aiMessage
    };

    res.json(response);
  } catch (error) {
    console.error('Error checking eligibility:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get recommended schemes based on user profile
router.get('/recommended', async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.userId);
    
    // Very basic recommendation mock logic based on user info (like age)
    let query = {};
    
    const schemes = await Scheme.find(query).limit(5); // For now return any 5 as "recommended"
    res.json(schemes);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single scheme
router.get('/:id', async (req, res) => {
  try {
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
    res.json(scheme);
  } catch (error) {
    console.error('Error fetching scheme:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Seed schemes (Development only)
router.post('/seed', async (req, res) => {
  try {
    const mockSchemes = [
      {
        name: 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
        description: 'Income support to all landholding farmers families in the country.',
        category: 'Agriculture',
        state: 'Central',
        eligibilityCriteria: ['Small and marginal farmers', 'Must be Indian Citizen'],
        benefits: ['Financial benefit of Rs 6000 per year'],
        applicationProcess: ['Register on PM-KISAN Portal', 'Submit Aadhaar Card and Bank details']
      },
      {
        name: 'Beti Bachao Beti Padhao',
        description: 'Empowerment of girls through education.',
        category: 'Education',
        state: 'Central',
        eligibilityCriteria: ['Family with female child', 'Child under 10 years of age'],
        benefits: ['Financial support for education and marriage'],
        applicationProcess: ['Open Sukanya Samriddhi Account in Post Office/Bank']
      },
      {
        name: 'Ayushman Bharat Yojana',
        description: 'National health protection scheme providing health insurance.',
        category: 'Health',
        state: 'Central',
        eligibilityCriteria: ['Below Poverty Line (BPL)', 'Socio-Economic Caste Census 2011 Data'],
        benefits: ['Health insurance cover up to Rs. 5 lakhs per family per year'],
        applicationProcess: ['Check eligibility online', 'Get Ayushman Card from CSC Center']
      }
    ];

    await Scheme.insertMany(mockSchemes);
    res.status(201).json({ message: 'Schemes seeded successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Apply for a scheme
router.post('/:id/apply', async (req, res) => {
  try {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    
    // Check if scheme exists
    const scheme = await Scheme.findById(req.params.id);
    if (!scheme) return res.status(404).json({ message: 'Scheme not found' });
    
    // Check if user exists & hasn't applied already
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (user.appliedSchemes.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already applied' });
    }

    user.appliedSchemes.push(req.params.id);
    await user.save();
    
    res.json({ message: 'Application successful', appliedSchemes: user.appliedSchemes });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
