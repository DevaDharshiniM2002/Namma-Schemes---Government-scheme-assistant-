import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useLanguage } from '../context/LanguageContext';

export default function Register() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '',
    age: '', 
    gender: '',
    phone: '',
    state: '',
    category: ''
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const categories = ['Student', 'Farmer', 'Women', 'Healthcare', 'Business', 'Housing', 'Employment', 'Food Security'];
  const states = ['Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'];

  const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

  const getPasswordStrength = (pwd) => {
    if (!pwd) return null;
    const checks = [pwd.length >= 8, /[A-Z]/.test(pwd), /[a-z]/.test(pwd), /\d/.test(pwd), /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)];
    const score = checks.filter(Boolean).length;
    if (score <= 2) return { label: 'Weak', color: '#EF4444' };
    if (score <= 3) return { label: 'Fair', color: '#F59E0B' };
    if (score === 4) return { label: 'Good', color: '#3B82F6' };
    return { label: 'Strong', color: '#10B981' };
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!PASSWORD_REGEX.test(formData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await axios.post('http://localhost:8001/api/auth/register', {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        age: formData.age,
        gender: formData.gender,
        phone: formData.phone,
        state: formData.state,
        category: formData.category
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh', paddingTop: '2rem' }}>
      <div className="glass-panel" style={{ padding: '3rem', width: '100%', maxWidth: '600px', textAlign: 'center' }}>
        <h2 className="text-gradient" style={{ marginBottom: '2rem', fontSize: '2rem' }}>{t('create_account')}</h2>
        {error && <div style={{ color: '#EF4444', marginBottom: '1rem', background: '#FEE2E2', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}
        
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <input type="text" placeholder="Full Name" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={inputStyle} />
          
          <input type="email" placeholder="Email Address" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={inputStyle} />
          
          <div>
            <input type="password" placeholder="Password" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} style={inputStyle} />
            {formData.password && (() => { const s = getPasswordStrength(formData.password); return (
              <div style={{ marginTop: '0.4rem', fontSize: '0.8rem', color: s.color }}>
                Strength: {s.label} &nbsp;{'●'.repeat(['Weak','Fair','Good','Strong'].indexOf(s.label)+1)}{'○'.repeat(4-['Weak','Fair','Good','Strong'].indexOf(s.label))}
              </div>
            );})()}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>Min 8 chars · Uppercase · Lowercase · Number · Special char</div>
          </div>
          
          <input type="password" placeholder="Confirm Password" required value={formData.confirmPassword} onChange={e => setFormData({...formData, confirmPassword: e.target.value})} style={inputStyle} />
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input type="number" placeholder="Age" required value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} style={{...inputStyle, flex: 1}} />
            <select required value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} style={{...inputStyle, flex: 1}}>
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
          
          <input type="tel" placeholder="Phone Number" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={inputStyle} />
          
          <select required value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} style={inputStyle}>
            <option value="">Select State</option>
            {states.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
          
          <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={inputStyle}>
            <option value="">Select Category</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          
          <button type="submit" className="btn btn-primary" style={{ marginTop: '1rem' }}>{t('create_account_btn')}</button>
        </form>
        
        <p style={{ marginTop: '2rem', color: 'var(--text-muted)' }}>
          {t('already_account')} <Link to="/login" style={{ color: 'var(--primary-color)' }}>{t('login_here')}</Link>
        </p>
      </div>
    </div>
  );
}

const inputStyle = { padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)', outline: 'none', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '1rem' };
