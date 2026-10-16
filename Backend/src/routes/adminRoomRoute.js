const express = require('express');
const { authenticateAny } = require('../middlewares/anyAuthMiddleware');
const { requirePermission } = require('../middlewares/roleMiddleware');
const { listHistory } = require('../services/historyService');

const router = express.Router();
router.use(authenticateAny);

router.get('/history', requirePermission('history:read_all'), async (req, res) => {
  try {
    return res.json({ history: await listHistory() });
  } catch (error) {
    console.error('Admin list history error:', error);
    return res.status(500).json({ message: 'History gagal dimuat.' });
  }
});

const getRoomController = (req) => req.app.locals.realtimeGame;

router.get('/', requirePermission('rooms:manage'), async (req, res) => {
  try {
    const controller = getRoomController(req);
    if (!controller) return res.status(503).json({ message: 'Realtime game belum siap.' });
    return res.json({ rooms: await controller.listRooms() });
  } catch (error) {
    console.error('Admin list rooms error:', error);
    return res.status(500).json({ message: 'Daftar room gagal dimuat.' });
  }
});

router.post('/', requirePermission('rooms:manage'), async (req, res) => {
  try {
    const controller = getRoomController(req);
    if (!controller) return res.status(503).json({ message: 'Realtime game belum siap.' });
    const room = await controller.createRoom({
      name: req.body?.name,
      capacity: req.body?.capacity,
      createdBy: req.user.username || req.user.userId
    });
    return res.status(201).json({ room });
  } catch (error) {
    console.error('Admin create room error:', error);
    return res.status(500).json({ message: 'Room gagal dibuat.' });
  }
});

router.delete('/:roomId', requirePermission('rooms:manage'), async (req, res) => {
  try {
    const controller = getRoomController(req);
    if (!controller) return res.status(503).json({ message: 'Realtime game belum siap.' });
    const result = await controller.deleteRoom(req.params.roomId);
    return res.json({ success: true, ...result });
  } catch (error) {
    const status = error.code === 'ROOM_NOT_FOUND' ? 404 : 500;
    console.error('Admin delete room error:', error);
    return res.status(status).json({ message: error.message || 'Room gagal dihapus.' });
  }
});

module.exports = router;
