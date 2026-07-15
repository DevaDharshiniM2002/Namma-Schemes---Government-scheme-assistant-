import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function ViewSchemes() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});

  useEffect(() => {
    axios.get('http://localhost:8001/api/schemes')
      .then(res => {
        setSchemes(res.data);
        
        // Calculate statistics
        const categories = {};
        const states = {};
        res.data.forEach(scheme => {
          categories[scheme.category] = (categories[scheme.category] || 0) + 1;
          states[scheme.state] = (states[scheme.state] || 0) + 1;
        });
        
        setStats({ categories, states, total: res.data.length });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading schemes...</div>;
  }

  return (
    <div className="container" style={{ paddingTop: '2rem' }}>
      <h1 style={{ marginBottom: '2rem' }}>MongoDB Schemes Database</h1>
      
      {/* Statistics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '3rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>{stats.total}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Total Schemes</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: 'var(--secondary-color)', marginBottom: '0.5rem' }}>{Object.keys(stats.categories || {}).length}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Categories</p>
        </div>
        <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>
          <h2 style={{ fontSize: '3rem', color: '#EC4899', marginBottom: '0.5rem' }}>{Object.keys(stats.states || {}).length}</h2>
          <p style={{ color: 'var(--text-muted)' }}>States</p>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>Schemes by Category</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
          {Object.entries(stats.categories || {}).map(([category, count]) => (
            <div key={category} style={{ padding: '1rem', background: 'var(--bg-surface)', borderRadius: '8px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{category}</div>
              <div style={{ color: 'var(--text-muted)' }}>{count} schemes</div>
            </div>
          ))}
        </div>
      </div>

      {/* All Schemes Table */}
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h3 style={{ marginBottom: '1.5rem' }}>All Schemes ({schemes.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', textAlign: 'left' }}>#</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Scheme Name</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>State</th>
                <th style={{ padding: '1rem', textAlign: 'left' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {schemes.map((scheme, idx) => (
                <tr key={scheme._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem' }}>{idx + 1}</td>
                  <td style={{ padding: '1rem', fontWeight: 600 }}>{scheme.name}</td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.75rem', 
                      background: 'var(--primary-color)', 
                      color: 'white', 
                      borderRadius: '12px', 
                      fontSize: '0.85rem' 
                    }}>
                      {scheme.category}
                    </span>
                  </td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)' }}>{scheme.state}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-muted)', maxWidth: '300px' }}>
                    {scheme.description?.substring(0, 100)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
