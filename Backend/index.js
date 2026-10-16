require('dotenv').config();

const express = require('express');
const { createServer } = require('http');
const cors = require('cors');
const manualAuthRouter = require('./src/routes/manualAuthRoute');
const adminRoomRouter = require('./src/routes/adminRoomRoute');
const { connectMySQL, pool } = require('./src/config/Database/MySQL/connection');
const { verifyMailer, isSmtpConfigured } = require('./src/config/mailer');
const { connectRedis, redisClient } = require('./src/config/Database/Redis/connections');

let playersRouter;
let authRouter;
let attachRealtimeGame;
let createManagedRoom;
let deleteManagedRoom;
let listManagedRooms;
try {
  playersRouter = require('./src/config/Database/Firebase/players');
  authRouter = require('./src/routes/firebaseAuthRoute');
  ({ attachRealtimeGame, createManagedRoom, deleteManagedRoom, listManagedRooms } = require('./src/services/realtimeGameSocket'));
} catch (error) {
  console.warn('Firebase routes disabled:', error.message);
}

const app = express();
const httpServer = createServer(app);
const port = Number(process.env.PORT) || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ service: 'gamukis-backend', status: 'ok' });
});

app.get('/health', async (req, res) => {
  try {
    let mysqlStatus = 'ok';
    try {
      await pool.query('SELECT 1');
    } catch (e) {
      mysqlStatus = 'down';
    }

    let redisStatus = 'ok';
    try {
      const ping = await redisClient.ping();
      if (ping !== 'PONG') redisStatus = 'degraded';
    } catch (e) {
      redisStatus = 'down';
    }

    const isHealthy = mysqlStatus === 'ok' && redisStatus === 'ok';
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'ok' : 'degraded',
      mysql: mysqlStatus,
      redis: redisStatus
    });
  } catch (error) {
    res.status(503).json({ status: 'degraded', mysql: 'down', redis: 'down' });
  }
});

if (playersRouter && authRouter) {
  app.use('/api/players', playersRouter);
  app.use('/api/auth', authRouter);
}
app.use('/api/auth/manual', manualAuthRouter);
app.use('/api/admin/rooms', adminRoomRouter);
app.use('/api/access', require('./src/routes/accessRoute'));
app.use('/api/admin/teachers', require('./src/routes/teacherApplicationRoute'));
app.use('/api/memberships/notifications/midtrans', require('./src/routes/midtransNotificationRoute'));
app.use('/api/memberships', require('./src/routes/membershipRoute'));
app.use('/api/characters', require('./src/routes/characterRoute'));
app.use('/api/questions', require('./src/routes/questionRoute'));
app.use('/api/leaderboard', require('./src/routes/leaderboardRoute'));
app.use('/api/achievements', require('./src/routes/achievementRoute'));
app.use('/api/classes', require('./src/routes/studentClassRoute'));

app.use((error, req, res, next) => {
  console.error('Unhandled backend error:', error);
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Body request harus berupa JSON yang valid.' });
  }
  res.status(500).json({ message: 'Terjadi kesalahan pada backend.' });
});

if (attachRealtimeGame) {
  const realtimeIo = attachRealtimeGame(httpServer, {
    corsOrigin: process.env.FRONTEND_URL || 'http://localhost:3000'
  });
  app.locals.realtimeGame = {
    createRoom: createManagedRoom,
    deleteRoom: (roomId) => deleteManagedRoom(realtimeIo, roomId),
    listRooms: listManagedRooms
  };
}

connectMySQL()
  .then(() => connectRedis())
  .then(async () => {
    if (isSmtpConfigured) await verifyMailer();
    else console.warn('⚠️ [Mailer] SMTP belum dikonfigurasi. OTP email nonaktif.');
    httpServer.listen(port, () => {
    console.log(`Server aktif di port ${port}`);
    });
  })
  .catch(() => process.exit(1));

const shutdown = async () => {
  await redisClient.quit().catch(() => {});
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
module.exports = app;
