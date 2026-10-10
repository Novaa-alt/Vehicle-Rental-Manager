import React, { useState, useEffect } from 'react';
import { Users, Zap, Calendar, Check, X, AlertCircle, Sparkles } from 'lucide-react';

export default function VehiclesPage({ apiBaseUrl, user, onBookingCreated }) {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Booking Modal State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Initialize dates
  useEffect(() => {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + 3);

    const formatDate = (d) => d.toISOString().split('T')[0];
    setStartDate(formatDate(today));
    setEndDate(formatDate(future));
  }, []);

  // Fetch available vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiBaseUrl}/vehicles`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to load vehicles');
        setVehicles(data.vehicles || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicles();
  }, [apiBaseUrl]);

  // Filter vehicles
  const filteredVehicles = vehicles.filter((v) => {
    const matchesType =
      selectedType === 'All' ||
      v.type.toLowerCase().includes(selectedType.toLowerCase());
    const matchesSearch =
      v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.brand.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Calculate booking days & total
  const calculateDays = () => {
    if (!startDate || !endDate) return 1;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 1;
  };

  const bookingDays = calculateDays();
  const totalPrice = selectedVehicle ? bookingDays * selectedVehicle.price_per_day : 0;

  // Submit booking
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!selectedVehicle) return;

    setBookingError('');
    setBookingLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          vehicleId: selectedVehicle.id,
          startDate,
          endDate
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');

      setBookingSuccess(true);
      setTimeout(() => {
        setSelectedVehicle(null);
        setBookingSuccess(false);
        if (onBookingCreated) onBookingCreated();
      }, 1500);
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Available Fleet</h1>
        <p className="page-subtitle">
          Choose from premium electric, luxury, and family vehicles for immediate rental.
        </p>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filters-bar">
        <div className="type-pills">
          {['All', 'Electric', 'SUV', 'Sedan'].map((type) => (
            <button
              key={type}
              type="button"
              className={`pill-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        <input
          type="text"
          className="form-input"
          style={{ maxWidth: '240px' }}
          placeholder="Search make or model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Vehicles Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading available fleet...
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="empty-state">
          <p className="empty-title">No vehicles found</p>
          <p className="empty-desc">Try clearing your search filter.</p>
        </div>
      ) : (
        <div className="vehicles-grid">
          {filteredVehicles.map((vehicle) => (
            <div key={vehicle.id} className="vehicle-card">
              <div className="vehicle-img-wrap">
                <img
                  src={vehicle.image_url}
                  alt={vehicle.name}
                  className="vehicle-img"
                  loading="lazy"
                />
                <span className="vehicle-badge">{vehicle.type}</span>
              </div>
              <div className="vehicle-body">
                <div className="vehicle-brand">{vehicle.brand}</div>
                <h3 className="vehicle-name">{vehicle.name}</h3>

                <div className="vehicle-specs">
                  <div className="spec-item">
                    <Users size={15} />
                    <span>{vehicle.seats} Seats</span>
                  </div>
                  <div className="spec-item">
                    <Zap size={15} />
                    <span>Auto Trans</span>
                  </div>
                </div>

                <div className="vehicle-footer">
                  <div className="price-tag">
                    <span className="price-amount">${vehicle.price_per_day}</span>
                    <span className="price-unit">per day</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => {
                      setSelectedVehicle(vehicle);
                      setBookingError('');
                      setBookingSuccess(false);
                    }}
                  >
                    Reserve Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Modal */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={() => setSelectedVehicle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Reserve {selectedVehicle.name}</h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setSelectedVehicle(null)}
              >
                <X size={20} />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="alert alert-success" style={{ textAlign: 'center', display: 'block' }}>
                <Check size={32} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                <strong>Booking Confirmed!</strong>
                <p style={{ marginTop: '0.25rem', fontSize: '0.85rem' }}>
                  Redirecting to your active bookings...
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmBooking}>
                {bookingError && (
                  <div className="alert alert-error">
                    <AlertCircle size={18} />
                    <span>{bookingError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label" htmlFor="start-date">Pickup Date</label>
                  <input
                    id="start-date"
                    type="date"
                    className="form-input"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="end-date">Return Date</label>
                  <input
                    id="end-date"
                    type="date"
                    className="form-input"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>

                <div className="booking-summary-box">
                  <div className="summary-row">
                    <span>Daily Rate</span>
                    <span>${selectedVehicle.price_per_day} / day</span>
                  </div>
                  <div className="summary-row">
                    <span>Duration</span>
                    <span>{bookingDays} {bookingDays === 1 ? 'day' : 'days'}</span>
                  </div>
                  <div className="summary-row total">
                    <span>Total Estimated Cost</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full"
                  disabled={bookingLoading}
                >
                  {bookingLoading ? 'Processing Booking...' : `Confirm & Book for $${totalPrice}`}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
