import React, { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const token = localStorage.getItem('adminToken');
  const admin = JSON.parse(localStorage.getItem('admin') || '{}');

  useEffect(() => {
    if (!token) return;
    fetchStats();
  }, [token]);

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:8001/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
    window.location.href = '/admin/login';
  };

  if (!token) return <Navigate to="/admin/login" />;
  if (loading) return <div style={{ textAlign: 'center', padding: '4rem' }}>Loading...</div>;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', padding: '2rem' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', background: 'white', padding: '1.5rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '2rem', color: '#333' }}>🔐 Admin Dashboard</h1>
            <p style={{ margin: '0.5rem 0 0', color: '#666' }}>Welcome, {admin.username}</p>
          </div>
          <button onClick={handleLogout} style={{ padding: '0.75rem 1.5rem', background: '#EF4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
            Logout
          </button>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #667eea' }}>
            <h3 style={{ margin: 0, color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Users</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#667eea' }}>{stats?.totalUsers || 0}</p>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #10B981' }}>
            <h3 style={{ margin: 0, color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Schemes</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#10B981' }}>{stats?.totalSchemes || 0}</p>
          </div>

          <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderLeft: '4px solid #F59E0B' }}>
            <h3 style={{ margin: 0, color: '#666', fontSize: '0.9rem', textTransform: 'uppercase' }}>Total Applications</h3>
            <p style={{ margin: '0.5rem 0 0', fontSize: '2.5rem', fontWeight: 'bold', color: '#F59E0B' }}>{stats?.totalApplications || 0}</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{ background: 'white', padding: '2rem', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h2 style={{ margin: '0 0 1.5rem', color: '#333' }}>Quick Actions</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <button onClick={() => navigate('/admin/users')} style={{ padding: '1rem', background: '#667eea', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              👥 View Users
            </button>
            <button onClick={() => navigate('/admin/schemes')} style={{ padding: '1rem', background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              📋 View Schemes
            </button>
            <button onClick={() => navigate('/admin/applications')} style={{ padding: '1rem', background: '#F59E0B', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
              📝 View Applications
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
