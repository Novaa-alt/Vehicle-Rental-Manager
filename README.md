# Vehicle Rental Manager

A minimal, full-stack vehicle rental management web application built for a 45-minute workshop. It features passwordless authentication using OTP via the **Minimoth API** (WhatsApp & SMS delivery), fleet browsing, and instant booking reservation management.

---

## 🚀 Architecture & Constraints

- **Frontend Pages (Max 3):**
  1. **Authentication Page (`AuthPage.jsx`)**: Fast phone number login/registration with OTP sent via WhatsApp/SMS using Minimoth.
  2. **Fleet Catalog & Booking Page (`VehiclesPage.jsx`)**: Browse vehicles, filter by vehicle type (Electric, SUV, Sedan), and reserve dates with automatic duration & price calculation.
  3. **My Bookings Page (`BookingsPage.jsx`)**: View confirmed reservations, duration, and total rental costs.

- **Backend API Endpoints (Max 5):**
  1. `POST /api/auth/send-otp`: Sends a 6-digit OTP code to the renter's phone number via Minimoth.
  2. `POST /api/auth/verify-otp`: Validates the OTP code via Minimoth and creates or retrieves the user profile.
  3. `GET /api/vehicles`: Retrieves available rental vehicles (auto-seeded).
  4. `GET /api/bookings`: Retrieves reservations for the authenticated user.
  5. `POST /api/bookings`: Validates reservation dates and records a new booking.

- **Database Entities / Models (Max 3):**
  1. **`users`**: `id`, `phone`, `name`, `created_at`
  2. **`vehicles`**: `id`, `name`, `brand`, `type`, `price_per_day`, `seats`, `image_url`, `created_at`
  3. **`bookings`**: `id`, `user_id`, `vehicle_id`, `start_date`, `end_date`, `days`, `total_price`, `status`, `created_at`

---

## 🛠 Tech Stack

- **Frontend:** React 18, Vite, Lucide Icons, Vanilla CSS (clean, responsive, modern design system)
- **Backend:** Node.js, Express, native `node:sqlite` (zero heavy database driver compilation)
- **Authentication:** [Minimoth API](https://minimoth.dev) for WhatsApp and SMS OTP delivery

---

## 📁 Project Structure

```text
├── backend/
│   ├── .env                  # Backend environment config (includes Minimoth API key)
│   ├── .env.example          # Environment template
│   ├── package.json
│   ├── server.js             # 5 Express endpoints & validation
│   └── db.js                 # SQLite schema & vehicle seeder
├── frontend/
│   ├── .env                  # Frontend environment config (VITE_API_URL)
│   ├── .env.example          # Frontend template
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── App.jsx           # App shell & routing
│       ├── index.css         # Styling system
│       ├── main.jsx
│       └── pages/
│           ├── AuthPage.jsx       # Page 1: Minimoth OTP Login
│           ├── VehiclesPage.jsx   # Page 2: Vehicle Catalog & Booking
│           └── BookingsPage.jsx   # Page 3: My Bookings
└── README.md
```

---

## ⚡ Quick Start

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Verify .env exists (sample provided in .env.example)
# MINIMOTH_API_KEY=mm_live_...
# MINIMOTH_API_URL=https://api.minimoth.dev
# PORT=5000

# Start server
npm start
```
The backend will run on `http://localhost:5000`.

### 2. Frontend Setup

In a new terminal window:

```bash
cd frontend

# Install dependencies
npm install

# Verify .env exists
# VITE_API_URL=http://localhost:5000/api

# Start Vite dev server
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 📱 Minimoth Authentication Flow

1. Enter your phone number with country code (e.g. `+919876543210` or `+14155552671`).
2. Minimoth dispatches a 6-digit OTP directly to your WhatsApp (or SMS).
3. Enter the 6-digit verification code.
4. Once verified, you are logged in and can browse vehicles and confirm reservations immediately.
