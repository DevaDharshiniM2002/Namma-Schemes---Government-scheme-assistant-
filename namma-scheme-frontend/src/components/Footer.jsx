import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  return (
    <footer style={{ background: '#1A1A2E', color: 'white', padding: '40px 0 20px', marginTop: 'auto' }}>
      <div className="container">
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', marginBottom: '30px' }}>
          
          {isHomepage && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ color: '#FF9933', marginBottom: '16px' }}>{t('about')}</h3>
              <p style={{ color: '#ccc' }}>{t('footer_about_text')}</p>
            </div>
          )}
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#FF9933', marginBottom: '16px' }}>{t('quick_links')}</h3>
            <Link to="/schemes" style={{ color: '#ccc', textDecoration: 'none', marginBottom: '8px' }}>{t('all_schemes')}</Link>
            <Link to="/eligibility" style={{ color: '#ccc', textDecoration: 'none', marginBottom: '8px' }}>🤖 {t('try_ai')}</Link>
            <Link to="/eligibility" style={{ color: '#ccc', textDecoration: 'none', marginBottom: '8px' }}>{t('check_eligibility')}</Link>
            <Link to="/login" style={{ color: '#ccc', textDecoration: 'none', marginBottom: '8px' }}>{t('login')}</Link>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ color: '#FF9933', marginBottom: '16px' }}>{t('contact')}</h3>
            <p style={{ color: '#ccc', marginBottom: '8px' }}>📧 support@nammaschemes.gov.in</p>
            <p style={{ color: '#ccc', marginBottom: '8px' }}>📞 1800-XXX-XXXX (24/7)</p>
          </div>

        </div>
        
        <div style={{ textAlign: 'center', paddingTop: '20px', borderTop: '1px solid #333', color: '#999' }}>
          <p>&copy; 2024 Namma Schemes. Government of India. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
