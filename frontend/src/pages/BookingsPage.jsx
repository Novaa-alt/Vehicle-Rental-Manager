import React, { useState, useEffect } from 'react';
import { Calendar, DollarSign, Car, CheckCircle, Clock, AlertCircle } from 'lucide-react';

export default function BookingsPage({ apiBaseUrl, user, onBrowseVehicles }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.id) return;
      try {
        setLoading(true);
        const res = await fetch(`${apiBaseUrl}/bookings?userId=${user.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch bookings');
        setBookings(data.bookings || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [apiBaseUrl, user]);

  const totalSpent = bookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">My Bookings</h1>
          <p className="page-subtitle">
            Manage your ongoing and upcoming vehicle reservations.
          </p>
        </div>

        {bookings.length > 0 && (
          <div style={{ display: 'flex', gap: '1rem', background: 'white', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL RESERVATIONS</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{bookings.length}</div>
            </div>
            <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TOTAL EXPENDITURE</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>${totalSpent}</div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading your reservations...
        </div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">
          <Car className="empty-icon" />
          <h3 className="empty-title">No bookings yet</h3>
          <p className="empty-desc">
            You don't have any vehicle reservations. Explore our fleet to book your next trip.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={onBrowseVehicles}
          >
            Explore Vehicles
          </button>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking.id} className="booking-card">
              <div className="booking-card-left">
                <img
                  src={booking.vehicle_image}
                  alt={booking.vehicle_name}
                  className="booking-thumb"
                />
                <div className="booking-info">
                  <div style={{ fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--primary)' }}>
                    {booking.vehicle_brand} • {booking.vehicle_type}
                  </div>
                  <h4>{booking.vehicle_name}</h4>
                  <div className="booking-dates">
                    <Calendar size={14} />
                    <span>
                      {booking.start_date} to {booking.end_date} ({booking.days} {booking.days === 1 ? 'day' : 'days'})
                    </span>
                  </div>
                </div>
              </div>

              <div className="booking-card-right">
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    ${booking.total_price}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    ${booking.price_per_day} / day
                  </div>
                </div>

                <div className="status-badge">
                  <CheckCircle size={13} />
                  <span>{booking.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
