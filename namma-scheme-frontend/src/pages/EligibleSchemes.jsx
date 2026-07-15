import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Filter, Search, ChevronDown } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001/api';

function scoreForUser(scheme, user) {
  const age = parseInt(user.age) || 25;
  const keywords = [];

  const catMap = {
    'Student': ['student', 'education', 'scholarship', 'learning'],
    'Farmer': ['farmer', 'agriculture', 'kisan', 'crop', 'rural'],
    'Women': ['women', 'woman', 'mahila', 'girl', 'female'],
    'Healthcare': ['health', 'medical', 'hospital', 'wellness'],
    'Business': ['business', 'entrepreneur', 'msme', 'startup'],
    'Housing': ['housing', 'awas', 'shelter', 'home'],
    'Employment': ['employment', 'skill', 'job', 'labour'],
    'Food Security': ['food', 'nutrition', 'ration', 'antyodaya'],
  };
  const catKeys = catMap[user.category] || [];
  keywords.push(...catKeys);

  if (user.gender === 'Female') keywords.push('women', 'mahila', 'girl');
  if (user.gender === 'Male') keywords.push('men', 'male');

  if (age < 18) keywords.push('student', 'minor', 'child');
  if (age >= 60) keywords.push('senior', 'pension', 'elderly', 'old age');
  if (age >= 18 && age <= 35) keywords.push('youth', 'young');

  if (user.state) keywords.push(user.state.toLowerCase());

  const combined = [
    scheme.scheme_name || '',
    scheme.schemeCategory || '',
    scheme.eligibility || '',
    scheme.tags || '',
    scheme.details || '',
  ].join(' ').toLowerCase();

  const hits = keywords.filter(k => combined.includes(k)).length;
  if (hits === 0) return 0;

  let score = Math.min(60, hits * 15);

  const ageNums = [...combined.matchAll(/(\\d+)\\s*(?:years?|yrs?)/gi)].map(m => parseInt(m[1]));
  if (ageNums.length >= 2) {
    const minA = Math.min(...ageNums), maxA = Math.max(...ageNums);
    if (age >= minA && age <= maxA) score += 25;
    else if (age < minA - 15 || age > maxA + 15) return 0;
    else score += 10;
  } else {
    score += 15;
  }

  if (user.state && combined.includes(user.state.toLowerCase())) score += 15;
  if (combined.includes('central') || combined.includes('national')) score += 10;

  return Math.min(100, score);
}

export default function EligibleSchemes() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [filteredSchemes, setFilteredSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [filterCategory, setFilterCategory] = useState('all');
  const [categories, setCategories] = useState([]);

  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    // Fetch user profile
    axios.get(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUser(res.data);
        fetchSchemes(res.data);
      })
      .catch(() => navigate('/login'));
  }, [token, navigate]);

  const fetchSchemes = async (userData) => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/schemes?limit=4000`);
      const allSchemes = res.data.data || [];

      // Score and filter schemes
      const scored = allSchemes
        .map(s => ({ ...s, _score: scoreForUser(s, userData) }))
        .filter(s => s._score >= 30)
        .sort((a, b) => b._score - a._score);

      setSchemes(scored);
      setFilteredSchemes(scored);

      // Extract unique categories
      const cats = [...new Set(scored.map(s => s.schemeCategory).filter(Boolean))];
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching schemes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort schemes
  useEffect(() => {
    let filtered = [...schemes];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.scheme_name?.toLowerCase().includes(query) ||
        s.schemeCategory?.toLowerCase().includes(query) ||
        s.tags?.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(s => s.schemeCategory === filterCategory);
    }

    // Sort
    if (sortBy === 'score') {
      filtered.sort((a, b) => b._score - a._score);
    } else if (sortBy === 'name') {
      filtered.sort((a, b) => (a.scheme_name || '').localeCompare(b.scheme_name || ''));
    }

    setFilteredSchemes(filtered);
  }, [searchQuery, sortBy, filterCategory, schemes]);

  if (!token) return null;
  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ width: '40px', height: '40px', border: '3px solid var(--border-color)', borderTopColor: 'var(--primary-color)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <p style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>Loading eligible schemes...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', display: 'flex', alignItems: 'center', color: 'var(--primary-color)' }}>
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 style={{ fontSize: '2rem', margin: 0, fontWeight: 700 }}>
            🎯 Eligible Schemes for You
          </h1>
          <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 0', fontSize: '0.95rem' }}>
            {filteredSchemes.length} schemes matched based on your profile
          </p>
        </div>
      </div>

      {/* User Profile Summary */}
      {user && (
        <div className="glass-panel" style={{ padding: '1.2rem', marginBottom: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
          {[
            { label: 'Age', value: user.age },
            { label: 'Gender', value: user.gender },
            { label: 'Category', value: user.category },
            { label: 'State', value: user.state },
            { label: 'Occupation', value: user.occupation },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0, fontWeight: 600 }}>{item.label}</p>
              <p style={{ fontSize: '1rem', fontWeight: 700, margin: '0.3rem 0 0' }}>{item.value || '—'}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters and Search */}
      <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {/* Search */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <Search size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
              Search Schemes
            </label>
            <input
              type="text"
              placeholder="Search by name, category..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
              }}
            />
          </div>

          {/* Category Filter */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <Filter size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
              Category
            </label>
            <select
              value={filterCategory}
              onChange={e => setFilterCategory(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-muted)' }}>
              <ChevronDown size={16} style={{ display: 'inline', marginRight: '0.3rem' }} />
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-color)',
                color: 'var(--text-main)',
                fontSize: '0.9rem',
                cursor: 'pointer',
              }}
            >
              <option value="score">Best Match</option>
              <option value="name">Alphabetical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Schemes List */}
      {filteredSchemes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {filteredSchemes.map((scheme, idx) => {
            const score = scheme._score;
            const color = score >= 80 ? '#10B981' : score >= 60 ? '#6366F1' : '#F59E0B';
            const label = score >= 80 ? 'Highly Recommended' : score >= 60 ? 'Recommended' : 'Eligible';

            return (
              <div
                key={scheme._id}
                className="glass-panel"
                style={{
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  borderTop: `4px solid ${color}`,
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  animation: `slideUp 0.3s ease ${idx * 0.05}s both`,
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.15)';
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                onClick={() => navigate(`/schemes/${scheme._id}`)}
              >
                {/* Score Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color,
                    background: `${color}18`,
                    padding: '4px 12px',
                    borderRadius: '50px',
                  }}>
                    {score}% — {label}
                  </span>
                  {scheme.level && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      {scheme.level}
                    </span>
                  )}
                </div>

                {/* Scheme Name */}
                <h3 style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  lineHeight: 1.4,
                  margin: 0,
                  color: 'var(--text-main)',
                }}>
                  {scheme.scheme_name}
                </h3>

                {/* Category */}
                {scheme.schemeCategory && (
                  <span style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    fontWeight: 500,
                  }}>
                    📁 {scheme.schemeCategory.split(',')[0].trim()}
                  </span>
                )}

                {/* Benefits Preview */}
                {scheme.benefits && (
                  <div style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                  }}>
                    💰 {scheme.benefits.slice(0, 100)}...
                  </div>
                )}

                {/* Score Bar */}
                <div style={{
                  height: '6px',
                  background: 'var(--border-color)',
                  borderRadius: '50px',
                  overflow: 'hidden',
                  marginTop: 'auto',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${score}%`,
                    background: color,
                    borderRadius: '50px',
                    transition: 'width 0.6s ease',
                  }} />
                </div>

                {/* View Button */}
                <button
                  style={{
                    padding: '0.7rem',
                    borderRadius: '8px',
                    background: `linear-gradient(135deg, ${color}, ${color}dd)`,
                    color: 'white',
                    border: 'none',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                    transition: 'all 0.3s',
                  }}
                  onMouseOver={e => e.target.style.transform = 'scale(1.02)'}
                  onMouseOut={e => e.target.style.transform = 'scale(1)'}
                >
                  View Details →
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          textAlign: 'center',
          padding: '3rem',
          background: 'var(--bg-surface)',
          borderRadius: '16px',
          border: '1px solid var(--border-color)',
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No schemes found</p>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Try adjusting your search or filters
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterCategory('all');
            }}
            style={{
              padding: '0.7rem 1.5rem',
              borderRadius: '8px',
              background: 'var(--primary-color)',
              color: 'white',
              border: 'none',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Stats */}
      <div style={{ marginTop: '3rem', padding: '1.5rem', background: 'var(--bg-surface)', borderRadius: '16px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', margin: 0 }}>
          Showing <strong>{filteredSchemes.length}</strong> of <strong>{schemes.length}</strong> eligible schemes
        </p>
      </div>
    </div>
  );
}
