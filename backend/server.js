require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY;
const MINIMOTH_API_URL = process.env.MINIMOTH_API_URL || 'https://api.minimoth.dev';

// Middleware
app.use(cors());
app.use(express.json());

// Helper: Ensure phone number is E.164 formatted (defaults to +91 for 10-digit Indian numbers if prefix missing)
function formatPhoneNumber(phone) {
  if (!phone) return '';
  const cleaned = phone.replace(/[\s\-()]/g, '');
  if (cleaned.startsWith('+')) return cleaned;
  if (cleaned.length === 10) return `+91${cleaned}`;
  return `+${cleaned}`;
}

// -------------------------------------------------------------
// ENDPOINT 1: Send OTP via Minimoth API
// -------------------------------------------------------------
app.post('/api/auth/send-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required.' });
    }

    const formattedPhone = formatPhoneNumber(phone);
    if (formattedPhone.length < 8) {
      return res.status(400).json({ error: 'Please enter a valid phone number with country code.' });
    }

    const response = await fetch(`${MINIMOTH_API_URL}/v1/otp/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': MINIMOTH_API_KEY
      },
      body: JSON.stringify({ phone: formattedPhone })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Failed to send OTP via Minimoth.'
      });
    }

    return res.json({
      success: true,
      message: 'OTP sent successfully to your WhatsApp / SMS.',
      phone: formattedPhone,
      otp_id: data.otp_id
    });
  } catch (err) {
    console.error('Error in /api/auth/send-otp:', err);
    return res.status(500).json({ error: 'Internal server error while sending OTP.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 2: Verify OTP via Minimoth API & User Registration/Login
// -------------------------------------------------------------
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { phone, code, name } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: 'Phone number and 6-digit OTP code are required.' });
    }

    const formattedPhone = formatPhoneNumber(phone);

    const response = await fetch(`${MINIMOTH_API_URL}/v1/otp/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': MINIMOTH_API_KEY
      },
      body: JSON.stringify({ phone: formattedPhone, code: code.trim() })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data.error || 'Invalid or expired OTP code.'
      });
    }

    // OTP Verified! Find or register user in database
    let user = db.prepare('SELECT * FROM users WHERE phone = ?').get(formattedPhone);

    if (!user) {
      const displayName = name ? name.trim() : `Renter-${formattedPhone.slice(-4)}`;
      const insert = db.prepare('INSERT INTO users (phone, name) VALUES (?, ?)');
      const result = insert.run(formattedPhone, displayName);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    } else if (name && (!user.name || user.name.startsWith('Renter-'))) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), user.id);
      user.name = name.trim();
    }

    return res.json({
      success: true,
      message: 'Authentication successful.',
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name
      },
      token: data.access_token || `session_${user.id}_${Date.now()}`
    });
  } catch (err) {
    console.error('Error in /api/auth/verify-otp:', err);
    return res.status(500).json({ error: 'Internal server error while verifying OTP.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 3: List all available vehicles
// -------------------------------------------------------------
app.get('/api/vehicles', (req, res) => {
  try {
    const vehicles = db.prepare('SELECT * FROM vehicles ORDER BY id ASC').all();
    return res.json({ vehicles });
  } catch (err) {
    console.error('Error in /api/vehicles:', err);
    return res.status(500).json({ error: 'Failed to fetch vehicles.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 4: Get bookings for a user
// -------------------------------------------------------------
app.get('/api/bookings', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required to view bookings.' });
    }

    const bookings = db.prepare(`
      SELECT 
        b.id,
        b.user_id,
        b.vehicle_id,
        b.start_date,
        b.end_date,
        b.days,
        b.total_price,
        b.status,
        b.created_at,
        v.name AS vehicle_name,
        v.brand AS vehicle_brand,
        v.type AS vehicle_type,
        v.image_url AS vehicle_image,
        v.price_per_day
      FROM bookings b
      JOIN vehicles v ON b.vehicle_id = v.id
      WHERE b.user_id = ?
      ORDER BY b.id DESC
    `).all(userId);

    return res.json({ bookings });
  } catch (err) {
    console.error('Error in /api/bookings:', err);
    return res.status(500).json({ error: 'Failed to fetch bookings.' });
  }
});

// -------------------------------------------------------------
// ENDPOINT 5: Create a new vehicle booking
// -------------------------------------------------------------
app.post('/api/bookings', (req, res) => {
  try {
    const { userId, vehicleId, startDate, endDate } = req.body;

    if (!userId || !vehicleId || !startDate || !endDate) {
      return res.status(400).json({ error: 'userId, vehicleId, startDate, and endDate are all required.' });
    }

    const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Selected vehicle not found.' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: 'Invalid start date or end date format.' });
    }

    if (end < start) {
      return res.status(400).json({ error: 'End date cannot be earlier than start date.' });
    }

    const diffTime = Math.abs(end - start);
    const calculatedDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const totalPrice = calculatedDays * vehicle.price_per_day;

    const insert = db.prepare(`
      INSERT INTO bookings (user_id, vehicle_id, start_date, end_date, days, total_price, status)
      VALUES (?, ?, ?, ?, ?, ?, 'Confirmed')
    `);

    const result = insert.run(userId, vehicleId, startDate, endDate, calculatedDays, totalPrice);
    const newBooking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(result.lastInsertRowid);

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: {
        ...newBooking,
        vehicle_name: vehicle.name,
        vehicle_brand: vehicle.brand,
        vehicle_image: vehicle.image_url
      }
    });
  } catch (err) {
    console.error('Error in POST /api/bookings:', err);
    return res.status(500).json({ error: 'Failed to create booking.' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Vehicle Rental Manager Backend running on http://localhost:${PORT}`);
});
