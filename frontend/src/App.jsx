import React, { useState, useEffect } from 'react';
import { Car, CalendarCheck, LogOut, KeyRound } from 'lucide-react';
import AuthPage from './pages/AuthPage';
import VehiclesPage from './pages/VehiclesPage';
import BookingsPage from './pages/BookingsPage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vrm_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [activeTab, setActiveTab] = useState('vehicles'); // 'vehicles' | 'bookings'

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    localStorage.setItem('vrm_user', JSON.stringify(userData));
    if (token) localStorage.setItem('vrm_token', token);
    setActiveTab('vehicles');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vrm_user');
    localStorage.removeItem('vrm_token');
    setActiveTab('vehicles');
  };

  return (
    <div className="app-container">
      {/* Navigation Bar */}
      <header className="navbar">
        <div className="brand" onClick={() => setActiveTab('vehicles')}>
          <div className="brand-icon">
            <Car size={18} />
          </div>
          <span>Vehicle Rental Manager</span>
        </div>

        {user ? (
          <nav className="nav-links">
            <button
              type="button"
              className={`nav-btn ${activeTab === 'vehicles' ? 'active' : ''}`}
              onClick={() => setActiveTab('vehicles')}
            >
              <Car size={16} />
              <span>Browse Fleet</span>
            </button>

            <button
              type="button"
              className={`nav-btn ${activeTab === 'bookings' ? 'active' : ''}`}
              onClick={() => setActiveTab('bookings')}
            >
              <CalendarCheck size={16} />
              <span>My Bookings</span>
            </button>

            <div className="nav-user">
              <span className="user-badge" title={user.phone}>
                {user.name || user.phone}
              </span>
              <button
                type="button"
                className="logout-btn"
                onClick={handleLogout}
                title="Log Out"
              >
                <LogOut size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                Logout
              </button>
            </div>
          </nav>
        ) : (
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Minimoth OTP Auth
          </div>
        )}
      </header>

      {/* Main Content: Max 3 Pages */}
      <main className="main-content">
        {!user ? (
          // PAGE 1: Authentication with Minimoth OTP
          <AuthPage
            apiBaseUrl={API_BASE_URL}
            onLoginSuccess={handleLoginSuccess}
          />
        ) : activeTab === 'vehicles' ? (
          // PAGE 2: Vehicle Catalog & Instant Booking
          <VehiclesPage
            apiBaseUrl={API_BASE_URL}
            user={user}
            onBookingCreated={() => setActiveTab('bookings')}
          />
        ) : (
          // PAGE 3: My Bookings
          <BookingsPage
            apiBaseUrl={API_BASE_URL}
            user={user}
            onBrowseVehicles={() => setActiveTab('vehicles')}
          />
        )}
      </main>
    </div>
  );
}
