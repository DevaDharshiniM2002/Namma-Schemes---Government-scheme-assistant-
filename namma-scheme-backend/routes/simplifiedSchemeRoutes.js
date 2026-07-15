const express = require('express');
const router = express.Router();
const SchemeSimplifierService = require('../services/schemeSimplifierService');
const { asyncHandler, apiLimiter } = require('../middleware/securityMiddleware');

// Get all simplified schemes
router.get('/simplified', apiLimiter, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  
  const schemes = await SchemeSimplifierService.getAllSimplifiedSchemes();
  const start = (page - 1) * limit;
  const paginatedSchemes = schemes.slice(start, start + limit);
  
  res.json({
    success: true,
    count: paginatedSchemes.length,
    total: schemes.length,
    page: parseInt(page),
    totalPages: Math.ceil(schemes.length / limit),
    data: paginatedSchemes
  });
}));

// Get single simplified scheme
router.get('/simplified/:id', apiLimiter, asyncHandler(async (req, res) => {
  const scheme = await SchemeSimplifierService.getSimplifiedScheme(req.params.id);
  
  res.json({
    success: true,
    data: scheme
  });
}));

// Search simplified schemes
router.get('/simplified/search/:query', apiLimiter, asyncHandler(async (req, res) => {
  const { query } = req.params;
  
  if (!query || query.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Search query must be at least 2 characters'
    });
  }
  
  const schemes = await SchemeSimplifierService.searchSimplifiedSchemes(query);
  
  res.json({
    success: true,
    count: schemes.length,
    data: schemes
  });
}));

// Get schemes by category (simplified)
router.get('/simplified/category/:category', apiLimiter, asyncHandler(async (req, res) => {
  const { category } = req.params;
  
  const schemes = await SchemeSimplifierService.getSchemesByCategory(category);
  
  res.json({
    success: true,
    count: schemes.length,
    data: schemes
  });
}));

// Get voice assistance for a scheme
router.get('/voice/:id/:language', apiLimiter, asyncHandler(async (req, res) => {
  const { id, language } = req.params;
  const validLanguages = ['tamil', 'english', 'hindi'];
  
  if (!validLanguages.includes(language.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: 'Language must be tamil, english, or hindi'
    });
  }
  
  const scheme = await SchemeSimplifierService.getSimplifiedScheme(id);
  const voiceScript = scheme.smartFeatures.voiceAssistance[language.toLowerCase()];
  
  res.json({
    success: true,
    scheme: scheme.schemeName,
    language: language.toLowerCase(),
    script: voiceScript
  });
}));

// Get chatbot Q&A for a scheme
router.get('/chatbot/:id', apiLimiter, asyncHandler(async (req, res) => {
  const scheme = await SchemeSimplifierService.getSimplifiedScheme(req.params.id);
  
  res.json({
    success: true,
    scheme: scheme.schemeName,
    qa: scheme.smartFeatures.chatbotQA
  });
}));

// Get error help for a scheme
router.get('/error-help/:id', apiLimiter, asyncHandler(async (req, res) => {
  const scheme = await SchemeSimplifierService.getSimplifiedScheme(req.params.id);
  
  res.json({
    success: true,
    scheme: scheme.schemeName,
    errors: scheme.smartFeatures.errorHelp
  });
}));

// Get application guide for a scheme
router.get('/guide/:id', apiLimiter, asyncHandler(async (req, res) => {
  const scheme = await SchemeSimplifierService.getSimplifiedScheme(req.params.id);
  
  res.json({
    success: true,
    scheme: scheme.schemeName,
    guide: scheme.smartFeatures.howToApply
  });
}));

// Get progress tracker
router.get('/progress/:id', apiLimiter, asyncHandler(async (req, res) => {
  const scheme = await SchemeSimplifierService.getSimplifiedScheme(req.params.id);
  
  res.json({
    success: true,
    scheme: scheme.schemeName,
    tracker: scheme.smartFeatures.progressTracker
  });
}));

// Get alerts for a scheme
router.get('/alerts/:id', apiLimiter, asyncHandler(async (req, res) => {
  const scheme = await SchemeSimplifierService.getSimplifiedScheme(req.params.id);
  
  res.json({
    success: true,
    scheme: scheme.schemeName,
    alerts: scheme.smartFeatures.alerts
  });
}));

module.exports = router;
