import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Edit2, Save, X, Camera } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001/api';

const STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal'];
const CATEGORIES = ['Student','Farmer','Women','Healthcare','Business','Housing','Employment','Food Security','Senior Citizen','Disabled','Minority','Transgender'];
const OCCUPATIONS = ['Student','Farmer','Salaried Employee','Self Employed','Business Owner','Daily Wage Worker','Unemployed','Homemaker','Retired'];
const EDUCATIONS = ['No Formal Education','Primary (1-5)','Middle (6-8)','Secondary (9-10)','Higher Secondary (11-12)','Diploma','Graduate','Post Graduate'];

function Avatar({ photo, size = 80 }) {
  if (photo) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: '0 6px 20px rgba(99,102,241,0.4)', border: '3px solid var(--primary-color)', background: '#eee' }}>
        <img src={photo} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
      </div>
    );
  }
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}>
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="white" />
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </svg>
    </div>
  );
}

const FIELDS = [
  { label: 'Full Name',         key: 'name',       type: 'text',   section: 'basic' },
  { label: 'Email Address',     key: 'email',      type: 'email',  section: 'basic', readonly: true },
  { label: 'Phone Number',      key: 'phone',      type: 'tel',    section: 'basic' },
  { label: 'Age',               key: 'age',        type: 'number', section: 'basic' },
  { label: 'Gender',            key: 'gender',     type: 'select', options: ['Male','Female','Other'], section: 'basic' },
  { label: 'Address',           key: 'address',    type: 'text',   section: 'basic' },
  { label: 'State',             key: 'state',      type: 'select', options: STATES,       section: 'details' },
  { label: 'Category',          key: 'category',   type: 'select', options: CATEGORIES,   section: 'details' },
  { label: 'Occupation',        key: 'occupation', type: 'select', options: OCCUPATIONS,  section: 'details' },
  { label: 'Annual Income (₹)', key: 'income',     type: 'number', section: 'details' },
  { label: 'Education',         key: 'education',  type: 'select', options: EDUCATIONS,   section: 'details' },
];

export default function Profile() {
  const [user, setUser]         = useState(null);
  const [form, setForm]         = useState({});
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [loading, setLoading]   = useState(true);
  const [smsEnabled, setSmsEnabled]           = useState(false);
  const [notifyCategories, setNotifyCategories] = useState([]);
  const [smsMsg, setSmsMsg]     = useState('');
  const [smsLoading, setSmsLoading] = useState(false);
  const fileRef = useRef(null);
  const token    = localStorage.getItem('token');
  const navigate = useNavigate();
  const { t }    = useLanguage();

  const NOTIFY_CATS = useMemo(() => ['Education','Agriculture','Health','Housing','Employment','Business','Women','Senior Citizen'], []);

  useEffect(() => {
    if (!token) return;
    axios.get(`${API_URL}/auth/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => {
        setUser(res.data); setForm(res.data); setLoading(false);
        setSmsEnabled(res.data.smsEnabled || false);
        setNotifyCategories(res.data.notifyCategories || []);
      })
      .catch(err => {
        setLoading(false);
        if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); }
      });
  }, [token, navigate]);

  const handleSmsToggle = useCallback(async (enabled) => {
    setSmsEnabled(enabled);
    setSmsLoading(true);
    try {
      await axios.put(`${API_URL}/notifications/preferences`,
        { smsEnabled: enabled, notifyCategories },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSmsMsg(enabled ? '✅ SMS notifications enabled!' : '🔕 SMS notifications disabled');
    } catch { setSmsMsg('❌ Failed to update'); }
    setSmsLoading(false);
    setTimeout(() => setSmsMsg(''), 3000);
  }, [notifyCategories, token]);

  const handleCategoryToggle = useCallback(async (cat) => {
    const updated = notifyCategories.includes(cat)
      ? notifyCategories.filter(c => c !== cat)
      : [...notifyCategories, cat];
    setNotifyCategories(updated);
    try {
      await axios.put(`${API_URL}/notifications/preferences`,
        { smsEnabled, notifyCategories: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch { setSmsMsg('❌ Failed to save'); setTimeout(() => setSmsMsg(''), 3000); }
  }, [smsEnabled, token]);

  const handleTestSms = useCallback(async () => {
    setSmsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/notifications/test-sms`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setSmsMsg(res.data.success ? '✅ Test SMS sent to your phone!' : `❌ ${res.data.reason}`);
    } catch { setSmsMsg('❌ Failed to send test SMS'); }
    setSmsLoading(false);
    setTimeout(() => setSmsMsg(''), 4000);
  }, [token]);

  const handlePhotoClick = useCallback(() => {
    fileRef.current?.click();
  }, []);

  const handlePhotoChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setMsg('❌ Image must be under 5MB'); setTimeout(() => setMsg(''), 3000); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const MAX = 300;
        const ratio = Math.min(MAX / img.width, MAX / img.height);
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        try {
          const res = await axios.put(`${API_URL}/auth/profile`, { ...user, photo: base64 }, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
          setUser(res.data); setForm(res.data);
          setMsg('✅ Photo updated!');
        } catch (err) { setMsg('❌ ' + (err.response?.data?.message || err.message)); }
        setTimeout(() => setMsg(''), 5000);
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [user, token]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const payload = {
        name:       form.name,
        phone:      form.phone,
        age:        form.age,
        gender:     form.gender,
        state:      form.state,
        category:   form.category,
        occupation: form.occupation,
        income:     form.income,
        education:  form.education,
        address:    form.address,
        photo:      user?.photo,
      };
      const res = await axios.put(`${API_URL}/auth/profile`, payload, { headers: { Authorization: `Bearer ${token}` }, timeout: 15000 });
      setUser(res.data); setForm(res.data);
      setEditMode(false);
      setMsg('✅ Profile updated successfully!');
    } catch (err) {
      if (err.response?.status === 401) { localStorage.removeItem('token'); navigate('/login'); return; }
      setMsg('❌ ' + (err.response?.data?.message || err.code || err.message));
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(''), 4000);
    }
  }, [form, user, token, navigate]);

  const handleCancel = useCallback(() => {
    setEditMode(false);
    setForm(user || {});
  }, [user]);

  if (!token) return <Navigate to="/login" />;
  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>{t('loading')}</div>;

  const inp = { padding: '0.65rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-color)', color: 'var(--text-main)', fontSize: '0.9rem', width: '100%', outline: 'none', boxSizing: 'border-box' as const };

  const renderField = (field: typeof FIELDS[0]) => (
    <div key={field.key}>
      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{field.label}</p>
      {editMode && !field.readonly ? (
        field.type === 'select' ? (
          <select value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} style={inp}>
            <option value="">Select...</option>
            {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        ) : (
          <input type={field.type} value={form[field.key] || ''} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} style={inp} />
        )
      ) : (
        <p style={{ fontWeight: 600, fontSize: '0.95rem', color: field.readonly ? 'var(--text-muted)' : 'var(--text-main)', margin: 0, padding: '0.4rem 0' }}>
          {field.key === 'income' && user?.[field.key] ? `₹${user[field.key]}` : user?.[field.key] || <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontStyle: 'italic' }}>Not set</span>}
        </p>
      )}
    </div>
  );

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1rem', animation: 'fadeIn 0.4s ease' }}>

      <button onClick={() => navigate('/dashboard')}
        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
        ← Back to Dashboard
      </button>

      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '1.5rem', borderTop: '4px solid var(--primary-color)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flexShrink: 0, cursor: 'pointer' }} onClick={handlePhotoClick} title="Click to change photo">
            <Avatar photo={user?.photo} size={100} />
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
              onMouseLeave={e => e.currentTarget.style.opacity = '0'}>
              <Camera size={20} color="white" />
              <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 600, marginTop: 3 }}>Change</span>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoChange} />
          </div>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.3rem' }}>{user?.name}</h1>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 0.5rem', fontSize: '0.95rem' }}>{user?.email}</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {user?.category && <span style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary-color)', padding: '3px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>{user.category}</span>}
              {user?.state && <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10B981', padding: '3px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>{user.state}</span>}
              {user?.occupation && <span style={{ background: 'rgba(245,158,11,0.1)', color: '#F59E0B', padding: '3px 12px', borderRadius: '50px', fontSize: '0.78rem', fontWeight: 600 }}>{user.occupation}</span>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {msg && <span style={{ fontSize: '0.85rem', fontWeight: 600, color: msg.startsWith('✅') ? '#10B981' : '#EF4444' }}>{msg}</span>}
            {editMode ? (
              <>
                <button onClick={handleCancel}
                  style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <X size={14} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  style={{ padding: '0.5rem 1.1rem', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '5px', opacity: saving ? 0.7 : 1 }}>
                  <Save size={14} /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <button onClick={() => setEditMode(true)}
                style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: '2px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Edit2 size={14} /> Edit Profile
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.8rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1.2rem' }}>👤 Basic Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
          {FIELDS.filter(f => f.section === 'basic').map(renderField)}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.8rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1.2rem' }}>📋 Profile Details</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
          {FIELDS.filter(f => f.section === 'details').map(renderField)}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '1.8rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1.2rem' }}>🔔 SMS Notifications</h2>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <p style={{ fontWeight: 600, margin: '0 0 3px' }}>Enable SMS Alerts</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>Receive scheme alerts on {user?.phone || 'your phone'}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            {smsMsg && <span style={{ fontSize: '0.82rem', fontWeight: 600, color: smsMsg.startsWith('✅') ? '#10B981' : '#EF4444' }}>{smsMsg}</span>}
            <button onClick={() => handleSmsToggle(!smsEnabled)} disabled={smsLoading}
              style={{ width: '52px', height: '28px', borderRadius: '50px', border: 'none', cursor: 'pointer', position: 'relative', background: smsEnabled ? '#10B981' : 'var(--border-color)', transition: 'background 0.3s', flexShrink: 0 }}>
              <span style={{ position: 'absolute', top: '3px', left: smsEnabled ? '27px' : '3px', width: '22px', height: '22px', borderRadius: '50%', background: 'white', transition: 'left 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }} />
            </button>
          </div>
        </div>

        {smsEnabled && (
          <>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Notify me about</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
              {NOTIFY_CATS.map(cat => {
                const active = notifyCategories.includes(cat);
                return (
                  <button key={cat} onClick={() => handleCategoryToggle(cat)}
                    style={{ padding: '5px 14px', borderRadius: '50px', border: `2px solid ${active ? 'var(--primary-color)' : 'var(--border-color)'}`, background: active ? 'rgba(99,102,241,0.12)' : 'transparent', color: active ? 'var(--primary-color)' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {cat}
                  </button>
                );
              })}
            </div>
            <button onClick={handleTestSms} disabled={smsLoading || !user?.phone}
              style={{ padding: '0.5rem 1.2rem', borderRadius: '8px', border: '2px solid var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.85rem', cursor: user?.phone ? 'pointer' : 'not-allowed', opacity: user?.phone ? 1 : 0.5 }}>
              {smsLoading ? 'Sending...' : '📱 Send Test SMS'}
            </button>
            {!user?.phone && <p style={{ fontSize: '0.78rem', color: '#F59E0B', marginTop: '0.4rem' }}>⚠️ Add a phone number in Basic Information to enable SMS</p>}
          </>
        )}
      </div>

      <div className="glass-panel" style={{ padding: '1.8rem' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '1.2rem' }}>🔒 Account Information</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
          {[
            { label: 'Account Status', value: '✅ Active' },
            { label: 'Member Since',   value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' }) : '—' },
            { label: 'Schemes Applied', value: user?.appliedSchemes?.length || 0 },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '5px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.label}</p>
              <p style={{ fontWeight: 600, fontSize: '0.95rem', margin: 0 }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
