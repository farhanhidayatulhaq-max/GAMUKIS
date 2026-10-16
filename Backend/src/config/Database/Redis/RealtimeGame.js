import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" }
});

const PORT = process.env.PORT || 5003;

// Koneksi ke Redis In-Memory Store
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379
});

redis.on('connect', () => console.log('[Realtime-Service] Redis Connected'));

// WebSocket Event Listener
io.on('connection', (socket) => {
  console.log(`Player Connected: ${socket.id}`);

  // Event saat Player masuk ke Room
  socket.on('join_room', async ({ roomId, nickname }) => {
    socket.join(roomId);
    
    // Simpan status player di Redis (Expiry 1 jam)
    await redis.hset(`room:${roomId}:players`, socket.id, JSON.stringify({ nickname, x: 0, y: 0 }));

    io.to(roomId).emit('player_joined', { socketId: socket.id, nickname });
    console.log(`${nickname} joined room ${roomId}`);
  });

  // Event Pergerakan Karakter (Realtime Stream)
  socket.on('move', async ({ roomId, x, y }) => {
    // Broadcast koordinat ke semua pemain lain di room yang sama
    socket.to(roomId).emit('player_moved', {
      socketId: socket.id,
      position: { x, y }
    });
  });

  // Player Disconnect
  socket.on('disconnect', () => {
    console.log(`Player Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => console.log(`[Realtime-Service] Running on port ${PORT}`));