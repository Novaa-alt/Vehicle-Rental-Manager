const { DatabaseSync } = require('node:sqlite');
const path = require('path');

// Initialize SQLite database file in backend directory
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize 3 core tables: users, vehicles, bookings
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE NOT NULL,
    name TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    type TEXT NOT NULL,
    price_per_day REAL NOT NULL,
    seats INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    vehicle_id INTEGER NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    total_price REAL NOT NULL,
    status TEXT DEFAULT 'Confirmed',
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
  );
`);

// Seed initial vehicles if table is empty
const vehicleCount = db.prepare('SELECT COUNT(*) as count FROM vehicles').get();
if (vehicleCount.count === 0) {
  const insertVehicle = db.prepare(`
    INSERT INTO vehicles (name, brand, type, price_per_day, seats, image_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const initialVehicles = [
    {
      name: 'Model 3 Performance',
      brand: 'Tesla',
      type: 'Electric',
      price_per_day: 95,
      seats: 5,
      image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Mustang Mach-E',
      brand: 'Ford',
      type: 'Electric SUV',
      price_per_day: 85,
      seats: 5,
      image_url: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'BMW 3 Series M-Sport',
      brand: 'BMW',
      type: 'Sedan',
      price_per_day: 75,
      seats: 5,
      image_url: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'RAV4 Hybrid Adventure',
      brand: 'Toyota',
      type: 'SUV',
      price_per_day: 60,
      seats: 5,
      image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Civic Touring Edition',
      brand: 'Honda',
      type: 'Sedan',
      price_per_day: 48,
      seats: 5,
      image_url: 'https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=800&q=80'
    },
    {
      name: 'Range Rover Velar',
      brand: 'Land Rover',
      type: 'Luxury SUV',
      price_per_day: 125,
      seats: 5,
      image_url: 'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80'
    }
  ];

  for (const v of initialVehicles) {
    insertVehicle.run(v.name, v.brand, v.type, v.price_per_day, v.seats, v.image_url);
  }
}

module.exports = db;
