import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:8001/api/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <h2 className="text-gradient" style={{ marginBottom: '2rem', fontSize: '2rem' }}>{t('welcome')}</h2>
        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', background: '#FEE2E2', padding: '0.5rem', borderRadius: '4px' }}>{error}</div>}
        
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input 
            type="email" placeholder={t('email_address')} required
            value={email} onChange={e => setEmail(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-main)' }} 
          />
          <input 
            type="password" placeholder={t('login')} required
            value={password} onChange={e => setPassword(e.target.value)}
            style={{ padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-main)' }} 
          />
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>{t('login_submit')}</button>
        </form>
        <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>
          {t('no_account')} <Link to="/register" style={{ color: 'var(--primary-color)' }}>{t('register_here')}</Link>
        </p>
      </div>
    </div>
  );
}
