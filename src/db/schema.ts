import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, '../../dealflow.db');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Initialize Schema
export function initDb() {
  // Check if we need to migrate or reset
  // For this demo, we'll ensure the users table has dealership_id as nullable
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const dealershipIdCol = tableInfo.find(c => c.name === 'dealership_id');
  
  const dealerTableInfo = db.prepare("PRAGMA table_info(dealerships)").all() as any[];
  const dealerStatusCol = dealerTableInfo.find(c => c.name === 'status');
  
  const commTableInfo = db.prepare("PRAGMA table_info(communications)").all() as any[];
  const subjectCol = commTableInfo.find(c => c.name === 'subject');
  
  const userLocTableInfo = db.prepare("PRAGMA table_info(user_locations)").all() as any[];
  
  if ((dealershipIdCol?.notnull === 1) || !dealerStatusCol || !subjectCol || userLocTableInfo.length === 0) {
    console.log('Migrating database: dropping old tables for schema update');
    db.exec(`
      DROP TABLE IF EXISTS tasks;
      DROP TABLE IF EXISTS mentions;
      DROP TABLE IF EXISTS communications;
      DROP TABLE IF EXISTS leads;
      DROP TABLE IF EXISTS user_locations;
      DROP TABLE IF EXISTS users;
      DROP TABLE IF EXISTS locations;
      DROP TABLE IF EXISTS roles;
      DROP TABLE IF EXISTS dealerships;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS dealerships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      status TEXT DEFAULT 'active', -- 'active', 'deleted'
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS locations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealership_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      address TEXT,
      is_default INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active', -- 'active', 'deleted'
      FOREIGN KEY (dealership_id) REFERENCES dealerships(id)
    );

    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealership_id INTEGER,
      role_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dealership_id) REFERENCES dealerships(id),
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS user_locations (
      user_id INTEGER NOT NULL,
      location_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, location_id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (location_id) REFERENCES locations(id)
    );

    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dealership_id INTEGER NOT NULL,
      location_id INTEGER,
      assigned_user_id INTEGER,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      source TEXT,
      status TEXT DEFAULT 'new',
      vehicle_interest TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dealership_id) REFERENCES dealerships(id),
      FOREIGN KEY (location_id) REFERENCES locations(id),
      FOREIGN KEY (assigned_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS communications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER NOT NULL,
      user_id INTEGER,
      type TEXT NOT NULL, -- 'email', 'sms', 'call', 'internal'
      direction TEXT NOT NULL, -- 'inbound', 'outbound'
      subject TEXT,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS mentions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      communication_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_read INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (communication_id) REFERENCES communications(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      lead_id INTEGER,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      due_date DATETIME,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Seed Roles
  const roles = ['super_admin', 'principal', 'admin', 'user'];
  const insertRole = db.prepare('INSERT OR IGNORE INTO roles (name) VALUES (?)');
  roles.forEach(role => insertRole.run(role));

  // Seed Super Admin if empty
  const superAdminRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('super_admin') as any;
  const superAdminCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE role_id = ?').get(superAdminRole.id) as { count: number };
  
  if (superAdminCount.count === 0) {
    const adminHash = bcrypt.hashSync('superadmin123', 10);
    db.prepare('INSERT INTO users (role_id, name, email, password) VALUES (?, ?, ?, ?)')
      .run(superAdminRole.id, 'Super Admin', 'super@dealflow.com', adminHash);
  }

  // Seed initial dealership and principal if empty
  const dealerCount = db.prepare('SELECT COUNT(*) as count FROM dealerships').get() as { count: number };
  if (dealerCount.count === 0) {
    const dealerResult = db.prepare('INSERT INTO dealerships (name) VALUES (?)').run('Default Motors');
    const dealerId = dealerResult.lastInsertRowid;

    // Seed Location
    const locResult = db.prepare('INSERT INTO locations (dealership_id, name, address, is_default) VALUES (?, ?, ?, 1)')
      .run(dealerId, 'Main Branch', '123 Dealer Row, Motor City, MC 12345');
    const locationId = locResult.lastInsertRowid;
    
    const principalRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('principal') as any;
    const adminHash = bcrypt.hashSync('principal123', 10);
    
    const userResult = db.prepare('INSERT INTO users (dealership_id, role_id, name, email, password) VALUES (?, ?, ?, ?, ?)')
      .run(dealerId, principalRole.id, 'Principal User', 'principal@dealflow.com', adminHash); 
    const userId = userResult.lastInsertRowid;

    // Link principal to location
    db.prepare('INSERT INTO user_locations (user_id, location_id) VALUES (?, ?)').run(userId, locationId);

    // Seed Leads
    const insertLead = db.prepare('INSERT INTO leads (dealership_id, location_id, first_name, last_name, email, phone, source, vehicle_interest, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    insertLead.run(dealerId, locationId, 'John', 'Doe', 'john@example.com', '555-0101', 'Web Inquiry', '2024 Ford F-150', 'new');
    insertLead.run(dealerId, locationId, 'Jane', 'Smith', 'jane@example.com', '555-0102', 'Walk-in', '2024 Mustang GT', 'contacted');
    insertLead.run(dealerId, locationId, 'Robert', 'Brown', 'robert@example.com', '555-0103', 'Referral', '2024 Explorer', 'new');
  }
}

export default db;
