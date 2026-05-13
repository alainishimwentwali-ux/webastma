import { Router } from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import bcrypt from 'bcryptjs';
import {
  createUser,
  getUserByEmail,
  getUserById,
  getAllDoctors,
  createCallRequest,
  getPendingRequests,
  updateCallRequestStatus,
  getCallRequest,
  createCallRoom,
  getCallRoom,
  endCallRoom,
  getCallHistory,
  db
} from './db.ts';

import { generateToken, authMiddleware, doctorMiddleware } from './auth.ts';

const router = Router();

router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, fullName, role } = req.body as any;
    if (!email || !password || !fullName || !role) { res.status(400).json({ error: 'Missing required fields' }); return; }
    if (!['doctor', 'patient'].includes(role)) { res.status(400).json({ error: 'Invalid role' }); return; }
    const existing = await getUserByEmail(email);
    if (existing) { res.status(409).json({ error: 'User already exists' }); return; }
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = await createUser(email, hashedPassword, fullName, role);
    const token = generateToken(userId, role);
    res.status(201).json({ userId, token, role });
  } catch (error: any) {
    console.error('Register error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Registration failed' });
  }
});

router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body as any;
    if (!email || !password) { res.status(400).json({ error: 'Missing email or password' }); return; }
    const user = await getUserByEmail(email);
    if (!user) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) { res.status(401).json({ error: 'Invalid credentials' }); return; }
    const token = generateToken(user.id, user.role);
    res.json({ userId: user.id, token, role: user.role, fullName: user.fullName });
  } catch (error: any) {
    console.error('Login error:', error?.message || error);
    res.status(500).json({ error: error?.message || 'Login failed' });
  }
});

router.get('/auth/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await getUserById((req as any).userId);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

router.get('/doctors', authMiddleware, async (_req: Request, res: Response) => {
  try {
    const doctors = await getAllDoctors();
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch doctors' });
  }
});

router.post('/calls/request', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { doctorId, reason } = req.body as any;
    const patientId = (req as any).userId;
    if (!doctorId || !reason) { res.status(400).json({ error: 'Missing required fields' }); return; }
    const requestId = await createCallRequest(patientId, doctorId, reason);
    res.status(201).json({ requestId });
  } catch (error) {
    console.error('Call request error:', error);
    res.status(500).json({ error: 'Failed to create call request' });
  }
});

router.get('/calls/pending', authMiddleware, async (req: Request, res: Response) => {
  try {
    const doctorId = (req as any).userId;
    const pending = await getPendingRequests(doctorId);
    res.json(pending);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

router.post('/calls/accept', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.body as any;
    const doctorId = (req as any).userId;
    if (!requestId) { res.status(400).json({ error: 'Missing requestId' }); return; }
    const request = await getCallRequest(requestId);
    if (!request || request.doctorId !== doctorId) { res.status(403).json({ error: 'Unauthorized' }); return; }
    await updateCallRequestStatus(requestId, 'accepted');
    const roomId = await createCallRoom(requestId, request.patientId, doctorId);
    res.json({ roomId });
  } catch (error) {
    console.error('Accept call error:', error);
    res.status(500).json({ error: 'Failed to accept call' });
  }
});

router.post('/calls/decline', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { requestId } = req.body as any;
    const doctorId = (req as any).userId;
    if (!requestId) { res.status(400).json({ error: 'Missing requestId' }); return; }
    const request = await getCallRequest(requestId);
    if (!request || request.doctorId !== doctorId) { res.status(403).json({ error: 'Unauthorized' }); return; }
    await updateCallRequestStatus(requestId, 'declined');
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to decline call' });
  }
});

router.get('/calls/room/:roomId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { roomId } = (req as any).params;
    const room = await getCallRoom(roomId);
    if (!room) { res.status(404).json({ error: 'Room not found' }); return; }
    const userId = (req as any).userId;
    if (room.patientId !== userId && room.doctorId !== userId) { res.status(403).json({ error: 'Unauthorized' }); return; }
    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch room' });
  }
});

router.post('/calls/end', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { roomId } = req.body as any;
    if (!roomId) { res.status(400).json({ error: 'Missing roomId' }); return; }
    await endCallRoom(roomId);
    res.json({ success: true });
  } catch (error) {
    console.error('End call error:', error);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

router.get('/calls/history', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    const history = await getCallHistory(userId);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch call history' });
  }
});

// Doctor: get all patients (stub for now)
router.get('/doctors/patients', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    if (userRole !== 'doctor') { res.status(403).json({ error: 'Doctors only' }); return; }
    // Return empty for now — can be extended to track patient assignments
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Doctor: get all symptom submissions (stub for now)
router.get('/symptoms/all', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    if (userRole !== 'doctor') { res.status(403).json({ error: 'Doctors only' }); return; }
    // Return empty for now — can be extended to store symptom records in DB
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch symptoms' });
  }
});

// Doctor: send notification/recommendation to patient (stub for now)
router.post('/doctor/notify', authMiddleware, async (req: Request, res: Response) => {
  try {
    const userRole = (req as any).userRole;
    if (userRole !== 'doctor') { res.status(403).json({ error: 'Doctors only' }); return; }
    const { patientId, message } = req.body as any;
    if (!patientId || !message) { res.status(400).json({ error: 'Missing fields' }); return; }
    // Stub: in production, store this in a notifications table
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

router.get('/doctor/notifications', authMiddleware, async (req: Request, res: Response) => {
  const userId = (req as any).userId;
  const userRole = (req as any).userRole;
  if (!userId) { res.status(401).json({ error: 'Unauthorized' }); return; }
  if (userRole !== 'doctor') { res.json({ notifications: [] }); return; }

  let callNotifs: any[] = [];
  try {
    const pending = await getPendingRequests(userId);
    callNotifs = pending.map((r: any) => ({
      id: `call-${r.id}`,
      title: '📹 Video Call Request',
      message: `${r.fullName || 'A patient'} is requesting a video call: "${r.reason}"`,
      createdAt: r.requestedAt,
      type: 'call',
      requestId: r.id,
    }));
  } catch (err: any) {
    console.error('getPendingRequests error:', err?.message || err);
  }

  let consultNotifs: any[] = [];
  try {
    const storagePath = path.join(__dirname, 'storage.json');
    const storage = JSON.parse(fs.readFileSync(storagePath, 'utf-8'));
    consultNotifs = (storage.consultationRecords || []).map((r: any) => ({
      id: r.id,
      title: 'New Patient Consultation',
      message: r.symptoms ? `Symptoms reported: ${r.symptoms.trim()}` : 'Patient submitted a consultation request.',
      createdAt: r.createdAt,
      type: 'consultation',
    }));
  } catch {}

  const all = [...callNotifs, ...consultNotifs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json({ notifications: all.slice(0, 15) });
});

// Patient: check if any of their call requests have been accepted (so they can join)
router.get('/calls/patient-status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const patientId = (req as any).userId;
    const rows: any[] = await new Promise((resolve, reject) => {
      db.all(
        `SELECT cr.id, cr.status, cr.reason, cr.requestedAt, cr.doctorId,
                u.fullName as doctorName, rm.roomId
         FROM callRequests cr
         JOIN users u ON cr.doctorId = u.id
         LEFT JOIN callRooms rm ON rm.requestId = cr.id AND rm.status = 'active'
         WHERE cr.patientId = ? AND cr.status IN ('pending', 'accepted')
         ORDER BY cr.requestedAt DESC LIMIT 10`,
        [patientId],
        (err: any, r: any) => { if (err) reject(err); else resolve(r || []); }
      );
    });
    res.json({ requests: rows });
  } catch (error: any) {
    console.error('Patient status error:', error?.message || error);
    res.status(500).json({ error: 'Failed to fetch call status' });
  }
});

export default router;
