import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

function toPoints(text) {
  if (!text) return [];
  if (Array.isArray(text)) return text.map(s => s.trim()).filter(s => s.length > 4);
  return text
    .split(/\n|(?:Step\s*\d+\s*:)|(?:\d+\.\s+)|[•\-\*]/)
    .map(s => s.trim())
    .filter(s => s.length > 8);
}

export default function SchemeDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [scheme,  setScheme]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    axios.get(`${API_URL}/schemes/${id}`, { timeout: 10000 })
      .then(res => { setScheme(res.data.data || res.data); setLoading(false); })
      .catch(err => { setError(err.response?.data?.message || 'Scheme not found'); setLoading(false); });
  }, [id]);

  const handleApply = () => {
    const url = scheme?.portal_url
      || scheme?.officialLink
      || scheme?.apply_link
      || (scheme?.slug ? `https://www.myscheme.gov.in/schemes/${scheme.slug}` : null)
      || `https://www.google.com/search?q=${encodeURIComponent((scheme?.scheme_name || '') + ' official apply government')}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePlatformApply = async () => {
    const user  = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    if (!token) { navigate('/login'); return; }
    try {
      await axios.post(`${API_URL}/apply`,
        { userName: user.name, userEmail: user.email, userPhone: user.phone, schemeId: id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setApplied(true);
      setTimeout(() => setApplied(false), 4000);
    } catch (e) {
      alert('Could not submit: ' + (e.response?.data?.message || e.message));
    }
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem' }}>
      <div style={{ width: '44px', height: '44px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading scheme details...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || !scheme) return (
    <div style={{ textAlign: 'center', padding: '4rem' }}>
      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
      <h2 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>Scheme not found</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{error}</p>
      <button onClick={() => navigate('/schemes')} className="btn btn-primary">← Back to Schemes</button>
    </div>
  );

  // Use actual field names from DB
  const detailPoints = toPoints(scheme.details || scheme.description);
  const benefPoints  = toPoints(scheme.benefits);
  const eligPoints   = toPoints(scheme.eligibility);
  const docPoints    = toPoints(scheme.documents || scheme.documents_required);
  const appPoints    = toPoints(scheme.application || scheme.how_to_apply);
  const tagList      = scheme.tags ? scheme.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1rem', animation: 'fadeIn 0.4s ease' }}>
      <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }`}</style>

      <button onClick={() => navigate(-1)}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.92rem', marginBottom: '1.5rem', fontWeight: 500 }}>
        ← Back
      </button>

      {applied && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid #10B981', borderRadius: '10px', padding: '0.85rem 1.2rem', marginBottom: '1.2rem', color: '#10B981', fontWeight: 600 }}>
          ✅ Application submitted successfully!
        </div>
      )}

      {/* Header */}
      <div className="glass-panel" style={{ padding: '1.8rem', marginBottom: '1rem', borderTop: '4px solid var(--primary-color)' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.85rem' }}>
          {scheme.schemeCategory && (
            <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', padding: '3px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>
              {scheme.schemeCategory.split(',')[0].trim()}
            </span>
          )}
          {scheme.level && (
            <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '3px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>
              {scheme.level}
            </span>
          )}
        </div>
        <h1 style={{ fontSize: '1.55rem', fontWeight: 800, lineHeight: 1.35, margin: 0 }}>
          {scheme.scheme_name}
        </h1>
        {tagList.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '1rem' }}>
            {tagList.slice(0, 6).map(tag => (
              <span key={tag} style={{ background: 'var(--bg-color)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', padding: '2px 10px', borderRadius: '50px', fontSize: '0.72rem' }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* About */}
      {detailPoints.length > 0 && (
        <Section icon="📄" title="What is this scheme?">
          <Points items={detailPoints} />
        </Section>
      )}

      {/* Benefits */}
      {benefPoints.length > 0 && (
        <Section icon="🎁" title="What will you get?">
          <Points items={benefPoints} />
        </Section>
      )}

      {/* Eligibility */}
      {eligPoints.length > 0 && (
        <Section icon="👥" title="Who can apply?">
          <Points items={eligPoints} />
        </Section>
      )}

      {/* Documents */}
      {docPoints.length > 0 && (
        <Section icon="📋" title="Documents required">
          <Points items={docPoints} />
        </Section>
      )}

      {/* How to Apply */}
      <Section icon="📝" title="How to apply — Step by step">
        <ol style={{ paddingLeft: '1.4rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {(appPoints.length > 0 ? appPoints : [
            'Click "Apply on Official Site" below.',
            'Register using your Aadhaar or mobile number.',
            'Log in and find this scheme.',
            'Fill in the application form with correct details.',
            'Upload the required documents.',
            'Submit and save your Application Reference Number.',
            'Track your application status on the same website.',
          ]).map((step, i) => (
            <li key={i} style={{ color: 'var(--text-muted)', fontSize: '0.93rem', lineHeight: 1.65 }}>{step}</li>
          ))}
        </ol>
      </Section>

      {/* Apply Buttons */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '1.5rem' }}>
        <button onClick={handleApply} className="btn btn-primary"
          style={{ flex: 1, minWidth: '200px', fontSize: '1rem' }}>
          🔗 Apply on Official Site
        </button>
        <button onClick={handlePlatformApply}
          style={{ flex: 1, minWidth: '200px', padding: '14px 24px', borderRadius: '50px', border: '2px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer', fontSize: '1rem' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(99,102,241,0.07)'}
          onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
          ✅ Mark as Applied
        </button>
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.76rem', marginTop: '0.6rem', textAlign: 'center' }}>
        "Apply on Official Site" opens the government website in a new tab.
      </p>
    </div>
  );
}

function Section({ icon, title, children }) {
  return (
    <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1rem' }}>
      <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)' }}>
        <span>{icon}</span> {title}
      </h2>
      {children}
    </div>
  );
}

function Points({ items }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.93rem', lineHeight: 1.65, color: 'var(--text-muted)' }}>
          <span style={{ color: 'var(--primary-color)', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
