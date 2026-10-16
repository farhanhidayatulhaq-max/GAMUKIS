const { redisClient } = require('../config/Database/Redis/connections');

const PLAYERS_KEY = 'game:global:players';
const COINS_KEY = 'game:global:coins';
const LEADERBOARD_KEY = 'game:global:leaderboard';
const STATE_TTL_SECONDS = Number(process.env.GAME_STATE_TTL_SECONDS) || 3600;
const PLAYER_TTL_SECONDS = Number(process.env.GAME_PLAYER_TTL_SECONDS) || 120;
const MAX_COINS = Number(process.env.GAME_MAX_COINS) || 20;

const GAMEPLAY_CONFIG = Object.freeze({
  MAX_HEALTH: 3,
  SKILL_DAMAGE: 1,
  BOT_DAMAGE: 1,
  PLAYER_SKILL_COOLDOWN_MS: 1200,
  PLAYER_SKILL_RANGE: 2.5,
  DAMAGE_DEBOUNCE_MS: 600,
  MAX_BOTS_PER_LOBBY: Number(process.env.GAME_MAX_BOTS_PER_LOBBY) || 4,
  BOT_SPAWN_INTERVAL_MS: 4000,
  BOT_TICK_INTERVAL_MS: 600,
  BOT_AGGRO_RADIUS: 8,
  BOT_ATTACK_RADIUS: 1.8,
  BOT_ATTACK_COOLDOWN_MS: 1200,
  BOT_MOVE_COOLDOWN_MS: 600
});

const refreshStateTtl = async () => {
  await redisClient.expire(PLAYERS_KEY, STATE_TTL_SECONDS);
  await redisClient.expire(COINS_KEY, STATE_TTL_SECONDS);
  await redisClient.expire(LEADERBOARD_KEY, STATE_TTL_SECONDS);
};

const parseHash = (entries) => entries.reduce((result, value, index) => {
  if (index % 2 === 0) result[value] = JSON.parse(entries[index + 1]);
  return result;
}, {});

const getSnapshot = async () => {
  const [playerEntries, coinEntries, leaderboardEntries] = await Promise.all([
    redisClient.hgetall(PLAYERS_KEY),
    redisClient.hgetall(COINS_KEY),
    redisClient.zrevrange(LEADERBOARD_KEY, 0, 49, 'WITHSCORES')
  ]);

  const leaderboard = [];
  for (let index = 0; index < leaderboardEntries.length; index += 2) {
    const player = playerEntries[leaderboardEntries[index]];
    if (player) {
      leaderboard.push({
        ...JSON.parse(player),
        coins: Number(leaderboardEntries[index + 1])
      });
    }
  }

  return {
    players: parseHash(Object.entries(playerEntries).flat()),
    coins: parseHash(Object.entries(coinEntries).flat()),
    leaderboard
  };
};

const savePlayer = async (playerId, player) => {
  const normalizedPlayer = {
    ...player,
    id: playerId,
    coins: Number(player.coins) || 0,
    lastSeen: Date.now()
  };

  await redisClient.multi()
    .hset(PLAYERS_KEY, playerId, JSON.stringify(normalizedPlayer))
    .zadd(LEADERBOARD_KEY, normalizedPlayer.coins, playerId)
    .expire(PLAYERS_KEY, STATE_TTL_SECONDS)
    .expire(LEADERBOARD_KEY, STATE_TTL_SECONDS)
    .set(`game:global:player:${playerId}:alive`, '1', 'EX', PLAYER_TTL_SECONDS)
    .exec();

  return normalizedPlayer;
};

const updatePlayer = async (playerId, changes) => {
  const current = await redisClient.hget(PLAYERS_KEY, playerId);
  if (!current) return null;
  return savePlayer(playerId, { ...JSON.parse(current), ...changes });
};

const applyAuthoritativeDamage = async (playerId, {
  reason = 'unknown',
  attackerId = null,
  damage = 1,
  minIntervalMs = GAMEPLAY_CONFIG.DAMAGE_DEBOUNCE_MS
} = {}) => {
  const current = await redisClient.hget(PLAYERS_KEY, playerId);
  if (!current) return null;

  const player = JSON.parse(current);
  const now = Date.now();

  // Debounce check: prevent duplicate damage within minIntervalMs
  if (minIntervalMs > 0 && player.lastDamagedAt && (now - Number(player.lastDamagedAt)) < minIntervalMs) {
    return { player, ignored: true, reason: 'cooldown' };
  }

  const storedHealth = Number(player.health);
  const currentHealth = Number.isFinite(storedHealth)
    ? Math.min(3, Math.max(0, storedHealth))
    : 3;

  if (currentHealth <= 0) {
    return { player, ignored: true, reason: 'already_dead' };
  }

  const damageAmount = Math.min(3, Math.max(1, Number(damage) || 1));
  const nextHealth = Math.max(0, currentHealth - damageAmount);

  const updatedPlayer = await savePlayer(playerId, {
    ...player,
    health: nextHealth,
    death: nextHealth <= 0 ? 1 : (Number(player.death) || 0),
    lastDamagedAt: now,
    lastDamageReason: reason,
    lastAttackerId: attackerId
  });

  return { player: updatedPlayer, ignored: false, damaged: true };
};

const damagePlayer = async (playerId) => {
  const result = await applyAuthoritativeDamage(playerId, {
    reason: 'legacy_direct',
    minIntervalMs: 0
  });
  return result?.player || null;
};

const flagPlayer = async (playerId, reason = 'invalid_move') => {
  const current = await redisClient.hget(PLAYERS_KEY, playerId);
  if (!current) return null;

  const player = JSON.parse(current);
  return savePlayer(playerId, {
    ...player,
    cheatFlags: Number(player.cheatFlags) + 1 || 1,
    lastCheatReason: reason,
    lastCheatAt: Date.now()
  });
};

const removePlayer = async (playerId) => {
  await redisClient.multi()
    .hdel(PLAYERS_KEY, playerId)
    .zrem(LEADERBOARD_KEY, playerId)
    .del(`game:global:player:${playerId}:alive`)
    .exec();
};

const movePlayer = async (playerId, position) => {
  const current = await redisClient.hget(PLAYERS_KEY, playerId);
  if (!current) return null;

  const player = JSON.parse(current);
  const nextX = Number(position.x);
  const nextY = Number(position.y);
  const distance = Math.abs(nextX - Number(player.x)) + Math.abs(nextY - Number(player.y));

  if (!Number.isInteger(nextX) || !Number.isInteger(nextY) || distance !== 1) {
    return null;
  }

  return savePlayer(playerId, {
    ...player,
    ...position,
    x: nextX,
    y: nextY
  });
};

const addCoin = async (coinId, coin) => {
  const coinCount = await redisClient.hlen(COINS_KEY);
  if (coinCount >= MAX_COINS) return false;

  const added = await redisClient.hsetnx(COINS_KEY, coinId, JSON.stringify(coin));
  await refreshStateTtl();
  return added === 1;
};

const removeCoin = async (coinId) => {
  const removed = await redisClient.hdel(COINS_KEY, coinId);
  if (removed) await redisClient.expire(COINS_KEY, STATE_TTL_SECONDS);
  return removed === 1;
};

const claimCoin = async (playerId, coinId) => {
  const coin = await redisClient.hget(COINS_KEY, coinId);
  if (!coin) return null;

  const playerValue = await redisClient.hget(PLAYERS_KEY, playerId);
  if (!playerValue) return null;

  const player = JSON.parse(playerValue);
  const transaction = redisClient.multi()
    .hdel(COINS_KEY, coinId)
    .zadd(LEADERBOARD_KEY, Number(player.coins || 0) + 1, playerId)
    .expire(COINS_KEY, STATE_TTL_SECONDS)
    .expire(LEADERBOARD_KEY, STATE_TTL_SECONDS);

  player.coins = Number(player.coins || 0) + 1;
  player.lastSeen = Date.now();
  transaction.hset(PLAYERS_KEY, playerId, JSON.stringify(player));
  const result = await transaction.exec();

  if (!result || result[0][1] !== 1) return null;
  return { coin: JSON.parse(coin), player };
};

module.exports = {
  addCoin,
  applyAuthoritativeDamage,
  claimCoin,
  damagePlayer,
  flagPlayer,
  GAMEPLAY_CONFIG,
  getSnapshot,
  movePlayer,
  removeCoin,
  removePlayer,
  savePlayer,
  updatePlayer
};
