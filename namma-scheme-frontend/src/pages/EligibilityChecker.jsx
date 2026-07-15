import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

// ─── QUESTION FLOW — minimum 6 questions for every path ──────────────────────
function getNextQuestion(answers) {
  const age = parseInt(answers.age);
  const occ = (answers.occupation || '').toLowerCase();
  const gen = (answers.gender || '').toLowerCase();

  // Q1 — Age
  if (!answers.age) return { id: 'age', label: 'What is your age?', type: 'number', placeholder: 'e.g. 25' };

  // Q2 — Gender (all paths)
  if (!answers.gender) return { id: 'gender', label: 'What is your gender?', type: 'choice', options: ['Male', 'Female', 'Transgender'] };

  // Q3 — State (all paths)
  if (!answers.state) return { id: 'state', label: 'Which state do you live in?', type: 'choice', options: ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Delhi','Jammu & Kashmir','Ladakh','Puducherry','Chandigarh'] };

  // Q4 — Social category (all paths)
  if (!answers.caste) return { id: 'caste', label: 'What is your social category?', type: 'choice', options: ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'] };

  // ── CHILD (< 18) ──
  if (age < 18) {
    if (!answers.education) return { id: 'education', label: 'What class or level are you studying in?', type: 'choice', options: ['Primary (Class 1–5)', 'Middle (Class 6–8)', 'Secondary (Class 9–10)', 'Higher Secondary (Class 11–12)', 'Not studying'] };
    if (!answers.family_income) return { id: 'family_income', label: 'What is your annual family income (₹)?', type: 'number', placeholder: 'e.g. 120000' };
    return null; // 6 questions done
  }

  // ── SENIOR (> 60) ──
  if (age > 60) {
    if (!answers.pension) return { id: 'pension', label: 'Do you currently receive any pension or income?', type: 'choice', options: ['Yes — Government pension', 'Yes — Private/other income', 'No income at all'] };
    if (!answers.family_income) return { id: 'family_income', label: 'What is your annual family/personal income (₹)?', type: 'number', placeholder: 'e.g. 60000' };
    return null; // 6 questions done
  }

  // ── ADULT (18–60) — Q5: Occupation ──
  if (!answers.occupation) {
    if (gen === 'female')      return { id: 'occupation', label: 'What is your current occupation?', type: 'choice', options: ['Student', 'Farmer', 'Employed (Job)', 'Business Owner', 'Self-employed', 'Homemaker', 'Unemployed'] };
    if (gen === 'transgender') return { id: 'occupation', label: 'What is your current occupation?', type: 'choice', options: ['Student', 'Employed (Job)', 'Self-employed', 'Business Owner', 'Unemployed', 'Looking for support'] };
    return                            { id: 'occupation', label: 'What is your current occupation?', type: 'choice', options: ['Student', 'Farmer', 'Employed (Job)', 'Business Owner', 'Self-employed', 'Unemployed'] };
  }

  // Q6 — Occupation-specific follow-up
  if (occ === 'student') {
    if (!answers.education) return { id: 'education', label: 'What is your current education level?', type: 'choice', options: ['School (Class 9–12)', 'Undergraduate', 'Postgraduate', 'Diploma / ITI', 'Vocational'] };
    if (!answers.family_income) return { id: 'family_income', label: 'What is your annual family income (₹)?', type: 'number', placeholder: 'e.g. 150000' };
    return null;
  }

  if (occ === 'farmer') {
    if (!answers.land) return { id: 'land', label: 'How much agricultural land do you own?', type: 'choice', options: ['No land (landless)', 'Less than 2 acres', '2–5 acres', 'More than 5 acres'] };
    if (!answers.income) return { id: 'income', label: 'What is your annual income (₹)?', type: 'number', placeholder: 'e.g. 80000' };
    return null;
  }

  if (occ === 'business owner' || occ === 'self-employed') {
    if (!answers.sector) return { id: 'sector', label: 'What sector is your business/work in?', type: 'choice', options: ['Agriculture / Food', 'Manufacturing', 'Retail / Trade', 'Services / IT', 'Handicraft / Artisan', 'Other'] };
    if (!answers.income) return { id: 'income', label: 'What is your annual income (₹)?', type: 'number', placeholder: 'e.g. 300000' };
    return null;
  }

  if (occ === 'unemployed' || occ === 'looking for support') {
    if (!answers.education) return { id: 'education', label: 'What is your highest education level?', type: 'choice', options: ['Below Class 10', 'Class 10 (SSLC)', 'Class 12 (HSC)', 'Graduate', 'Postgraduate'] };
    if (!answers.family_income) return { id: 'family_income', label: 'What is your annual family income (₹)?', type: 'number', placeholder: 'e.g. 100000' };
    return null;
  }

  if (occ === 'homemaker') {
    if (!answers.education) return { id: 'education', label: 'What is your highest education level?', type: 'choice', options: ['Below Class 10', 'Class 10 (SSLC)', 'Class 12 (HSC)', 'Graduate', 'Postgraduate'] };
    if (!answers.family_income) return { id: 'family_income', label: 'What is your annual family income (₹)?', type: 'number', placeholder: 'e.g. 200000' };
    return null;
  }

  // Employed (Job)
  if (!answers.education) return { id: 'education', label: 'What is your highest education level?', type: 'choice', options: ['Below Class 10', 'Class 10 (SSLC)', 'Class 12 (HSC)', 'Graduate', 'Postgraduate'] };
  if (!answers.income) return { id: 'income', label: 'What is your annual income (₹)?', type: 'number', placeholder: 'e.g. 400000' };
  return null;
}

function countTotalSteps(answers) {
  const age = parseInt(answers.age);
  if (!age) return 6;
  if (age < 18 || age > 60) return 6;
  const occ = (answers.occupation || '').toLowerCase();
  if (['student','farmer','business owner','self-employed','unemployed','looking for support','homemaker','employed (job)'].includes(occ)) return 7;
  return 6;
}

function getLabel(score) {
  if (score >= 80) return { text: 'Highly Eligible', color: '#10B981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' };
  if (score >= 60) return { text: 'Eligible',        color: '#6366F1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)' };
  return                  { text: 'Partially Eligible', color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };
}

export default function EligibilityChecker() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [answers,  setAnswers]  = useState({});
  const [history,  setHistory]  = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [result,   setResult]   = useState(null);

  if (!token) { navigate('/login'); return null; }

  const current    = getNextQuestion(answers);
  const totalSteps = countTotalSteps(answers);
  const doneSteps  = history.length;
  const progress   = result ? 100 : Math.round((doneSteps / totalSteps) * 100);

  const handleAnswer = async (value) => {
    const val = value.toString().trim();
    if (!val) { setError('Please provide an answer.'); return; }
    if (current.type === 'number') {
      const n = parseInt(val);
      if (isNaN(n) || n < 0) { setError('Please enter a valid number.'); return; }
      if (current.id === 'age' && (n < 1 || n > 120)) { setError('Enter a valid age (1–120).'); return; }
    }
    setError('');
    const newAnswers = { ...answers, [current.id]: val };
    setAnswers(newAnswers);
    setHistory(prev => [...prev, { id: current.id, label: current.label, value: val }]);
    setInputVal('');

    const next = getNextQuestion(newAnswers);
    if (!next) {
      setLoading(true);
      try {
        const res = await axios.post(`${API_URL}/eligibility-check`, newAnswers, { timeout: 30000 });
        setResult(res.data);
      } catch (e) {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (!history.length) return;
    const prev = history.slice(0, -1);
    const newAnswers = {};
    prev.forEach(h => { newAnswers[h.id] = h.value; });
    setAnswers(newAnswers);
    setHistory(prev);
    setResult(null);
    setInputVal('');
    setError('');
  };

  const handleRestart = () => {
    setAnswers({}); setHistory([]);
    setInputVal(''); setError('');
    setResult(null);
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Analysing your profile with AI...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (result) {
    const { schemes = [], aiSummary = '' } = result;
    return (
      <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1rem', animation: 'fadeIn 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>Your Eligibility Results</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{history.map(h => h.value).join(' · ')}</p>
        </div>

        {aiSummary && (
          <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: '1.2rem 1.5rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>🤖 AI Recommendation</p>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: 1.7, margin: 0, whiteSpace: 'pre-line' }}>{aiSummary}</p>
          </div>
        )}

        {schemes.length > 0 ? (
          <>
            <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '12px', padding: '0.9rem 1.2rem', marginBottom: '1.5rem' }}>
              <strong style={{ color: '#10B981' }}>✅ {schemes.length} matching scheme{schemes.length > 1 ? 's' : ''} found for your profile</strong>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
              {schemes.map((scheme, i) => {
                const label = getLabel(scheme.score);
                return (
                  <div key={scheme._id} className="glass-panel"
                    style={{ padding: '1.4rem', borderLeft: `4px solid ${label.color}`, animation: `slideUp 0.3s ease ${i * 0.06}s both` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.6rem' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>{scheme.scheme_name}</h3>
                      <span style={{ background: label.bg, border: `1px solid ${label.border}`, color: label.color, padding: '3px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 700 }}>
                        {scheme.score}% — {label.text}
                      </span>
                    </div>
                    <div style={{ height: '5px', background: 'var(--border-color)', borderRadius: '50px', overflow: 'hidden', marginBottom: '0.7rem' }}>
                      <div style={{ height: '100%', width: `${scheme.score}%`, background: `linear-gradient(90deg, ${label.color}, var(--primary-color))`, borderRadius: '50px' }} />
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.83rem', marginBottom: '0.8rem' }}>{scheme.schemeCategory || 'General'}</p>
                    <div style={{ display: 'flex', gap: '0.6rem' }}>
                      <button onClick={() => navigate(`/schemes/${scheme._id}`)} className="btn btn-primary"
                        style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '8px' }}>
                        View Details →
                      </button>
                      <button onClick={() => window.open(scheme.slug ? `https://www.myscheme.gov.in/schemes/${scheme.slug}` : 'https://www.myscheme.gov.in', '_blank', 'noopener,noreferrer')}
                        style={{ padding: '0.45rem 1rem', fontSize: '0.82rem', borderRadius: '8px', border: '2px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer' }}>
                        Apply Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 2rem', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '16px', marginBottom: '2rem' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>😔</div>
            <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>No exact matches found</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Try browsing all schemes or adjusting your answers.</p>
          </div>
        )}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={handleRestart} className="btn btn-primary">🔄 Check Again</button>
          <Link to="/schemes" className="btn btn-secondary">Browse All Schemes</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '520px', margin: '0 auto', padding: '2rem 1rem', animation: 'fadeIn 0.4s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.4rem' }}>🎯 Eligibility Checker</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Answer a few questions — we'll find the best schemes for you</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Question {doneSteps + 1}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 700 }}>{progress}%</span>
        </div>
        <div style={{ height: '8px', background: 'var(--border-color)', borderRadius: '50px', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, var(--primary-color), #10B981)', borderRadius: '50px', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '1.2rem' }}>
          {history.map((h, i) => (
            <span key={i} style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--primary-color)', padding: '3px 10px', borderRadius: '50px', fontSize: '0.76rem', fontWeight: 600 }}>
              {h.value}
            </span>
          ))}
        </div>
      )}

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.2rem' }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
          Step {doneSteps + 1}
        </p>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '1.5rem', lineHeight: 1.4 }}>
          {current?.label}
        </h2>

        {current?.type === 'number' && (
          <>
            <input type="number" value={inputVal} autoFocus
              onChange={e => { setInputVal(e.target.value); setError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAnswer(inputVal)}
              placeholder={current.placeholder}
              style={{ width: '100%', padding: '0.85rem 1.2rem', borderRadius: '12px', border: `2px solid ${error ? '#EF4444' : 'var(--border-color)'}`, background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '1.1rem', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
              onBlur={e => e.target.style.borderColor = error ? '#EF4444' : 'var(--border-color)'}
            />
            {error && <p style={{ color: '#EF4444', fontSize: '0.8rem', marginTop: '0.4rem' }}>{error}</p>}
            <button onClick={() => handleAnswer(inputVal)} className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Continue →
            </button>
          </>
        )}

        {current?.type === 'choice' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {current.options.map(opt => (
              <button key={opt} onClick={() => handleAnswer(opt)}
                style={{ padding: '0.85rem 1.2rem', borderRadius: '12px', border: '2px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-color)'; e.currentTarget.style.background = 'rgba(99,102,241,0.06)'; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.background = 'var(--bg-color)'; e.currentTarget.style.transform = 'translateX(0)'; }}>
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <button onClick={handleBack} disabled={!history.length}
          style={{ background: 'none', border: 'none', color: !history.length ? 'var(--border-color)' : 'var(--text-muted)', cursor: !history.length ? 'default' : 'pointer', fontSize: '0.86rem', fontWeight: 500 }}>
          ← Back
        </button>
        <button onClick={handleRestart}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.86rem', textDecoration: 'underline' }}>
          Start Over
        </button>
      </div>
    </div>
  );
}
