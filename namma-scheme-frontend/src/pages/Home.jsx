import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import heroBg from '../assets/hero-bg.jpeg';
import { Search, Mic } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ayushman from '../assets/schemes/ayushman.jpg';
import kisan from '../assets/schemes/kisan.jpg';
import business from '../assets/schemes/business.jpg';
import banking from '../assets/schemes/banking.jpg';
import skills from '../assets/schemes/skills.jpg';
import employment from '../assets/schemes/employment.jpg';
import energy from '../assets/schemes/energy.jpg';

export default function Home() {
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const isLoggedIn = !!localStorage.getItem('token');
  const { t } = useLanguage();

  const requireLogin = (path) => {
    if (isLoggedIn) navigate(path);
    else setShowAuthModal(true);
  };

  const categories = [
    { titleKey: 'education', icon: '🎓', path: '/schemes?category=Education', color: '#3B82F6' },
    { titleKey: 'agriculture', icon: '🌾', path: '/schemes?category=Agriculture', color: '#10B981' },
    { titleKey: 'women', icon: '👩', path: '/schemes?category=Women', color: '#EC4899' },
    { titleKey: 'health', icon: '🏥', path: '/schemes?category=Health', color: '#EF4444' },
    { titleKey: 'housing', icon: '🏠', path: '/schemes?category=Housing', color: '#F59E0B' },
    { titleKey: 'employment', icon: '💼', path: '/schemes?category=Employment', color: '#8B5CF6' },
    { titleKey: 'food_security', icon: '🍽️', path: '/schemes?category=Food', color: '#F97316' },
    { titleKey: 'social_security', icon: '🤝', path: '/schemes?category=Social', color: '#06B6D4' },
    { titleKey: 'finance', icon: '💰', path: '/schemes?category=Finance', color: '#14B8A6' },
    { titleKey: 'insurance', icon: '🛡️', path: '/schemes?category=Insurance', color: '#6366F1' },
    { titleKey: 'sanitation', icon: '🚿', path: '/schemes?category=Sanitation', color: '#0EA5E9' },
    { titleKey: 'water', icon: '💧', path: '/schemes?category=Water', color: '#06B6D4' },
    { titleKey: 'business', icon: '🏢', path: '/schemes?category=Business', color: '#A855F7' },
  ];

  const services = [
    { number: '01', title: t('scheme_discovery'), desc: t('explore_schemes') },
    { number: '02', title: t('ai_eligibility'), desc: t('ai_powered') },
    { number: '03', title: t('application_guide'), desc: t('apply_portal') },
    { number: '04', title: t('multilingual'), desc: t('multilingual') }
  ];

  const features = [
    { icon: '🎤', titleKey: 'voice_search', descKey: 'voice_search_desc' },
    { icon: '✅', titleKey: 'ai_eligibility_check', descKey: 'ai_eligibility_desc' },
    { icon: '🔗', titleKey: 'direct_links', descKey: 'direct_links_desc' },
    { icon: '📱', titleKey: 'mobile_friendly', descKey: 'mobile_friendly_desc' },
    { icon: '🌐', titleKey: 'multilingual_support', descKey: 'multilingual_desc' },
    { icon: '⚡', titleKey: 'realtime_updates', descKey: 'realtime_desc' }
  ];

  const marqueeCards = [
    { title: '🏥 Ayushman Bharat', desc: 'Free Health Insurance up to ₹5 Lakh', img: ayushman },
    { title: '🌾 PM Kisan Samman Nidhi', desc: '₹6000/Year Direct to Farmers', img: kisan },
    { title: '👧 Beti Bachao Beti Padhao', desc: 'Girl Child Education Support', img: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop' },
    { title: '🏠 PM Awas Yojana', desc: 'Affordable Housing for All', img: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=600&h=400&fit=crop' },
    { title: '💼 PM Mudra Yojana', desc: 'Business Loans up to ₹10 Lakh', img: business },
    { title: '💳 PM Jan Dhan Yojana', desc: 'Free Bank Accounts for All', img: banking },
    { title: '🎓 Skill India Mission', desc: 'Skill Development & Training', img: skills },
    { title: '📚 National Scholarship Portal', desc: 'Scholarships for Students', img: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=600&h=400&fit=crop' },
    { title: '👩 Mahila Shakti Kendra', desc: 'Women Empowerment Programs', img: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a5?w=600&h=400&fit=crop' },
    { title: '⭐ MGNREGA', desc: 'Rural Employment Guarantee', img: employment },
    { title: '🔥 Ujjwala Yojana', desc: 'Free LPG Connections', img: energy },
    { title: '💰 Sukanya Samriddhi Yojana', desc: 'Girl Child Savings Scheme', img: 'https://images.unsplash.com/photo-1554224311-beee460201b4?w=600&h=400&fit=crop' }
  ];

  return (
    <>
      {/* AUTH MODAL */}
      {showAuthModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setShowAuthModal(false)}>
          <div className="glass-panel animate-scale-in" style={{ padding: '40px', maxWidth: '420px', width: '90%', textAlign: 'center', position: 'relative' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowAuthModal(false)} style={{ position: 'absolute', top: 15, right: 20, background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
            <div style={{ fontSize: '3.5rem', marginBottom: '15px' }}>🔐</div>
            <h2 className="text-gradient" style={{ marginBottom: '10px', fontSize: '1.8rem' }}>{t('login_required')}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '30px', lineHeight: 1.6 }}>{t('login_required')}</p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary" style={{ padding: '12px 24px', flex: 1 }}>{t('register')}</Link>
              <Link to="/login" className="btn btn-secondary" style={{ padding: '12px 24px', flex: 1 }}>{t('login')}</Link>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6rem', paddingBottom: '4rem' }}>
        
        {/* HERO SECTION */}
        <section className="container hero-responsive animate-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center', paddingTop: '4rem' }}>
          <div className="animate-slide-in-left">
            <div style={{ display: 'inline-block', padding: '0.5rem 1rem', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--primary-color)', borderRadius: '50px', fontWeight: 600, marginBottom: '1.5rem' }}>
              ✦ {t('govt_assistant')}
            </div>
            <h1 style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontWeight: 700, lineHeight: 1.1 }} className="text-gradient">
              {t('find_schemes')}
            </h1>
            <p style={{ fontSize: '1.25rem', marginBottom: '2.5rem', color: 'var(--text-muted)' }}>
              {t('multilingual')}
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={() => requireLogin('/eligibility')}>🤖 {t('try_ai')}</button>
              <Link to="/schemes" className="btn btn-secondary">{t('browse_schemes')}</Link>
            </div>
          </div>
          <div className="animate-slide-in-right" style={{ width: '100%', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '120%', height: '120%', background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)', zIndex: -1 }}></div>
            <img src={heroBg} alt="Hero" style={{ width: '100%', borderRadius: '24px', boxShadow: 'var(--shadow-md)', border: '4px solid white' }} />
          </div>
        </section>

        {/* 1) SCHEME CATEGORIES SECTION */}
        <section className="container animate-slide-up" id="categories">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>{t('explore_categories')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('swipe_explore')}</p>
          </div>
          <div style={{ 
            display: 'flex', 
            overflowX: 'auto', 
            gap: '1.5rem', 
            paddingBottom: '1rem',
            scrollBehavior: 'smooth',
            WebkitOverflowScrolling: 'touch'
          }}>
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                onClick={() => requireLogin(cat.path)} 
                style={{ 
                  cursor: 'pointer', 
                  borderRadius: '16px', 
                  overflow: 'hidden', 
                  boxShadow: 'var(--shadow-md)',
                  transition: 'all 0.3s ease',
                  transform: 'translateY(0)',
                  background: `linear-gradient(135deg, ${cat.color}15, ${cat.color}05)`,
                  minWidth: '280px',
                  maxWidth: '280px',
                  flexShrink: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '2rem 1.5rem',
                  textAlign: 'center',
                  border: `2px solid ${cat.color}30`,
                  animation: `slideUp 0.6s ease-out ${idx * 0.1}s both`
                }}
                onMouseOver={e => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.15)';
                  e.currentTarget.style.borderColor = cat.color;
                }}
                onMouseOut={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                  e.currentTarget.style.borderColor = `${cat.color}30`;
                }}
              >
                <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>{cat.icon}</div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: cat.color }}>
                  {t(cat.titleKey)}
                </h3>
              </div>
            ))}
          </div>
        </section>

        {/* 2) SERVICES SECTION */}
        <section className="container animate-slide-up">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>{t('services_provide')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('comprehensive_solutions')}</p>
          </div>
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
            {services.map((srv, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', animation: `slideUp 0.6s ease-out ${idx * 0.1}s both` }} onMouseOver={e => e.currentTarget.style.transform='translateY(-6px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', fontWeight: 900, opacity: 0.05, color: 'var(--primary-color)' }}>{srv.number}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', color: 'white', fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
                  {srv.number}
                </div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>{srv.title}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{srv.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3) SCHEMES WE COVER - CAROUSEL WITH MOVING IMAGES */}
        <section className="animate-slide-up" style={{ overflow: 'hidden', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05))', padding: '3rem 0' }}>
          <div className="container" style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>{t('schemes_cover')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('comprehensive_collection')}</p>
          </div>
          <div style={{ position: 'relative', overflow: 'hidden', paddingLeft: '20px', paddingRight: '20px' }}>
            <div style={{ display: 'flex', width: 'max-content', animation: 'scroll 40s linear infinite', padding: '1rem 0' }}>
              {[...marqueeCards, ...marqueeCards, ...marqueeCards].map((scheme, idx) => (
                <div key={idx} style={{ position: 'relative', width: '350px', height: '220px', borderRadius: '24px', overflow: 'hidden', boxShadow: 'var(--shadow-md)', flexShrink: 0, margin: '0 1rem', cursor: 'pointer', transition: 'var(--transition)' }} onMouseOver={e => { e.currentTarget.style.transform='scale(1.03)'; e.currentTarget.parentElement.style.animationPlayState = 'paused'; }} onMouseOut={e => { e.currentTarget.style.transform='scale(1)'; e.currentTarget.parentElement.style.animationPlayState = 'running'; }}>
                  <img src={scheme.img} alt={scheme.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(15, 23, 42, 0.95), transparent)', padding: '1.5rem', color: 'white' }}>
                    <h4 style={{ fontSize: '1.2rem', marginBottom: '0.4rem', fontWeight: 600 }}>{scheme.title}</h4>
                    <p style={{ fontSize: '0.9rem', color: '#CBD5E1' }}>{scheme.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4) WHY WE ARE DIFFERENT - FEATURES SECTION */}
        <section className="container animate-slide-up">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>{t('why_different')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('unique_features')}</p>
          </div>
          <div className="responsive-grid-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {features.map((feat, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden', transition: 'all 0.3s ease', animation: `slideUp 0.6s ease-out ${idx * 0.1}s both` }} onMouseOver={e => e.currentTarget.style.transform='translateY(-6px)'} onMouseOut={e => e.currentTarget.style.transform='translateY(0)'}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '4rem', fontWeight: 900, opacity: 0.05, color: 'var(--primary-color)' }}>{idx + 1}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-light))', color: 'white', fontWeight: 'bold', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                  {feat.icon}
                </div>
                <h3 style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 600 }}>{t(feat.titleKey)}</h3>
                <p style={{ color: 'var(--text-muted)' }}>{t(feat.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5) VISION & MISSION SECTION - SIDE BY SIDE */}
        <section className="container animate-slide-up">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            {/* VISION */}
            <div className="glass-panel animate-slide-in-left" style={{ padding: '3rem 2rem', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(99, 102, 241, 0.05))' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'float 3s ease-in-out infinite' }}>⭐</div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--primary-color)' }}>{t('our_vision')}</h2>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  To create a digital ecosystem where every citizen of India can easily discover, understand, and access government schemes that empower them to achieve their dreams in education, healthcare, employment, housing, and financial security.
                </p>
              </div>
            </div>

            {/* MISSION */}
            <div className="glass-panel animate-slide-in-right" style={{ padding: '3rem 2rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(16, 185, 129, 0.05))' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1.5rem', animation: 'float 3s ease-in-out infinite' }}>🚀</div>
                <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '1.5rem', color: 'var(--secondary-color)' }}>{t('our_mission')}</h2>
                <p style={{ fontSize: '1rem', color: 'var(--text-muted)', lineHeight: 1.8 }}>
                  To empower every citizen by providing easy access to government schemes through AI-powered eligibility checks, multilingual support, and seamless application processes. We are committed to reducing barriers and making welfare programs accessible to all.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6) ELIGIBILITY STEPS SECTION */}
        <section className="container animate-slide-up" id="eligibility-steps">
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 700 }}>{t('how_to_check_eligibility')}</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.2rem' }}>{t('eligibility_steps_sub')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2rem' }}>
            {[
              { step: '01', icon: '📝', titleKey: 'step_register_title', descKey: 'step_register_desc' },
              { step: '02', icon: '🔐', titleKey: 'step_login_title', descKey: 'step_login_desc' },
              { step: '03', icon: '🤖', titleKey: 'step_profile_title', descKey: 'step_profile_desc' },
              { step: '04', icon: '✅', titleKey: 'step_results_title', descKey: 'step_results_desc' }
            ].map((item, idx) => (
              <div key={idx} className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: '-10px', right: '-10px', fontSize: '5rem', fontWeight: 900, opacity: 0.05, color: 'var(--primary-color)' }}>{item.step}</div>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{item.icon}</div>
                <div style={{ display: 'inline-block', background: 'var(--primary-color)', color: 'white', borderRadius: '50%', width: '32px', height: '32px', lineHeight: '32px', fontWeight: 700, marginBottom: '1rem', fontSize: '0.9rem' }}>{item.step}</div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.75rem' }}>{t(item.titleKey)}</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{t(item.descKey)}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <button className="btn btn-primary" style={{ padding: '14px 36px', fontSize: '1.1rem' }} onClick={() => requireLogin('/eligibility')}>
              {t('check_eligibility_now')}
            </button>
          </div>
        </section>

        {/* 7) ABOUT SECTION */}
        <section className="container animate-slide-up">
          <div className="glass-panel" style={{ padding: '4rem 3rem', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(16, 185, 129, 0.05))' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '1rem' }}>{t('about_namma')}</h2>
            </div>
            <div style={{ maxWidth: '900px', margin: '0 auto' }}>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '2rem', textAlign: 'center' }}>
                Namma Scheme is your comprehensive platform for discovering and applying to government schemes across India. We simplify the process of finding schemes that match your eligibility and needs.
              </p>
              <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '3rem', textAlign: 'center' }}>
                With our AI-powered eligibility checker, multilingual support, and direct application links, we make government benefits accessible to everyone.
              </p>
              <div style={{ display: 'flex', gap: '3rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--primary-color)', marginBottom: '0.5rem' }}>386+</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Government Schemes</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '3rem', fontWeight: 700, color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>13</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Categories</p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <h3 style={{ fontSize: '3rem', fontWeight: 700, color: '#EC4899', marginBottom: '0.5rem' }}>3</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', fontWeight: 600 }}>Languages</p>
                </div>
              </div>
            </div>
          </div>
        </section>

      </div>
    </>
  );
}
