import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from './auth.ts';


interface SocketUser {
  userId: string;
  roomId: string;
  role: 'doctor' | 'patient';
}

const socketUsers = new Map<string, SocketUser>();

export const setupSocketIO = (io: SocketIOServer) => {
  // Middleware to authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication required'));
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return next(new Error('Invalid token'));
    }

    socket.data.userId = decoded.userId;
    next();
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`User ${userId} connected`);

    // Join call room
    socket.on('join-call', (data: { roomId: string; role: 'doctor' | 'patient' }) => {
      const { roomId, role } = data;
      
      socket.join(roomId);
      socketUsers.set(socket.id, { userId, roomId, role });

      console.log(`${role} ${userId} joined room ${roomId}`);

      // Notify other user in the room
      socket.to(roomId).emit('user-joined', {
        role,
        userId,
        socketId: socket.id
      });
    });

    // Handle WebRTC offer
    socket.on('offer', (data: { offer: RTCSessionDescriptionInit; to: string }) => {
      const { offer, to } = data;
      
      io.to(to).emit('offer', {
        offer,
        from: socket.id,
        fromUserId: userId
      });
    });

    // Handle WebRTC answer
    socket.on('answer', (data: { answer: RTCSessionDescriptionInit; to: string }) => {
      const { answer, to } = data;
      
      io.to(to).emit('answer', {
        answer,
        from: socket.id,
        fromUserId: userId
      });
    });

    // Handle ICE candidate
    socket.on('ice-candidate', (data: { candidate: RTCIceCandidateInit; to: string }) => {
      const { candidate, to } = data;
      
      io.to(to).emit('ice-candidate', {
        candidate,
        from: socket.id
      });
    });

    // Send call status updates
    socket.on('call-status', (data: { status: string; roomId: string }) => {
      socket.to(data.roomId).emit('call-status', {
        status: data.status,
        from: userId
      });
    });

    // Send chat message during call
    socket.on('message', (data: { roomId: string; text: string; sender: string }) => {
      io.to(data.roomId).emit('message', {
        text: data.text,
        sender: data.sender,
        timestamp: new Date().toISOString()
      });
    });

    // Leave call room
    socket.on('leave-call', (data: { roomId: string }) => {
      const { roomId } = data;
      
      socket.leave(roomId);
      socketUsers.delete(socket.id);

      socket.to(roomId).emit('user-left', {
        userId,
        socketId: socket.id
      });

      console.log(`User ${userId} left room ${roomId}`);
    });

    // Get users in room
    socket.on('get-room-users', (data: { roomId: string }) => {
      const { roomId } = data;
      const room = io.sockets.adapter.rooms.get(roomId);
      const userCount = room ? room.size : 0;

      socket.emit('room-users-count', { count: userCount });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      const user = socketUsers.get(socket.id);
      if (user) {
        console.log(`User ${userId} disconnected from room ${user.roomId}`);
        socket.to(user.roomId).emit('user-disconnected', {
          userId,
          socketId: socket.id
        });
        socketUsers.delete(socket.id);
      }
      console.log(`User ${userId} disconnected`);
    });

    // Error handling
    socket.on('error', (error: any) => {
      console.error(`Socket error for user ${userId}:`, error);
    });
  });
};
