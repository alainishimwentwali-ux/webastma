import sqlite3 from 'sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const dbPath = path.join(process.cwd(), 'backend', 'data.db');
const db = new sqlite3.Database(dbPath);

export const initializeDatabase = async () => {
  return new Promise<void>((resolve, reject) => {
    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          fullName TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('doctor', 'patient')),
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS callRequests (
          id TEXT PRIMARY KEY,
          patientId TEXT NOT NULL,
          doctorId TEXT NOT NULL,
          reason TEXT NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('pending', 'accepted', 'declined', 'completed')),
          requestedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          acceptedAt DATETIME,
          FOREIGN KEY (patientId) REFERENCES users(id),
          FOREIGN KEY (doctorId) REFERENCES users(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS callRooms (
          id TEXT PRIMARY KEY,
          requestId TEXT NOT NULL,
          patientId TEXT NOT NULL,
          doctorId TEXT NOT NULL,
          roomId TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL CHECK(status IN ('active', 'ended')),
          startedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          endedAt DATETIME,
          duration INTEGER,
          FOREIGN KEY (requestId) REFERENCES callRequests(id),
          FOREIGN KEY (patientId) REFERENCES users(id),
          FOREIGN KEY (doctorId) REFERENCES users(id)
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS callHistory (
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
        )
      `, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  });
};

export const createUser = (email: string, password: string, fullName: string, role: 'doctor' | 'patient'): Promise<string> => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(
      'INSERT INTO users (id, email, password, fullName, role) VALUES (?, ?, ?, ?, ?)',
      [id, email, password, fullName, role],
      (err) => { if (err) reject(err); else resolve(id); }
    );
  });
};

export const getUserByEmail = (email: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

export const getUserById = (id: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, email, fullName, role FROM users WHERE id = ?', [id], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

export const getAllDoctors = (): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, email, fullName FROM users WHERE role = "doctor"', (err, rows) => {
      if (err) reject(err); else resolve(rows || []);
    });
  });
};

export const createCallRequest = (patientId: string, doctorId: string, reason: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const id = uuidv4();
    db.run(
      'INSERT INTO callRequests (id, patientId, doctorId, reason, status) VALUES (?, ?, ?, ?, ?)',
      [id, patientId, doctorId, reason, 'pending'],
      (err) => { if (err) reject(err); else resolve(id); }
    );
  });
};

export const getPendingRequests = (doctorId: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT cr.id, cr.patientId, cr.reason, cr.requestedAt, u.fullName, u.email 
       FROM callRequests cr 
       JOIN users u ON cr.patientId = u.id 
       WHERE cr.doctorId = ? AND cr.status = 'pending'
       ORDER BY cr.requestedAt DESC`,
      [doctorId],
      (err, rows) => { if (err) reject(err); else resolve(rows || []); }
    );
  });
};

export const updateCallRequestStatus = (requestId: string, status: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const acceptedAt = status === 'accepted' ? new Date().toISOString() : null;
    db.run(
      'UPDATE callRequests SET status = ?, acceptedAt = ? WHERE id = ?',
      [status, acceptedAt, requestId],
      (err) => { if (err) reject(err); else resolve(); }
    );
  });
};

export const getCallRequest = (requestId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM callRequests WHERE id = ?', [requestId], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

export const createCallRoom = (requestId: string, patientId: string, doctorId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const roomId = uuidv4();
    const id = uuidv4();
    db.run(
      'INSERT INTO callRooms (id, requestId, patientId, doctorId, roomId, status) VALUES (?, ?, ?, ?, ?, ?)',
      [id, requestId, patientId, doctorId, roomId, 'active'],
      (err) => { if (err) reject(err); else resolve(roomId); }
    );
  });
};

export const getCallRoom = (roomId: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM callRooms WHERE roomId = ?', [roomId], (err, row) => {
      if (err) reject(err); else resolve(row);
    });
  });
};

export const endCallRoom = (roomId: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM callRooms WHERE roomId = ?', [roomId], (err, room: any) => {
      if (err) { reject(err); return; }
      const duration = Math.floor((Date.now() - new Date(room.startedAt).getTime()) / 1000);
      db.run(
        'UPDATE callRooms SET status = ?, endedAt = ?, duration = ? WHERE roomId = ?',
        ['ended', new Date().toISOString(), duration, roomId],
        (err) => {
          if (err) { reject(err); return; }
          const historyId = uuidv4();
          db.run(
            `INSERT INTO callHistory (id, patientId, doctorId, roomId, startedAt, endedAt, durationSeconds)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [historyId, room.patientId, room.doctorId, roomId, room.startedAt, new Date().toISOString(), duration],
            (err) => { if (err) reject(err); else resolve(); }
          );
        }
      );
    });
  });
};

export const getCallHistory = (userId: string): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT ch.*, u.fullName FROM callHistory ch
       JOIN users u ON (ch.doctorId = u.id)
       WHERE ch.patientId = ?
       UNION ALL
       SELECT ch.*, u.fullName FROM callHistory ch
       JOIN users u ON (ch.patientId = u.id)
       WHERE ch.doctorId = ?
       ORDER BY ch.startedAt DESC LIMIT 50`,
      [userId, userId],
      (err, rows) => { if (err) reject(err); else resolve(rows || []); }
    );
  });
};

export { db };
