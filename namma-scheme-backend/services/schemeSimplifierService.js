const mongoose = require('mongoose');

// Simplified scheme converter service
class SchemeSimplifierService {
  
  // Convert complex scheme to simple format
  static simplifyScheme(scheme) {
    return {
      id: scheme._id,
      schemeName: scheme.scheme_name || scheme.name || 'Unknown Scheme',
      
      description: this.simplifyDescription(scheme),
      
      benefits: this.simplifyBenefits(scheme.benefits),
      
      eligibility: this.simplifyEligibility(scheme),
      
      documentsRequired: this.simplifyDocuments(scheme.documents_required),
      
      category: scheme.category || 'General',
      
      schemeType: this.getSchemeType(scheme),
      
      deadline: scheme.deadline || 'No fixed deadline',
      
      status: 'Active',
      
      howToApply: this.createSimpleApplicationGuide(scheme),
      
      smartFeatures: {
        voiceAssistance: this.generateVoiceScript(scheme),
        chatbotQA: this.generateChatbotQA(scheme),
        errorHelp: this.generateErrorHelp(scheme),
        progressTracker: this.generateProgressTracker(),
        autoSuggestions: [],
        alerts: this.generateAlerts(scheme)
      },
      
      officialLink: scheme.portal_url || scheme.officialLink || '#',
      
      ageRange: scheme.age_range || 'All ages',
      
      genderSpecific: scheme.gender || 'All',
      
      incomeLimit: scheme.income_limit ? `₹${scheme.income_limit.toLocaleString('en-IN')}` : 'No limit'
    };
  }

  // Simplify description
  static simplifyDescription(scheme) {
    const desc = scheme.description || '';
    if (!desc) {
      return `This scheme helps eligible people. Check eligibility and apply now.`;
    }
    
    // Remove technical words and shorten
    let simple = desc
      .replace(/pursuant to/gi, '')
      .replace(/hereinafter/gi, '')
      .replace(/notwithstanding/gi, '')
      .replace(/aforementioned/gi, '')
      .replace(/shall be/gi, 'will be')
      .replace(/may be/gi, 'can be')
      .replace(/in order to/gi, 'to')
      .substring(0, 200);
    
    return simple || 'This scheme provides support to eligible citizens.';
  }

  // Simplify benefits
  static simplifyBenefits(benefits) {
    if (!benefits || benefits.length === 0) {
      return ['Financial support', 'Direct bank transfer'];
    }
    
    return benefits.map(b => {
      // Remove technical jargon
      return b
        .replace(/per annum/gi, 'per year')
        .replace(/rupees/gi, '₹')
        .replace(/shall receive/gi, 'will get')
        .substring(0, 100);
    }).slice(0, 5);
  }

  // Simplify eligibility
  static simplifyEligibility(scheme) {
    const eligibility = scheme.eligibility || scheme.eligibilityCriteria || [];
    
    if (eligibility.length === 0) {
      return ['Check official website for details'];
    }
    
    return eligibility.map(e => {
      return e
        .replace(/must have/gi, 'need')
        .replace(/should possess/gi, 'need')
        .replace(/shall be/gi, 'must be')
        .replace(/as per/gi, 'according to')
        .substring(0, 80);
    }).slice(0, 6);
  }

  // Simplify documents
  static simplifyDocuments(documents) {
    if (!documents || documents.length === 0) {
      return ['Aadhaar Card', 'Bank Account Details', 'Address Proof'];
    }
    
    return documents.map(d => {
      return d
        .replace(/certified copy of/gi, '')
        .replace(/original and/gi, '')
        .trim()
        .substring(0, 60);
    }).slice(0, 8);
  }

  // Get scheme type
  static getSchemeType(scheme) {
    const category = (scheme.category || '').toLowerCase();
    if (category.includes('central') || category.includes('national')) return 'Central Government';
    if (category.includes('state')) return 'State Government';
    if (category.includes('local')) return 'Local Government';
    return 'Government Scheme';
  }

  // Create simple application guide
  static createSimpleApplicationGuide(scheme) {
    return {
      beforeYouStart: [
        '✅ Keep Aadhaar card ready',
        '✅ Keep bank account details ready',
        '✅ Ensure mobile number is active',
        '✅ Have required documents scanned or photographed'
      ],
      
      stepByStep: [
        {
          step: 1,
          title: 'Open Website',
          action: 'Open Chrome browser',
          tip: 'Use a computer or smartphone'
        },
        {
          step: 2,
          title: 'Search Scheme',
          action: 'Search for this scheme name',
          tip: 'Copy the exact scheme name'
        },
        {
          step: 3,
          title: 'Click Apply',
          action: 'Click "Apply Now" button',
          tip: 'Look for blue or green button'
        },
        {
          step: 4,
          title: 'Enter Mobile',
          action: 'Enter your mobile number',
          tip: 'Use the number linked to Aadhaar'
        },
        {
          step: 5,
          title: 'Verify OTP',
          action: 'Enter OTP received on SMS',
          tip: 'OTP is valid for 10 minutes'
        },
        {
          step: 6,
          title: 'Fill Details',
          action: 'Fill personal information',
          tip: 'Enter details exactly as in Aadhaar'
        },
        {
          step: 7,
          title: 'Upload Documents',
          action: 'Upload required documents',
          tip: 'Photos should be clear and readable'
        },
        {
          step: 8,
          title: 'Review',
          action: 'Check all details carefully',
          tip: 'Mistakes can delay approval'
        },
        {
          step: 9,
          title: 'Submit',
          action: 'Click Submit button',
          tip: 'You cannot change details after this'
        }
      ],
      
      afterSubmission: [
        '📧 You will get confirmation SMS',
        '⏳ Application will be verified (5-15 days)',
        '✅ You will get approval/rejection SMS',
        '💰 Money will be sent to your bank account',
        '📱 You can check status anytime online'
      ],
      
      commonMistakes: [
        '❌ Wrong Aadhaar number → Check and re-enter',
        '❌ Wrong bank IFSC → Verify with bank passbook',
        '❌ Blurry documents → Take clear photos',
        '❌ Name mismatch → Use exact name from Aadhaar',
        '❌ Wrong mobile number → Use Aadhaar-linked number'
      ]
    };
  }

  // Generate voice assistance script
  static generateVoiceScript(scheme) {
    const schemeName = scheme.scheme_name || 'this scheme';
    
    return {
      tamil: `Vanakkam! ${schemeName} scheme-ukku apply panna virumbinkal, neenga eligible-aa irukka vendum. Aadhaar card, bank account details, address proof irundha podhum. Apply panna online portal-la poyi, apply now button-ai click pannunga. Neenga mobile number enter pannunga, OTP verify pannunga, personal details fill pannunga, documents upload pannunga, submit pannunga. Approval-ku 5 to 15 naal edukum. Neenga SMS-la notification parupeenga.`,
      
      english: `Hello! To apply for ${schemeName}, you need to be eligible. Keep your Aadhaar card, bank details, and address proof ready. Go to the official website, click Apply Now, enter your mobile number, verify OTP, fill your details, upload documents, and submit. You will get approval in 5 to 15 days. You will receive SMS updates.`,
      
      hindi: `Namaste! ${schemeName} ke liye apply karne ke liye aap eligible hona chahiye. Apna Aadhaar card, bank details, aur address proof tayyar rakhen. Official website par jayen, Apply Now button par click karen, apna mobile number daalein, OTP verify karen, apni details bharen, documents upload karen, aur submit karen. Approval mein 5 se 15 din lagenge. Aapko SMS se notification milega.`
    };
  }

  // Generate chatbot Q&A
  static generateChatbotQA(scheme) {
    return [
      {
        question: 'Who can apply for this scheme?',
        answer: 'Check the eligibility section above. You must meet all requirements to apply.'
      },
      {
        question: 'What documents do I need?',
        answer: 'You need: Aadhaar Card, Bank Account Details, Address Proof, and other documents listed above.'
      },
      {
        question: 'How much money will I get?',
        answer: 'Check the benefits section above for exact amount and payment details.'
      },
      {
        question: 'How long does approval take?',
        answer: 'Usually 5 to 15 days. You will get SMS updates about your application status.'
      },
      {
        question: 'Can I apply online?',
        answer: 'Yes! Click the Apply Now button above. You can apply from home using your phone or computer.'
      },
      {
        question: 'What if my application is rejected?',
        answer: 'You will get SMS with reason. You can reapply after fixing the issue.'
      },
      {
        question: 'How do I check my application status?',
        answer: 'Go to the official website and enter your application number or mobile number.'
      },
      {
        question: 'Is there any fee to apply?',
        answer: 'No! This scheme is free. Do not pay anyone to apply.'
      }
    ];
  }

  // Generate error help
  static generateErrorHelp(scheme) {
    return [
      {
        error: 'Aadhaar number not found',
        fix: 'Check if you entered the correct 12-digit Aadhaar number without spaces'
      },
      {
        error: 'OTP not received',
        fix: 'Wait 2 minutes. If still not received, check if mobile number is correct and active'
      },
      {
        error: 'Bank IFSC code error',
        fix: 'Check your bank passbook for correct IFSC code. It is usually 11 characters'
      },
      {
        error: 'Document upload failed',
        fix: 'Make sure file size is less than 5MB. Use JPG or PDF format only'
      },
      {
        error: 'Name mismatch error',
        fix: 'Enter your name exactly as it appears in your Aadhaar card'
      },
      {
        error: 'Application already exists',
        fix: 'You have already applied. Check your status using your mobile number'
      },
      {
        error: 'Not eligible message',
        fix: 'You do not meet the eligibility criteria. Check requirements again'
      },
      {
        error: 'Server error / Try again later',
        fix: 'Website is busy. Wait 5 minutes and try again'
      }
    ];
  }

  // Generate progress tracker
  static generateProgressTracker() {
    return [
      { step: 1, title: 'Details Filled', status: 'pending' },
      { step: 2, title: 'Documents Uploaded', status: 'pending' },
      { step: 3, title: 'Application Submitted', status: 'pending' },
      { step: 4, title: 'Under Verification', status: 'pending' },
      { step: 5, title: 'Approved', status: 'pending' },
      { step: 6, title: 'Money Transferred', status: 'pending' }
    ];
  }

  // Generate alerts
  static generateAlerts(scheme) {
    return [
      '🔔 Application status updates',
      '📢 New scheme notifications',
      '⏰ Deadline reminders',
      '✅ Approval confirmation',
      '💰 Payment received notification'
    ];
  }

  // Fetch all schemes from MongoDB and simplify
  static async getAllSimplifiedSchemes() {
    try {
      const Scheme = mongoose.model('Scheme');
      const schemes = await Scheme.find().limit(100).lean();
      return schemes.map(scheme => this.simplifyScheme(scheme));
    } catch (error) {
      console.error('Error fetching schemes:', error.message);
      throw error;
    }
  }

  // Fetch single scheme and simplify
  static async getSimplifiedScheme(schemeId) {
    try {
      const Scheme = mongoose.model('Scheme');
      const scheme = await Scheme.findById(schemeId).lean();
      if (!scheme) throw new Error('Scheme not found');
      return this.simplifyScheme(scheme);
    } catch (error) {
      console.error('Error fetching scheme:', error.message);
      throw error;
    }
  }

  // Search schemes and simplify
  static async searchSimplifiedSchemes(query) {
    try {
      const Scheme = mongoose.model('Scheme');
      const schemes = await Scheme.find({
        $or: [
          { scheme_name: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } }
        ]
      }).limit(20).lean();
      
      return schemes.map(scheme => this.simplifyScheme(scheme));
    } catch (error) {
      console.error('Error searching schemes:', error.message);
      throw error;
    }
  }

  // Get schemes by category
  static async getSchemesByCategory(category) {
    try {
      const Scheme = mongoose.model('Scheme');
      const schemes = await Scheme.find({
        category: { $regex: category, $options: 'i' }
      }).limit(50).lean();
      
      return schemes.map(scheme => this.simplifyScheme(scheme));
    } catch (error) {
      console.error('Error fetching schemes by category:', error.message);
      throw error;
    }
  }
}

module.exports = SchemeSimplifierService;
