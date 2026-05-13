import 'dotenv/config';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const dbPath = path.join(process.cwd(), 'backend', 'data.db');
const db = new sqlite3.Database(dbPath);

const run = (sql: string, params: any[] = []) =>
  new Promise<void>((res, rej) =>
    db.run(sql, params, (err) => (err ? rej(err) : res()))
  );

async function seed() {
  // Create tables
  await run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('doctor','patient')),
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS callRequests (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    doctorId TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','accepted','declined','completed')),
    requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    acceptedAt DATETIME,
    FOREIGN KEY (patientId) REFERENCES users(id),
    FOREIGN KEY (doctorId) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS callRooms (
    id TEXT PRIMARY KEY,
    requestId TEXT NOT NULL,
    patientId TEXT NOT NULL,
    doctorId TEXT NOT NULL,
    roomId TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK(status IN ('active','ended')),
    startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    endedAt DATETIME,
    duration INTEGER,
    FOREIGN KEY (requestId) REFERENCES callRequests(id),
    FOREIGN KEY (patientId) REFERENCES users(id),
    FOREIGN KEY (doctorId) REFERENCES users(id)
  )`);

  await run(`CREATE TABLE IF NOT EXISTS callHistory (
    id TEXT PRIMARY KEY,
    patientId TEXT NOT NULL,
    doctorId TEXT NOT NULL,
    roomId TEXT NOT NULL,
    startedAt DATETIME NOT NULL,
    endedAt DATETIME NOT NULL,
    durationSeconds INTEGER NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patientId) REFERENCES users(id),
    FOREIGN KEY (doctorId) REFERENCES users(id)
  )`);

  // Seed accounts
  const accounts = [
    { email: 'doctor@asthma.rw', password: 'doctor123', fullName: 'Dr. Jean Mutabazi', role: 'doctor' },
    { email: 'patient@asthma.rw', password: 'patient123', fullName: 'Alice Uwimana', role: 'patient' },
  ];

  for (const acc of accounts) {
    const hashed = await bcrypt.hash(acc.password, 10);
    const id = uuidv4();
    await run(
      `INSERT OR IGNORE INTO users (id, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)`,
      [id, acc.email, hashed, acc.fullName, acc.role]
    );
    console.log(`✓ ${acc.role}: ${acc.email} / ${acc.password}`);
  }

  db.close();
  console.log('\nDatabase ready at backend/data.db');
}

seed().catch((e) => { console.error(e); process.exit(1); });
