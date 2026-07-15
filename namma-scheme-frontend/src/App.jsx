import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ChatBot from './components/ChatBot';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import BrowseSchemes from './pages/BrowseSchemes';
import SchemeDetails from './pages/SchemeDetails';
import EligibilityChecker from './pages/EligibilityChecker';
import Login from './pages/Login';
import Register from './pages/Register';
import ViewSchemes from './pages/ViewSchemes';
import Profile from './pages/Profile';
import EligibleSchemes from './pages/EligibleSchemes';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import './index.css';


// Enhanced Components
function AppContent() {
  const location = useLocation();
  const isHomepage = location.pathname === '/';

  return (
    <div className="app-container">
      <Navbar />
      <main className="main-content" style={{ minHeight: '80vh', padding: '2rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/schemes" element={<BrowseSchemes />} />
          <Route path="/schemes/:id" element={<SchemeDetails />} />
          <Route path="/scheme-details/:id" element={<SchemeDetails />} />
          <Route path="/eligibility" element={<EligibilityChecker />} />
          <Route path="/eligible-schemes" element={<EligibleSchemes />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/view-schemes" element={<ViewSchemes />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Routes>
      </main>
      {isHomepage && <Footer />}
      <ChatBot />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
