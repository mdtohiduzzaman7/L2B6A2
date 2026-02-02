import { Pool } from "pg";
import config from ".";

export const pool = new Pool({
  connectionString: `${config.connection_str}`,
});

export const initDB = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(20) CHECK (role IN ('admin', 'customer')) NOT NULL

);
    `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS vehicles (
  id SERIAL PRIMARY KEY,
  vehicle_name VARCHAR(150) NOT NULL,
  type VARCHAR(20) CHECK (type IN ('car', 'bike', 'van', 'SUV')) NOT NULL,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  daily_rent_price NUMERIC CHECK (daily_rent_price > 0) NOT NULL,
  availability_status VARCHAR(20) 
    CHECK (availability_status IN ('available', 'booked')) 
    DEFAULT 'available'
);

    `);

  await pool.query(`
  CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES users(id) ON DELETE RESTRICT,
  vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE RESTRICT,
  rent_start_date DATE NOT NULL,
  rent_end_date DATE NOT NULL,
  total_price NUMERIC CHECK (total_price > 0),
  status VARCHAR(20) 
    CHECK (status IN ('active', 'cancelled', 'returned')) 
    DEFAULT 'active'
);

    `);
};
