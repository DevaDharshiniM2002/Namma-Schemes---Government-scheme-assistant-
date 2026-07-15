import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Moon, Sun, Globe, Mic, MicOff, Bell } from 'lucide-react';
import axios from 'axios';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';
import logo from '../assets/logo.jpeg';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

export default function Navbar() {
  const [menuOpen, setMenuOpen]       = useState(false);
  const [theme, setTheme]             = useState(localStorage.getItem('theme') || 'light');
  const [listening, setListening]     = useState(false);
  const [voiceText, setVoiceText]     = useState('');
  const [notifOpen, setNotifOpen]     = useState(false);
  const [notifList, setNotifList]     = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { language, setLanguage, t }  = useLanguage();
  const navigate   = useNavigate();
  const user       = localStorage.getItem('token');
  const recognitionRef = useRef(null);
  const notifRef   = useRef(null);

  // Fetch notification history when logged in
  useEffect(() => {
    if (!user) return;
    const fetchNotifs = () => {
      axios.get(`${API_URL}/notifications/history`, { headers: { Authorization: `Bearer ${user}` } })
        .then(res => {
          const data = res.data.data || [];
          setNotifList(data);
          // Count notifications from last 24h as "unread"
          const since = Date.now() - 24 * 60 * 60 * 1000;
          setUnreadCount(data.filter(n => new Date(n.sentAt).getTime() > since).length);
        })
        .catch(() => {});
    };
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000); // refresh every 1 min
    return () => clearInterval(interval);
  }, [user]);

  // Close notif dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  const currentLang = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceText('❌ Voice not supported. Please use Chrome browser.');
      setTimeout(() => setVoiceText(''), 4000);
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      setVoiceText('');
      return;
    }

    // Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const recognition = new SpeechRecognition();
    recognition.lang = currentLang.bcp47 || 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;  // show partial results
    recognition.maxAlternatives = 3;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setListening(true);
      setVoiceText('🎤 Listening... Speak now');
    };

    recognition.onspeechstart = () => {
      setVoiceText('🎤 Hearing you...');
    };

    recognition.onresult = (event) => {
      // Get best result
      const results = event.results;
      const last = results[results.length - 1];
      const text = last[0].transcript.trim();
      if (last.isFinal) {
        setVoiceText(`✅ "${text}" — Searching...`);
        setListening(false);
        setTimeout(() => {
          setVoiceText('');
          if (localStorage.getItem('token')) {
            navigate(`/schemes?search=${encodeURIComponent(text)}`);
          } else {
            navigate(`/schemes?search=${encodeURIComponent(text)}`);
          }
        }, 800);
      } else {
        setVoiceText(`🎤 "${text}"...`);
      }
    };

    recognition.onnomatch = () => {
      setVoiceText('❌ Could not understand. Please try again.');
      setListening(false);
      setTimeout(() => setVoiceText(''), 3000);
    };

    recognition.onerror = (e) => {
      setListening(false);
      const errorMessages = {
        'no-speech':          '❌ No speech detected. Please speak clearly.',
        'audio-capture':      '❌ Microphone not found. Please check your mic.',
        'not-allowed':        '❌ Microphone blocked. Please allow mic access in browser settings.',
        'network':            '❌ Network error. Please check your connection.',
        'aborted':            '',
        'service-not-allowed':'❌ Speech service not allowed. Use Chrome browser.',
      };
      const msg = errorMessages[e.error] || `❌ Error: ${e.error}`;
      if (msg) {
        setVoiceText(msg);
        setTimeout(() => setVoiceText(''), 4000);
      }
    };

    recognition.onend = () => {
      setListening(false);
    };

    try {
      recognition.start();
    } catch (e) {
      setVoiceText('❌ Could not start microphone. Try again.');
      setTimeout(() => setVoiceText(''), 3000);
    }
  };

  const navLinkStyle = {
    color: 'var(--text-main)', fontWeight: 600, textDecoration: 'none',
    cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '1.05rem'
  };

  const scrollTo = (id) => {
    if (window.location.pathname !== '/') {
      navigate('/');
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 300);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
    setMenuOpen(false);
  };

  return (
    <>
      <div className="tricolor"></div>
      <header className="glass-panel" style={{ position: 'sticky', top: 10, zIndex: 1000, margin: '10px 20px', borderRadius: '50px', animation: 'slideDown 0.6s ease-out', padding: '20px 32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'var(--text-main)', textDecoration: 'none', minWidth: 'fit-content' }}
            onMouseOver={e => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}>
            <img src={logo} alt="Namma Schemes Logo" style={{ height: '64px', width: '64px', borderRadius: '12px', objectFit: 'contain' }} />
            <span className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800, letterSpacing: '1px', textTransform: 'uppercase' }}>NAMMA SCHEME</span>
          </Link>

          <button className="mobile-menu" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>

          <div className={`nav-links ${menuOpen ? 'active' : ''}`} style={{ display: 'flex', gap: '2rem', alignItems: 'center', position: 'relative' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', borderRight: '2px solid var(--border-color)', paddingRight: '1.5rem' }}>

              {/* Notification Bell — logged in only */}
              {user && (
                <div ref={notifRef} style={{ position: 'relative' }}>
                  <button onClick={() => { setNotifOpen(o => !o); setUnreadCount(0); }} title="Notifications"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', position: 'relative', display: 'flex', alignItems: 'center', padding: '4px' }}>
                    <Bell size={22} />
                    {unreadCount > 0 && (
                      <span style={{ position: 'absolute', top: '-2px', right: '-4px', background: '#EF4444', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '0.65rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {notifOpen && (
                    <div style={{ position: 'absolute', top: '48px', right: 0, width: '320px', background: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 2000, overflow: 'hidden' }}>
                      <div style={{ padding: '1rem 1.2rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>🔔 Notifications</span>
                        <Link to="/profile" onClick={() => setNotifOpen(false)} style={{ fontSize: '0.75rem', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none' }}>Manage →</Link>
                      </div>
                      <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                        {notifList.length === 0 ? (
                          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>No notifications yet</div>
                        ) : notifList.slice(0, 10).map((n, i) => (
                          <div key={i} style={{ padding: '0.85rem 1.2rem', borderBottom: '1px solid var(--border-color)', fontSize: '0.83rem', lineHeight: 1.5 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                              <span style={{ fontWeight: 700, color: n.type === 'new_scheme' ? '#10B981' : n.type === 'deadline' ? '#F59E0B' : 'var(--primary-color)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                {n.type === 'new_scheme' ? '📢 New Scheme' : n.type === 'deadline' ? '⏰ Deadline' : '⚠️ Missed'}
                              </span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date(n.sentAt).toLocaleDateString('en-IN')}</span>
                            </div>
                            <p style={{ margin: 0, color: 'var(--text-main)' }}>{n.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Voice Search */}
              <button onClick={handleVoiceSearch} title={`Voice search in ${currentLang.native}`}
                style={{ background: listening ? 'linear-gradient(135deg,#EF4444,#DC2626)' : 'linear-gradient(135deg,#6366F1,#4F46E5)', border: 'none', borderRadius: '50%', width: '38px', height: '38px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', boxShadow: listening ? '0 0 12px rgba(239,68,68,0.6)' : '0 4px 12px rgba(99,102,241,0.4)', transition: 'all 0.3s' }}>
                {listening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              {/* Language Switcher - 11 languages */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Globe size={20} color="var(--text-main)" />
                <select value={language} onChange={e => setLanguage(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', outline: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 हिंदी</option>
                  <option value="ta">🇮🇳 தமிழ்</option>
                </select>
              </div>

              {/* Theme Toggle */}
              <button onClick={toggleTheme} title="Toggle Theme"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-main)', display: 'flex', alignItems: 'center', transition: 'all 0.3s', padding: '4px' }}
                onMouseOver={e => { e.currentTarget.style.transform = 'rotate(20deg) scale(1.2)'; e.currentTarget.style.color = 'var(--primary-color)'; }}
                onMouseOut={e => { e.currentTarget.style.transform = 'rotate(0deg) scale(1)'; e.currentTarget.style.color = 'var(--text-main)'; }}>
                {theme === 'light' ? <Moon size={22} /> : <Sun size={22} />}
              </button>
            </div>

            {/* Voice bubble */}
            {voiceText && (
              <div style={{ position: 'absolute', top: '60px', right: '0', padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.88rem', fontWeight: 600, whiteSpace: 'nowrap', zIndex: 1001, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', background: listening ? 'rgba(239,68,68,0.95)' : 'rgba(30,41,59,0.95)', color: 'white', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {listening && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />}
                {voiceText}
              </div>
            )}

            <ul style={{ display: 'flex', listStyle: 'none', gap: '2.5rem', alignItems: 'center', margin: 0, padding: 0 }}>
              <li>
                <Link to="/" style={navLinkStyle}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {t('home')}
                </Link>
              </li>
              <li>
                <span style={navLinkStyle} onClick={() => scrollTo('categories')}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {t('schemes')}
                </span>
              </li>
              <li>
                <span style={navLinkStyle} onClick={() => scrollTo('eligibility-steps')}
                  onMouseOver={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  {t('eligibility')}
                </span>
              </li>

              {!user ? (
                <>
                  <li>
                    <Link to="/login" style={navLinkStyle}
                      onMouseOver={e => { e.currentTarget.style.color = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={e => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      {t('login')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/register" className="btn btn-primary" style={{ padding: '12px 28px', textDecoration: 'none', fontSize: '1.05rem', fontWeight: 700 }}
                      onMouseOver={e => e.currentTarget.style.transform = 'translateY(-3px)'}
                      onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      {t('register')}
                    </Link>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    <Link to="/dashboard" style={{ ...navLinkStyle, color: 'var(--primary-color)' }}
                      onMouseOver={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      {t('dashboard')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/profile" style={{ ...navLinkStyle, color: 'var(--primary-color)' }}
                      onMouseOver={e => { e.currentTarget.style.opacity = '0.8'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                      onMouseOut={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      👤 Profile
                    </Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="btn"
                      style={{ background: '#EF4444', color: 'white', padding: '12px 28px', fontSize: '1.05rem', fontWeight: 700 }}
                      onMouseOver={e => { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                      onMouseOut={e => { e.currentTarget.style.background = '#EF4444'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                      {t('logout')}
                    </button>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </header>
    </>
  );
}
