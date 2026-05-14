import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import routes from './routes.ts';
import weatherRoutes from './weather.ts';
import { initializeDatabase } from './db.ts';
import { setupSocketIO } from './socket.ts';




const app = express();
const port = Number(process.env.PORT || 4000);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const allowedOrigins = [frontendUrl, 'http://localhost:5174', 'http://localhost:5175'];

app.use(cors({ origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)) }));
app.use(express.json());
app.use('/api', routes);
app.use('/api', weatherRoutes);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST']
  }
});

const startServer = async () => {
  await initializeDatabase();
  setupSocketIO(io);
  server.on('error', (err: any) => {
    if (err?.code === 'EADDRINUSE') {
      console.error(`Port ${port} is already in use. Kill the process and retry.`);
      process.exit(1);
    }
  });

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
};

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

