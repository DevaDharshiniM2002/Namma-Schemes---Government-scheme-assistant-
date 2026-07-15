import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext();

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', bcp47: 'en-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', bcp47: 'hi-IN' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', bcp47: 'ta-IN' },
];

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(localStorage.getItem('namma-language') || 'en');

  useEffect(() => {
    localStorage.setItem('namma-language', lang);
    document.documentElement.lang = lang;
    document.documentElement.setAttribute('data-language', lang);
  }, [lang]);

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations['en']?.[key] || key;
  }, [lang]);

  const value = {
    lang,
    setLang,
    language: lang,
    setLanguage: setLang,
    t,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
