import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

const CATEGORIES = [
  'All',
  'Agriculture,Rural & Environment',
  'Education & Learning',
  'Health & Wellness',
  'Housing & Shelter',
  'Skills & Employment',
  'Social welfare & Empowerment',
  'Women and Child',
  'Banking,Financial Services and Insurance',
  'Business & Entrepreneurship',
  'Science, IT & Communications',
  'Sports & Culture',
  'Transport & Infrastructure',
  'Utility & Sanitation',
  'Travel & Tourism',
  'Public Safety,Law & Justice',
];

export default function BrowseSchemes() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useLanguage();

  const [schemes,    setSchemes]    = useState([]);
  const [total,      setTotal]      = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [category,   setCategory]   = useState('All');
  const [page,       setPage]       = useState(1);
  const PER_PAGE = 24;

  const debounceRef = useRef(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    const q = new URLSearchParams(location.search).get('search');
    const initSearch = q || '';
    setSearch(initSearch);
    fetchSchemes(1, initSearch, 'All');
  }, []);

  const fetchSchemes = async (p = page, s = search, c = category) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({ page: p, limit: PER_PAGE });
      if (s.trim()) params.set('search', s.trim());
      if (c !== 'All') params.set('category', c);
      const res = await axios.get(`${API_URL}/schemes?${params}`);
      setSchemes(res.data.data || []);
      setTotal(res.data.total || 0);
      setTotalPages(res.data.totalPages || 1);
    } catch (e) {
      setError('Failed to load schemes. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (val) => {
    setSearch(val);
    setPage(1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSchemes(1, val, category), 400);
  };

  const handleCategory = (val) => {
    setCategory(val);
    setPage(1);
    fetchSchemes(1, search, val);
  };

  const handlePage = (p) => {
    setPage(p);
    fetchSchemes(p, search, category);
  };

  const handleClear = () => {
    setSearch('');
    setCategory('All');
    setPage(1);
    fetchSchemes(1, '', 'All');
  };

  if (loading) return (
    <div style={{ textAlign: 'center', padding: '5rem' }}>
      <div style={{ width: '48px', height: '48px', border: '4px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
      <p style={{ color: 'var(--text-muted)' }}>Loading schemes...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>

      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.4rem' }}>🏛️ {t('browse_schemes')}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Explore {total} government schemes — click any card to view full details.</p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1rem' }}>🔍</span>
          <input type="text" value={search} onChange={e => handleSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            style={{ width: '100%', padding: '0.7rem 1rem 0.7rem 2.5rem', borderRadius: '50px', border: '2px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'var(--primary-color)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'} />
        </div>

        <select value={category} onChange={e => handleCategory(e.target.value)}
          style={{ padding: '0.7rem 1.2rem', borderRadius: '50px', border: '2px solid var(--border-color)', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
          {total} {total !== 1 ? t('schemes') : 'scheme'} {t('found')}
        </span>

        {(search || category !== 'All') && (
          <button onClick={handleClear}
            style={{ background: 'none', border: '1px solid var(--border-color)', borderRadius: '50px', padding: '0.5rem 1rem', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            ✕ {t('clear')}
          </button>
        )}
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#EF4444' }}>⚠️ {error}</span>
          <button onClick={() => fetchSchemes(page, search, category)} className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}>{t('retry')}</button>
        </div>
      )}

      {schemes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {schemes.map(scheme => (
            <div key={scheme._id} className="glass-panel"
              style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '130px', transition: 'all 0.2s', cursor: 'default' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.15)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = ''; }}>

              {scheme.schemeCategory && (
                <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--primary-color)', background: 'rgba(99,102,241,0.08)', padding: '2px 8px', borderRadius: '50px', display: 'inline-block', marginBottom: '0.5rem', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {scheme.schemeCategory.split(',')[0].trim()}
                </span>
              )}

              <h3 style={{ fontSize: '0.92rem', fontWeight: 700, lineHeight: 1.4, marginBottom: '1rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', flex: 1 }}>
                {scheme.scheme_name || 'Unnamed Scheme'}
              </h3>

              <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto' }}>
                <button onClick={() => navigate(`/schemes/${scheme._id}`)}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', borderRadius: '8px' }}>
                  {t('view_details')}
                </button>
                <button onClick={() => {
                  const isValidUrl = (url) => {
                    try {
                      const parsed = new URL(url);
                      return ['http:', 'https:'].includes(parsed.protocol) && !parsed.hostname.match(/^(127\.|192\.|10\.|172\.)/);
                    } catch {
                      return false;
                    }
                  };
                  const url = scheme?.portal_url || scheme?.officialLink || scheme?.apply_link || (scheme?.slug ? `https://www.myscheme.gov.in/schemes/${scheme.slug}` : 'https://www.myscheme.gov.in');
                  if (isValidUrl(url)) {
                    window.open(url, '_blank', 'noopener,noreferrer');
                  }
                }}
                  style={{ flex: 1, padding: '0.55rem', fontSize: '0.8rem', borderRadius: '8px', border: '2px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', fontWeight: 700, cursor: 'pointer' }}>
                  {t('apply_now')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>😔</div>
          <h3 style={{ fontWeight: 700, marginBottom: '0.5rem' }}>{t('no_results')}</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Try a different search term or category.</p>
          <button onClick={handleClear} className="btn btn-primary">{t('clear')}</button>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => handlePage(Math.max(1, page - 1))} disabled={page === 1}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', cursor: page === 1 ? 'default' : 'pointer', color: page === 1 ? 'var(--border-color)' : 'var(--text-main)' }}>
            ← {t('previous')}
          </button>
          {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
            const p = page <= 4 ? i + 1 : page - 3 + i;
            if (p < 1 || p > totalPages) return null;
            return (
              <button key={p} onClick={() => handlePage(p)}
                style={{ padding: '0.5rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: p === page ? 'var(--primary-color)' : 'var(--bg-surface)', color: p === page ? 'white' : 'var(--text-main)', cursor: 'pointer', fontWeight: p === page ? 700 : 400 }}>
                {p}
              </button>
            );
          })}
          <button onClick={() => handlePage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
            style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-surface)', cursor: page === totalPages ? 'default' : 'pointer', color: page === totalPages ? 'var(--border-color)' : 'var(--text-main)' }}>
            {t('next')} →
          </button>
        </div>
      )}
    </div>
  );
}
