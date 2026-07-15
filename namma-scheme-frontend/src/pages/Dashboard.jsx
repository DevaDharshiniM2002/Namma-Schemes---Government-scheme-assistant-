import React, { useEffect, useState, useRef } from 'react';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Clock, FileText, Mic, MicOff, Search } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

// ─── Auto-match schemes based on registration data ───────────────────────────
function buildUserQuery(user) {
  const keywords = [];

  // Category → keywords
  const catMap = {
    'Student':       ['student','education','scholarship','learning'],
    'Farmer':        ['farmer','agriculture','kisan','crop','rural'],
    'Women':         ['women','woman','mahila','girl','female'],
    'Healthcare':    ['health','medical','hospital','wellness'],
    'Business':      ['business','entrepreneur','msme','startup'],
    'Housing':       ['housing','awas','shelter','home'],
    'Employment':    ['employment','skill','job','labour'],
    'Food Security': ['food','nutrition','ration','antyodaya'],
  };
  const catKeys = catMap[user.category] || [];
  keywords.push(...catKeys);

  // Gender → keywords
  if (user.gender === 'Female') keywords.push('women','mahila','girl');
  if (user.gender === 'Male')   keywords.push('men','male');

  // Age-based keywords
  const age = parseInt(user.age);
  if (age < 18)       keywords.push('student','minor','child');
  if (age >= 60)      keywords.push('senior','pension','elderly','old age');
  if (age >= 18 && age <= 35) keywords.push('youth','young');

  // State
  if (user.state) keywords.push(user.state.toLowerCase());

  return [...new Set(keywords)]; // deduplicate
}

function scoreForUser(scheme, user) {
  const age      = parseInt(user.age) || 25;
  const keywords = buildUserQuery(user);
  const combined = [
    scheme.scheme_name    || '',
    scheme.schemeCategory || '',
    scheme.eligibility    || '',
    scheme.tags           || '',
    scheme.details        || '',
  ].join(' ').toLowerCase();

  // Count keyword hits
  const hits = keywords.filter(k => combined.includes(k)).length;
  if (hits === 0) return 0;

  // Base score from keyword density
  let score = Math.min(60, hits * 15);

  // Age bonus
  const ageNums = [...combined.matchAll(/(\d+)\s*(?:years?|yrs?)/gi)].map(m => parseInt(m[1]));
  if (ageNums.length >= 2) {
    const minA = Math.min(...ageNums), maxA = Math.max(...ageNums);
    if (age >= minA && age <= maxA) score += 25;
    else if (age < minA - 15 || age > maxA + 15) return 0;
    else score += 10;
  } else {
    score += 15; // no age restriction = eligible
  }

  // State bonus
  if (user.state && combined.includes(user.state.toLowerCase())) score += 15;
  if (combined.includes('central') || combined.includes('national')) score += 10;

  return Math.min(100, score);
}

function Avatar({ photo, size = 48 }) {
  if (photo) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)', border: '2px solid var(--primary-color)' }}>
        <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.4)', overflow: 'hidden' }}>
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="white" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

export default function Dashboard() {
  const [user, setUser]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [showProfile, setShowProfile] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [eligLoading, setEligLoading] = useState(false);
  const recognitionRef = useRef(null);
  const { t, language } = useLanguage();
  const token    = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUser(res.data);
        setLoading(false);
        // Auto-match schemes after profile loads
        fetchEligibleSchemes(res.data);
      })
      .catch(() => setLoading(false));
  }, [token]);

  const fetchEligibleSchemes = async (userData) => {
    if (!userData?.category && !userData?.age) return;
    try {
      setEligLoading(true);
      const res = await axios.get(`${API_URL}/schemes?limit=4000`);
      const all = res.data.data || [];
      const scored = all
        .map(s => ({ ...s, _score: scoreForUser(s, userData) }))
        .filter(s => s._score >= 40)
        .sort((a, b) => b._score - a._score)
        .slice(0, 12);
      setEligibleSchemes(scored);
    } catch (_) {}
    finally { setEligLoading(false); }
  };

  const [voiceStatus, setVoiceStatus] = useState('');

  const toggleListen = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setVoiceStatus('❌ Voice not supported. Please use Chrome.');
      setTimeout(() => setVoiceStatus(''), 4000);
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setVoiceStatus('');
      return;
    }

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const bcp47 = SUPPORTED_LANGUAGES.find(l => l.code === language)?.bcp47 || 'en-IN';
    const r = new SR();
    r.lang = bcp47;
    r.continuous = false;
    r.interimResults = true;
    r.maxAlternatives = 3;
    recognitionRef.current = r;

    r.onstart = () => { setIsListening(true); setVoiceStatus('🎤 Listening... Speak now'); };
    r.onspeechstart = () => setVoiceStatus('🎤 Hearing you...');

    r.onresult = (e) => {
      const last = e.results[e.results.length - 1];
      const text = last[0].transcript.trim();
      if (last.isFinal) {
        setSearchQuery(text);
        setVoiceStatus(`✅ "${text}" — Searching...`);
        setIsListening(false);
        setTimeout(() => {
          setVoiceStatus('');
          navigate(`/schemes?search=${encodeURIComponent(text)}`);
        }, 800);
      } else {
        setVoiceStatus(`🎤 "${text}"...`);
      }
    };

    r.onnomatch = () => {
      setVoiceStatus('❌ Could not understand. Please try again.');
      setIsListening(false);
      setTimeout(() => setVoiceStatus(''), 3000);
    };

    r.onerror = (e) => {
      setIsListening(false);
      const msgs = {
        'no-speech':   '❌ No speech detected. Speak clearly and try again.',
        'not-allowed': '❌ Microphone blocked. Allow mic access in browser settings.',
        'audio-capture': '❌ Microphone not found.',
        'network':     '❌ Network error.',
        'aborted':     '',
      };
      const msg = msgs[e.error] || `❌ Error: ${e.error}`;
      if (msg) { setVoiceStatus(msg); setTimeout(() => setVoiceStatus(''), 4000); }
    };

    r.onend = () => setIsListening(false);

    try { r.start(); }
    catch (e) { setVoiceStatus('❌ Could not start mic. Try again.'); setTimeout(() => setVoiceStatus(''), 3000); }
  };

  const executeSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) navigate(`/schemes?search=${encodeURIComponent(searchQuery)}`);
  };

  if (!token) return <Navigate to="/login" />;
  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>{t('loading')}</div>;

  const quickCategories = [
    { key: 'students',      icon: '📚', path: '/schemes?category=Education' },
    { key: 'healthcare',    icon: '🏥', path: '/schemes?category=Health' },
    { key: 'farmers',       icon: '🌾', path: '/schemes?category=Agriculture' },
    { key: 'housing',       icon: '🏠', path: '/schemes?category=Housing' },
    { key: 'women',         icon: '👩', path: '/schemes?category=Women' },
    { key: 'employment',    icon: '💼', path: '/schemes?category=Employment' },
    { key: 'food_security', icon: '🍽️', path: '/schemes?category=Food' },
    { key: 'pensions',      icon: '💰', path: '/schemes?category=Pensions' },
    { key: 'disabled',      icon: '♿', path: '/schemes?category=Disabled' },
    { key: 'senior',        icon: '👴', path: '/schemes?category=Senior' },
    { key: 'business',      icon: '🏢', path: '/schemes?category=Business' },
    { key: 'minority',      icon: '🕌', path: '/schemes?category=Minority' },
  ];

  return (
    <div className="container animate-fade-in" style={{ padding: '2rem 0' }}>

      {/* ── Top Bar ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
            {t('welcome')}, <span className="text-gradient">{user?.name}</span> 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{t('government_schemes')}</p>
        </div>

        {/* Profile Avatar */}
        <div style={{ position: 'relative' }}>
          <button onClick={() => setShowProfile(p => !p)}
            style={{ background: 'none', border: '3px solid var(--primary-color)', borderRadius: '50%', padding: 0, cursor: 'pointer', display: 'flex' }}
            title="View Profile">
            <Avatar photo={user?.photo} size={52} />
          </button>

          {showProfile && (
            <div style={{ position: 'absolute', top: '64px', right: 0, zIndex: 999, width: '280px', background: 'var(--glass-bg)', backdropFilter: 'blur(20px)', border: '1px solid var(--border-color)', borderRadius: '16px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)', padding: '1.4rem', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                <Avatar photo={user?.photo} size={42} />
                <div>
                  <p style={{ fontWeight: 700, margin: 0, fontSize: '0.95rem' }}>{user?.name}</p>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: 0 }}>{user?.email}</p>
                </div>
              </div>
              {[
                { label: 'Phone',      value: user?.phone },
                { label: 'State',      value: user?.state },
                { label: 'Age',        value: user?.age },
                { label: 'Category',   value: user?.category },
                { label: 'Occupation', value: user?.occupation },
              ].filter(i => i.value).map((item, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem', fontSize: '0.83rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600 }}>{item.value}</span>
                </div>
              ))}
              <button onClick={() => { setShowProfile(false); navigate('/profile'); }}
                style={{ width: '100%', marginTop: '1rem', padding: '0.6rem', borderRadius: '8px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                👤 View & Edit Profile
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.2rem', marginBottom: '2rem' }}>
        {[
          { icon: <FileText size={26} />, color: '#6366F1', bg: 'rgba(99,102,241,0.1)', value: user?.appliedSchemes?.length || 0, label: 'Applied Schemes' },
          { icon: <Clock size={26} />,    color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',  value: eligibleSchemes.length, label: 'Matched Schemes' },
          { icon: <CheckCircle size={26} />, color: '#10B981', bg: 'rgba(16,185,129,0.1)', value: eligibleSchemes.filter(s => s._score >= 80).length, label: 'Highly Recommended' },
        ].map((s, i) => (
          <div key={i} className="glass-panel" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ background: s.bg, color: s.color, padding: '0.65rem', borderRadius: '10px' }}>{s.icon}</div>
            <div>
              <h3 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>{s.value}</h3>
              <p style={{ color: 'var(--text-muted)', fontWeight: 600, margin: 0, fontSize: '0.8rem' }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Eligible Schemes for You ── */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 700, margin: 0 }}>🎯 Schemes Recommended for You</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: '4px 0 0' }}>
              Based on your age ({user?.age}), gender ({user?.gender}), category ({user?.category}), state ({user?.state})
            </p>
          </div>
          <Link to="/eligibility" style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Full Check →
          </Link>
        </div>

        {eligLoading ? (
          <div style={{ textAlign: 'center', padding: '2.5rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div style={{ width: '36px', height: '36px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 0.75rem' }} />
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Analyzing your profile and matching schemes...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : eligibleSchemes.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
            {eligibleSchemes.map((scheme, i) => {
              const score = scheme._score;
              const color = score >= 80 ? '#10B981' : score >= 60 ? '#6366F1' : '#F59E0B';
              const label = score >= 80 ? 'Highly Recommended' : score >= 60 ? 'Recommended' : 'Eligible';
              return (
                <div key={scheme._id} className="glass-panel"
                  style={{ padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', borderTop: `3px solid ${color}`, animation: `slideUp 0.3s ease ${i * 0.05}s both` }}>
                  {/* Score badge */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color, background: `${color}18`, padding: '2px 8px', borderRadius: '50px' }}>
                      {score}% — {label}
                    </span>
                    {scheme.level && (
                      <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 500 }}>{scheme.level}</span>
                    )}
                  </div>
                  {/* Name */}
                  <h3 style={{ fontSize: '0.88rem', fontWeight: 700, lineHeight: 1.4, margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {scheme.scheme_name}
                  </h3>
                  {/* Category */}
                  {scheme.schemeCategory && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {scheme.schemeCategory.split(',')[0].trim()}
                    </span>
                  )}
                  {/* Score bar */}
                  <div style={{ height: '4px', background: 'var(--border-color)', borderRadius: '50px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${score}%`, background: color, borderRadius: '50px', transition: 'width 0.6s ease' }} />
                  </div>
                  {/* Button */}
                  <button onClick={() => navigate(`/schemes/${scheme._id}`)}
                    className="btn btn-primary"
                    style={{ padding: '0.45rem', fontSize: '0.82rem', borderRadius: '8px', marginTop: 'auto' }}>
                    View Details →
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>Complete your profile to see personalized scheme recommendations.</p>
            <Link to="/eligibility" className="btn btn-primary" style={{ textDecoration: 'none', fontSize: '0.9rem' }}>Check Eligibility</Link>
          </div>
        )}
      </div>

      {/* ── Quick Actions ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', fontWeight: 700 }}>{t('quick_links')}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {[
            { icon: '✅', label: t('check_eligibility_card'), path: '/eligibility' },
            { icon: '🏛️', label: t('all_schemes'),            path: '/schemes' },
            { icon: '👤', label: 'My Profile',                path: '/profile' },
            { icon: '🤖', label: 'AI Assistant',              action: () => document.querySelector('[title="Namma Scheme AI Assistant"]')?.click() },
          ].map((item, i) => (
            <div key={i} className="glass-panel" onClick={() => item.path ? navigate(item.path) : item.action?.()}
              style={{ padding: '1.2rem', textAlign: 'center', cursor: 'pointer', border: '2px solid var(--border-color)', transition: 'all 0.3s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>{item.icon}</div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Voice Search ── */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', fontWeight: 700 }}>🎤 Voice Search</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '1rem' }}>
          Click the mic, speak a scheme name or topic (e.g. "farmer scheme", "student scholarship")
        </p>
        <form onSubmit={executeSearch} style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-color)', padding: '0.5rem 1rem', borderRadius: '50px', border: `2px solid ${isListening ? '#EF4444' : 'var(--border-color)'}`, maxWidth: '560px', transition: 'border-color 0.3s' }}>
          <Search size={16} color="var(--text-muted)" style={{ marginRight: '8px', flexShrink: 0 }} />
          <input type="text" placeholder="Speak or type to search schemes..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', color: 'var(--text-main)' }} />
          {searchQuery && (
            <button type="submit" style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', marginRight: '6px' }}>Search</button>
          )}
          <button type="button" onClick={toggleListen}
            style={{ background: isListening ? '#EF4444' : 'var(--primary-color)', color: 'white', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', flexShrink: 0, transition: 'all 0.3s', boxShadow: isListening ? '0 0 0 4px rgba(239,68,68,0.3)' : 'none' }}>
            {isListening ? <MicOff size={15} /> : <Mic size={15} />}
          </button>
        </form>
        {/* Status message */}
        {voiceStatus && (
          <div style={{ marginTop: '0.75rem', padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, background: isListening ? 'rgba(239,68,68,0.08)' : voiceStatus.startsWith('✅') ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)', color: isListening ? '#EF4444' : voiceStatus.startsWith('✅') ? '#10B981' : '#F59E0B', display: 'flex', alignItems: 'center', gap: '8px', maxWidth: '560px' }}>
            {isListening && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', animation: 'pulse 1s infinite', flexShrink: 0 }} />}
            {voiceStatus}
          </div>
        )}
        <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
          Supported languages: English, हिंदी, தமிழ் — Change language in the top navbar
        </p>
      </div>

      {/* ── Applied Schemes ── */}
      <h2 style={{ fontSize: '1.4rem', marginBottom: '1rem', fontWeight: 700 }}>{t('applied_schemes')}</h2>
      <div className="glass-panel" style={{ marginBottom: '2.5rem', overflow: 'hidden' }}>
        {user?.appliedSchemes?.length > 0 ? (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.03)', borderBottom: '1px solid var(--border-color)' }}>
                {['Scheme', 'Category', 'Level', 'Status'].map((h, i) => (
                  <th key={i} style={{ padding: '0.85rem 1.2rem', fontWeight: 600, textAlign: 'left', fontSize: '0.85rem' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {user.appliedSchemes.map((scheme, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.85rem 1.2rem' }}>
                    <Link to={`/schemes/${scheme._id}`} style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 500 }}>{scheme.scheme_name || scheme.name}</Link>
                  </td>
                  <td style={{ padding: '0.85rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{scheme.schemeCategory || '—'}</td>
                  <td style={{ padding: '0.85rem 1.2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>{scheme.level || '—'}</td>
                  <td style={{ padding: '0.85rem 1.2rem' }}>
                    <span style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '3px 10px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>Pending</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div style={{ padding: '2.5rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.2rem' }}>{t('no_applications')}</p>
            <Link to="/schemes" className="btn btn-primary">{t('browse_schemes')}</Link>
          </div>
        )}
      </div>

      {/* ── Category Grid ── */}
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '1.2rem' }}>{t('browse_categories')}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '3rem' }}>
        {quickCategories.map((cat, idx) => (
          <div key={idx} onClick={() => navigate(cat.path)} className="glass-panel"
            style={{ padding: '1.5rem 1rem', textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s' }}
            onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--primary-color)'; }}
            onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'transparent'; }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{cat.icon}</div>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{t(cat.key)}</h3>
          </div>
        ))}
      </div>

      {showProfile && <div onClick={() => setShowProfile(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 }} />}
    </div>
  );
}
