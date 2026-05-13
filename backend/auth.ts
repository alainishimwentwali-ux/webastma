import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export const generateToken = (userId: string, role?: string): string => {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
};

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = (req.headers as any).authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'No token provided' }); return;
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401).json({ error: 'Invalid or expired token' }); return;
  }

  (req as any).userId = decoded.userId;
  (req as any).userRole = decoded.role;
  next();
};

export const doctorMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = (req.headers as any).authorization?.split(' ')[1];
  if (!token) { res.status(401).json({ error: 'No token provided' }); return; }

  const decoded = verifyToken(token);
  if (!decoded) { res.status(401).json({ error: 'Invalid or expired token' }); return; }
  if (decoded.role !== 'doctor') { res.status(403).json({ error: 'Access restricted to doctors only' }); return; }

  (req as any).userId = decoded.userId;
  next();
};
