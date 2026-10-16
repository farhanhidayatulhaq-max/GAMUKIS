const { redisClient } = require('../config/Database/Redis/connections');

const ROOMS_KEY = 'game:global:rooms';
const DELETED_ROOMS_KEY = 'game:global:deleted-rooms';
const DEFAULT_CAPACITY = 100;

const parseRoom = (value) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return null;
  }
};

const createRoom = async ({ id, name, capacity = DEFAULT_CAPACITY, createdBy = 'system' } = {}) => {
  const roomId = id || `lobby-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const room = {
    id: roomId,
    name: String(name || roomId).slice(0, 80),
    capacity: Math.max(1, Math.min(1000, Number(capacity) || DEFAULT_CAPACITY)),
    createdBy,
    createdAt: Date.now(),
    status: 'active'
  };

  await redisClient.hset(ROOMS_KEY, roomId, JSON.stringify(room));
  await redisClient.srem(DELETED_ROOMS_KEY, roomId);
  return room;
};

const listRooms = async () => {
  const entries = await redisClient.hgetall(ROOMS_KEY);
  return Object.values(entries).map(parseRoom).filter(Boolean);
};

const deleteRoomRecord = async (roomId) => {
  await redisClient.multi()
    .hdel(ROOMS_KEY, roomId)
    .sadd(DELETED_ROOMS_KEY, roomId)
    .exec();
};

const isRoomDeleted = async (roomId) => Boolean(await redisClient.sismember(DELETED_ROOMS_KEY, roomId));

module.exports = {
  DEFAULT_CAPACITY,
  createRoom,
  deleteRoomRecord,
  isRoomDeleted,
  listRooms
};
