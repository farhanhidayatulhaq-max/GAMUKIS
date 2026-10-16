const { Server } = require('socket.io');
const path = require('path');
const { firebaseAuth, firebaseDatabase } = require('../config/Database/Firebase/admin');
const {
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
} = require('./realtimeGameService');
const { saveHistory } = require('./historyService');
const {
  createRoom: createRoomRecord,
  deleteRoomRecord,
  listRooms: listRoomRecords
} = require('./roomService');

const GLOBAL_GAME = 'global-game';
const GAME_DURATION_MS = 5 * 60 * 1000;
const MAX_PLAYERS_PER_LOBBY = 100;
const connectedPlayers = new Map();
const finalizingHistoryPlayers = new Set();
const lobbyPlayerCounts = new Map();
const managedRooms = new Map();
let nextLobbyNumber = 1;
let coinSpawnerStarted = false;
const tiledMap = require(path.resolve(
  __dirname,
  '../../../Frontend/src/component/component_game/map_assets/map1.json'
));

const collectLayers = (layers, type, result = []) => {
  layers.forEach((layer) => {
    if (layer.type === type) result.push(layer);
    if (layer.layers) collectLayers(layer.layers, type, result);
  });
  return result;
};

const tileLayers = collectLayers(tiledMap.layers, 'tilelayer');
const grassLayer = tileLayers.find(({ name }) => name === 'grass');
const darkGrassLayer = tileLayers.find(({ name }) => name === 'dark grass');
const decorLayers = tileLayers.filter(({ name }) => /^(house|tree)/i.test(name));
const wallLayers = tileLayers.filter(({ name }) => /^wall/i.test(name));
const objectBorderLayers = collectLayers(tiledMap.layers, 'objectgroup')
  .filter(({ name }) => name.toLowerCase() !== 'spawn');
const tileSize = tiledMap.tilewidth;
const coinSpawnPoints = [];
const blockedCoinCells = new Set();

const markObjectBounds = (object, offsetX = 0, offsetY = 0) => {
  const points = object.polygon || object.polyline;
  let bounds;
  if (points?.length) {
    const absolutePoints = points.map(({ x, y }) => ({ x: object.x + x, y: object.y + y }));
    bounds = {
      minX: Math.min(...absolutePoints.map(({ x }) => x)),
      minY: Math.min(...absolutePoints.map(({ y }) => y)),
      maxX: Math.max(...absolutePoints.map(({ x }) => x)),
      maxY: Math.max(...absolutePoints.map(({ y }) => y))
    };
  } else if (object.width > 0 && object.height > 0) {
    bounds = {
      minX: object.x,
      minY: object.y,
      maxX: object.x + object.width,
      maxY: object.y + object.height
    };
  }
  if (!bounds) return;

  const minX = Math.max(0, Math.floor((bounds.minX + offsetX) / tileSize));
  const minY = Math.max(0, Math.floor((bounds.minY + offsetY) / tileSize));
  const maxX = Math.min(tiledMap.width - 1, Math.ceil((bounds.maxX + offsetX) / tileSize) - 1);
  const maxY = Math.min(tiledMap.height - 1, Math.ceil((bounds.maxY + offsetY) / tileSize) - 1);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) blockedCoinCells.add(`${x}x${y}`);
  }
};

objectBorderLayers.forEach((layer) => {
  (layer.objects || []).forEach((object) => markObjectBounds(
    object,
    (layer.offsetx || 0) + (layer.x || 0) * tileSize,
    (layer.offsety || 0) + (layer.y || 0) * tileSize
  ));
});

for (let y = 0; y < tiledMap.height; y += 1) {
  for (let x = 0; x < tiledMap.width; x += 1) {
    const index = y * tiledMap.width + x;
    const key = `${x}x${y}`;
    const hasGround = [grassLayer, darkGrassLayer].some((layer) => (
      ((layer?.data?.[index] || 0) >>> 0 & 0x0fffffff) > 0
    ));
    const hasDecor = decorLayers.some((layer) => (
      ((layer.data[index] || 0) >>> 0 & 0x0fffffff) > 0
    ));
    const hasWall = wallLayers.some((layer) => (
      ((layer.data[index] || 0) >>> 0 & 0x0fffffff) > 0
    ));
    if (hasGround && !hasDecor && !hasWall && !blockedCoinCells.has(key)) {
      coinSpawnPoints.push({ x, y });
    }
  }
}

const coinSpawnPointKeys = new Set(coinSpawnPoints.map(({ x, y }) => `${x}x${y}`));

const startCoinSpawner = (io) => {
  if (coinSpawnerStarted) return;
  coinSpawnerStarted = true;
  const spawn = async () => {
    if (!coinSpawnPoints.length) return;
    const snapshot = await getSnapshot();
    const activeCoins = new Set();
    const staleCoinIds = [];

    Object.keys(snapshot.coins || {}).forEach((coinId) => {
      if (coinSpawnPointKeys.has(coinId)) activeCoins.add(coinId);
      else staleCoinIds.push(coinId);
    });
    await Promise.all(staleCoinIds.map(removeCoin));

    const availablePoints = coinSpawnPoints.filter(({ x, y }) => !activeCoins.has(`${x}x${y}`));
    if (!availablePoints.length) return;

    const players = Object.values(snapshot.players || {}).filter((player) => (
      Number.isFinite(Number(player.x)) && Number.isFinite(Number(player.y))
    ));
    const nearbyPoints = players.length
      ? availablePoints.filter(({ x, y }) => players.some((player) => (
        Math.abs(x - Number(player.x)) <= 10 && Math.abs(y - Number(player.y)) <= 7
      )))
      : [];
    const spawnPoints = nearbyPoints.length ? nearbyPoints : availablePoints;
    const { x, y } = spawnPoints[Math.floor(Math.random() * spawnPoints.length)];
    const coinId = `${x}x${y}`;
    const added = await addCoin(coinId, { x, y });
    if (added) io.to(GLOBAL_GAME).emit('coin:added', { coinId, coin: { x, y } });
  };
  setInterval(spawn, 3000);
};

const getLobbyRoom = (lobbyId) => `game-lobby-${lobbyId}`;

const lobbyBots = new Map();
let botManagerStarted = false;
const BOT_TEMPLATES = [
  {
    variant: 'blood',
    name: 'Blood Monster',
    category: 'Monster',
    scaleMultiplier: 10
  },
  {
    variant: 'demon',
    name: 'Demon',
    category: 'Monster',
    scaleMultiplier: 10
  },
  {
    variant: 'orc',
    name: 'Orc',
    category: 'Monster',
    scaleMultiplier: 10
  },
  {
    variant: 'samurai',
    name: 'Manusia yang Tersesat (Emperor Samurai)',
    category: 'Manusia yang Tersesat',
    scaleMultiplier: 2
  }
];
const BOT_NAMES = BOT_TEMPLATES.map((t) => t.name);
let nextBotNumber = 1;

const getLobbyBots = (lobbyId) => {
  const botsMap = lobbyBots.get(lobbyId);
  if (!botsMap) return [];
  return Array.from(botsMap.values());
};

const clearLobbyBots = (lobbyId) => {
  lobbyBots.delete(lobbyId);
};

const damageBot = (lobbyId, botId, damage = GAMEPLAY_CONFIG.SKILL_DAMAGE) => {
  const botsMap = lobbyBots.get(lobbyId);
  if (!botsMap) return null;
  const bot = botsMap.get(botId);
  if (!bot) return null;

  const dmg = Math.min(3, Math.max(1, Number(damage) || 1));
  bot.health = Math.max(0, (bot.health || GAMEPLAY_CONFIG.MAX_HEALTH) - dmg);

  if (bot.health <= 0) {
    botsMap.delete(botId);
    return { bot, killed: true };
  }
  return { bot, killed: false };
};

const spawnBotForLobby = (lobbyId, existingPlayers = []) => {
  if (!coinSpawnPoints.length) return null;
  const currentBotsMap = lobbyBots.get(lobbyId) || new Map();
  if (currentBotsMap.size >= GAMEPLAY_CONFIG.MAX_BOTS_PER_LOBBY) return null;

  const playerPositions = new Set(
    existingPlayers
      .filter((p) => Number.isFinite(Number(p?.x)) && Number.isFinite(Number(p?.y)))
      .map((p) => `${p.x}x${p.y}`)
  );
  const botPositions = new Set(
    Array.from(currentBotsMap.values()).map((b) => `${b.x}x${b.y}`)
  );

  const availablePoints = coinSpawnPoints.filter(({ x, y }) => {
    const key = `${x}x${y}`;
    if (playerPositions.has(key) || botPositions.has(key)) return false;
    for (const p of existingPlayers) {
      if (Number.isFinite(Number(p?.x)) && Number.isFinite(Number(p?.y))) {
        if (Math.hypot(Number(p.x) - x, Number(p.y) - y) < 2) return false;
      }
    }
    return true;
  });

  if (!availablePoints.length) return null;

  const { x, y } = availablePoints[Math.floor(Math.random() * availablePoints.length)];
  const botId = `bot-${lobbyId}-${nextBotNumber++}`;
  const existingVariants = new Set(Array.from(currentBotsMap.values()).map((b) => b.variant));
  const template = BOT_TEMPLATES.find((t) => !existingVariants.has(t.variant))
    || BOT_TEMPLATES[currentBotsMap.size % BOT_TEMPLATES.length];

  const newBot = {
    id: botId,
    name: template.name,
    variant: template.variant,
    category: template.category,
    scaleMultiplier: template.scaleMultiplier,
    x,
    y,
    direction: 'right',
    health: GAMEPLAY_CONFIG.MAX_HEALTH,
    maxHealth: GAMEPLAY_CONFIG.MAX_HEALTH,
    lobbyId,
    state: 'idle',
    targetPlayerId: null,
    lastAttackAt: 0,
    lastMoveAt: Date.now(),
    createdAt: Date.now()
  };

  currentBotsMap.set(botId, newBot);
  lobbyBots.set(lobbyId, currentBotsMap);
  return newBot;
};

const startBotManager = (io) => {
  if (botManagerStarted) return;
  botManagerStarted = true;

  // Bot Spawn Loop
  setInterval(async () => {
    try {
      const snapshot = await getSnapshot();
      const allPlayers = Object.values(snapshot.players || {});
      const activeLobbyIds = new Set(
        Array.from(lobbyPlayerCounts.entries())
          .filter(([, count]) => count > 0)
          .map(([id]) => id)
      );

      for (const lobbyId of activeLobbyIds) {
        const lobbyPlayers = allPlayers.filter(
          (p) => String(p.lobbyId || '') === String(lobbyId) && Number(p.health) > 0
        );
        if (lobbyPlayers.length === 0) continue;

        const currentBots = lobbyBots.get(lobbyId) || new Map();
        if (currentBots.size < GAMEPLAY_CONFIG.MAX_BOTS_PER_LOBBY) {
          const newBot = spawnBotForLobby(lobbyId, lobbyPlayers);
          if (newBot) {
            io.to(getLobbyRoom(lobbyId)).emit('bot:spawned', { bot: newBot });
          }
        }
      }
    } catch (err) {
      console.error('Error in bot spawn loop:', err.message);
    }
  }, GAMEPLAY_CONFIG.BOT_SPAWN_INTERVAL_MS);

  // Bot AI Tick Loop
  setInterval(async () => {
    try {
      const snapshot = await getSnapshot();
      const allPlayers = Object.values(snapshot.players || {});
      const now = Date.now();

      for (const [lobbyId, botsMap] of lobbyBots.entries()) {
        const playerCount = lobbyPlayerCounts.get(lobbyId) || 0;
        if (playerCount === 0 || botsMap.size === 0) continue;

        const lobbyPlayers = allPlayers.filter(
          (p) => String(p.lobbyId || '') === String(lobbyId)
            && Number(p.health) > 0
            && Number.isFinite(Number(p.x))
            && Number.isFinite(Number(p.y))
        );

        for (const bot of botsMap.values()) {
          if (!lobbyPlayers.length) {
            if (bot.state !== 'idle') {
              bot.state = 'idle';
              bot.targetPlayerId = null;
            }
            continue;
          }

          let closestPlayer = null;
          let closestDist = Infinity;
          for (const player of lobbyPlayers) {
            const dist = Math.hypot(Number(player.x) - bot.x, Number(player.y) - bot.y);
            if (dist < closestDist) {
              closestDist = dist;
              closestPlayer = player;
            }
          }

          if (closestPlayer && closestDist <= GAMEPLAY_CONFIG.BOT_AGGRO_RADIUS) {
            bot.targetPlayerId = closestPlayer.id;

            if (closestDist <= GAMEPLAY_CONFIG.BOT_ATTACK_RADIUS) {
              bot.state = 'attacking';
              if (now - (bot.lastAttackAt || 0) >= GAMEPLAY_CONFIG.BOT_ATTACK_COOLDOWN_MS) {
                bot.lastAttackAt = now;
                const damageResult = await applyAuthoritativeDamage(closestPlayer.id, {
                  reason: 'bot_attack',
                  attackerId: bot.id,
                  damage: GAMEPLAY_CONFIG.BOT_DAMAGE,
                  minIntervalMs: GAMEPLAY_CONFIG.DAMAGE_DEBOUNCE_MS
                });
                if (damageResult?.damaged) {
                  io.to(getLobbyRoom(lobbyId)).emit('player:updated', damageResult.player);
                  emitLeaderboardUpdate(io, damageResult.player);
                }
                io.to(getLobbyRoom(lobbyId)).emit('bot:attack', {
                  botId: bot.id,
                  targetPlayerId: closestPlayer.id,
                  damage: GAMEPLAY_CONFIG.BOT_DAMAGE
                });
              }
            } else {
              bot.state = 'chasing';
              const dx = Math.sign(Number(closestPlayer.x) - bot.x);
              const dy = Math.sign(Number(closestPlayer.y) - bot.y);
              const diffX = Math.abs(Number(closestPlayer.x) - bot.x);
              const diffY = Math.abs(Number(closestPlayer.y) - bot.y);

              const candidates = [];
              const defaultHorizontalDir = bot.direction === 'left' ? 'left' : 'right';
              if (diffX >= diffY) {
                if (dx !== 0) candidates.push({ x: bot.x + dx, y: bot.y, dir: dx > 0 ? 'right' : 'left' });
                if (dy !== 0) candidates.push({ x: bot.x, y: bot.y + dy, dir: dx !== 0 ? (dx > 0 ? 'right' : 'left') : defaultHorizontalDir });
                if (dy === 0) {
                  candidates.push({ x: bot.x, y: bot.y + 1, dir: defaultHorizontalDir });
                  candidates.push({ x: bot.x, y: bot.y - 1, dir: defaultHorizontalDir });
                }
              } else {
                if (dy !== 0) candidates.push({ x: bot.x, y: bot.y + dy, dir: dx !== 0 ? (dx > 0 ? 'right' : 'left') : defaultHorizontalDir });
                if (dx !== 0) candidates.push({ x: bot.x + dx, y: bot.y, dir: dx > 0 ? 'right' : 'left' });
                if (dx === 0) {
                  candidates.push({ x: bot.x + 1, y: bot.y, dir: 'right' });
                  candidates.push({ x: bot.x - 1, y: bot.y, dir: 'left' });
                }
              }

              const otherBotKeys = new Set(
                Array.from(botsMap.values())
                  .filter((b) => b.id !== bot.id)
                  .map((b) => `${b.x}x${b.y}`)
              );

              for (const cand of candidates) {
                const key = `${cand.x}x${cand.y}`;
                if (coinSpawnPointKeys.has(key) && !otherBotKeys.has(key)) {
                  bot.x = cand.x;
                  bot.y = cand.y;
                  bot.direction = cand.dir;
                  break;
                }
              }

              io.to(getLobbyRoom(lobbyId)).emit('bot:moved', {
                botId: bot.id,
                x: bot.x,
                y: bot.y,
                direction: bot.direction,
                state: bot.state,
                health: bot.health,
                maxHealth: bot.maxHealth
              });
            }
          } else {
            const prevState = bot.state;
            bot.state = 'idle';
            bot.targetPlayerId = null;
            if (prevState !== 'idle') {
              io.to(getLobbyRoom(lobbyId)).emit('bot:moved', {
                botId: bot.id,
                x: bot.x,
                y: bot.y,
                direction: bot.direction,
                state: 'idle',
                health: bot.health,
                maxHealth: bot.maxHealth
              });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error in bot AI tick loop:', err.message);
    }
  }, GAMEPLAY_CONFIG.BOT_TICK_INTERVAL_MS);
};

const allocateLobby = () => {
  for (const [lobbyId, playerCount] of lobbyPlayerCounts.entries()) {
    if (playerCount < MAX_PLAYERS_PER_LOBBY) {
      lobbyPlayerCounts.set(lobbyId, playerCount + 1);
      return lobbyId;
    }
  }

  const lobbyId = `lobby-${nextLobbyNumber++}`;
  lobbyPlayerCounts.set(lobbyId, 1);
  return lobbyId;
};

const joinLobby = (socket, lobbyId) => {
  socket.join(getLobbyRoom(lobbyId));
  socket.data.lobbyId = lobbyId;
};

const leaveLobby = (socket) => {
  const lobbyId = socket.data.lobbyId;
  if (!lobbyId || socket.data.replaced) return;

  const nextCount = Math.max(0, (lobbyPlayerCounts.get(lobbyId) || 1) - 1);
  if (nextCount === 0) {
    lobbyPlayerCounts.delete(lobbyId);
    clearLobbyBots(lobbyId);
  } else {
    lobbyPlayerCounts.set(lobbyId, nextCount);
  }
};

const getLobbySnapshot = async (lobbyId) => {
  const snapshot = await getSnapshot();
  const bots = getLobbyBots(lobbyId);
  return {
    ...snapshot,
    players: Object.fromEntries(
      Object.entries(snapshot.players || {}).filter(([, player]) => (
        String(player.lobbyId || '') === String(lobbyId)
      ))
    ),
    bots: Object.fromEntries(bots.map((b) => [b.id, b]))
  };
};

const emitLeaderboardUpdate = (io, player) => {
  io.to(GLOBAL_GAME).emit('leaderboard:updated', player);
};

const hydrateRooms = async () => {
  const rooms = await listRoomRecords();
  rooms.forEach((room) => {
    managedRooms.set(room.id, room);
    if (!lobbyPlayerCounts.has(room.id)) lobbyPlayerCounts.set(room.id, 0);
  });
};

const finalizeExpiredSessions = async (io) => {
  const snapshot = await getSnapshot();
  const now = Date.now();
  const expiredPlayers = Object.values(snapshot.players || {}).filter((player) => (
    Number.isFinite(Number(player.gameStartedAt))
    && now - Number(player.gameStartedAt) >= GAME_DURATION_MS
    && !player.historySavedAt
    && !finalizingHistoryPlayers.has(player.id)
  ));

  await Promise.all(expiredPlayers.map(async (player) => {
    finalizingHistoryPlayers.add(player.id);
    try {
      const sessionKey = `${player.answerOwnerId || player.id}:${player.sessionId || 'legacy'}`;
      const answersSnapshot = await firebaseDatabase.ref(`answers/${sessionKey}`).once('value');
      const answers = Object.values(answersSnapshot.val() || {});
      const correctAnswers = answers.filter((answer) => answer.correct);
      const incorrectAnswers = answers.filter((answer) => !answer.correct);

      await saveHistory({
        timePlaying: '00:05:00',
        answerTrue: correctAnswers.length,
        answerFalse: incorrectAnswers.length,
        descAnswerTrue: correctAnswers.map(({ question }) => question).join('\n'),
        descAnswerFalse: incorrectAnswers.map(({ question }) => question).join('\n'),
        allQuestion: player.allQuestion,
        coin: player.coins,
        death: player.death || (Number(player.health) <= 0 ? 1 : 0)
      });

      const updatedPlayer = await updatePlayer(player.id, { historySavedAt: now });
      if (updatedPlayer) {
        const room = updatedPlayer.lobbyId ? getLobbyRoom(updatedPlayer.lobbyId) : GLOBAL_GAME;
        io.to(room).emit('player:updated', updatedPlayer);
        emitLeaderboardUpdate(io, updatedPlayer);
      }
    } catch (error) {
      console.error(`Gagal menyimpan history sesi ${player.id}:`, error.message);
    } finally {
      finalizingHistoryPlayers.delete(player.id);
    }
  }));
};

const startHistoryFinalizer = (io) => {
  setInterval(() => {
    finalizeExpiredSessions(io).catch((error) => {
      console.error('Gagal memproses sesi game yang sudah berakhir:', error.message);
    });
  }, 1000);
};

const createManagedRoom = async ({ name, capacity, createdBy }) => {
  const room = await createRoomRecord({ name, capacity, createdBy });
  managedRooms.set(room.id, room);
  lobbyPlayerCounts.set(room.id, 0);
  return { ...room, playerCount: 0, players: [], suspiciousCount: 0 };
};

const listManagedRooms = async () => {
  await hydrateRooms();
  const snapshot = await getSnapshot();
  const playersByRoom = new Map();

  Object.values(snapshot.players || {}).forEach((player) => {
    if (!player.lobbyId) return;
    const players = playersByRoom.get(player.lobbyId) || [];
    players.push(player);
    playersByRoom.set(player.lobbyId, players);
    if (!managedRooms.has(player.lobbyId)) {
      managedRooms.set(player.lobbyId, {
        id: player.lobbyId,
        name: player.lobbyId,
        capacity: MAX_PLAYERS_PER_LOBBY,
        createdBy: 'system',
        createdAt: player.gameStartedAt || Date.now(),
        status: 'active'
      });
      if (!lobbyPlayerCounts.has(player.lobbyId)) lobbyPlayerCounts.set(player.lobbyId, 0);
    }
  });

  return Array.from(managedRooms.values()).map((room) => {
    const players = playersByRoom.get(room.id) || [];
    return {
      ...room,
      playerCount: players.length,
      connectedCount: lobbyPlayerCounts.get(room.id) || 0,
      suspiciousCount: players.filter((player) => Number(player.cheatFlags) > 0).length,
      players: players.map((player) => ({
        id: player.id,
        name: player.name,
        coins: player.coins,
        health: player.health,
        cheatFlags: player.cheatFlags || 0,
        lastCheatAt: player.lastCheatAt || null
      }))
    };
  });
};

const deleteManagedRoom = async (io, roomId) => {
  const snapshot = await getSnapshot();
  const roomPlayers = Object.values(snapshot.players || {}).filter(
    (player) => String(player.lobbyId || '') === String(roomId)
  );
  const room = managedRooms.get(roomId);
  if (!room && roomPlayers.length === 0) {
    const error = new Error('Room tidak ditemukan.');
    error.code = 'ROOM_NOT_FOUND';
    throw error;
  }

  io.to(getLobbyRoom(roomId)).emit('lobby:removed', { roomId });
  await Promise.all(roomPlayers.map((player) => removePlayer(player.id)));
  connectedPlayers.forEach((socket, playerId) => {
    if (socket.data.lobbyId === roomId) {
      connectedPlayers.delete(playerId);
      socket.disconnect(true);
    }
  });
  lobbyPlayerCounts.delete(roomId);
  clearLobbyBots(roomId);
  managedRooms.delete(roomId);
  await deleteRoomRecord(roomId);
  return { roomId, removedPlayers: roomPlayers.length };
};

const attachRealtimeGame = (httpServer, { corsOrigin } = {}) => {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin || 'http://localhost:3000',
      credentials: true
    },
    transports: ['websocket', 'polling']
  });
  hydrateRooms().catch((error) => console.error('Gagal memuat registry room:', error.message));
  startCoinSpawner(io);
  startBotManager(io);
  startHistoryFinalizer(io);

  io.use(async (socket, next) => {
    const token = socket.handshake.auth && socket.handshake.auth.token;
    if (!token) return next(new Error('Firebase ID token diperlukan.'));

    try {
      socket.data.user = await firebaseAuth.verifyIdToken(token);
      return next();
    } catch (error) {
      return next(new Error('Firebase ID token tidak valid.'));
    }
  });

  io.on('connection', (socket) => {
    const playerId = socket.data.user.uid;
    socket.data.playerId = playerId;
    socket.join(GLOBAL_GAME);

    socket.on('game:join', async (player, callback = () => {}) => {
      try {
        const existing = (await getSnapshot()).players[playerId];
        const previousSocket = connectedPlayers.get(playerId);
        const existingLobbyId = existing?.lobbyId || previousSocket?.data.lobbyId;
        const lobbyId = existingLobbyId || allocateLobby();
        if (previousSocket && previousSocket.id !== socket.id) {
          previousSocket.data.replaced = true;
          previousSocket.disconnect(true);
        } else if (existingLobbyId && !socket.data.lobbyJoined) {
          const currentCount = lobbyPlayerCounts.get(lobbyId) || 0;
          lobbyPlayerCounts.set(lobbyId, Math.min(MAX_PLAYERS_PER_LOBBY, currentCount + 1));
        }
        joinLobby(socket, lobbyId);
        socket.data.lobbyJoined = true;
        connectedPlayers.set(playerId, socket);

        const requestedSessionId = player.sessionId || `${playerId}:${Date.now()}`;

        // An existing session in Redis is active and reusable if:
        // 1. Game duration has not expired (< 5 mins)
        // 2. History was not already finalized
        // 3. The player is NOT dead (health > 0)
        // 4. The player is NOT explicitly requesting a reset (e.g. from /result retry)
        const hasUnexpiredGame = existing
          && Number.isFinite(Number(existing.gameStartedAt))
          && Date.now() - Number(existing.gameStartedAt) < GAME_DURATION_MS
          && !existing.historySavedAt
          && Number(existing.health) > 0;

        const isExplicitReset = Boolean(player.isReset || player.isRestart);

        const existingSessionIsActive = Boolean(
          !isExplicitReset
          && hasUnexpiredGame
          && (!player.sessionId || !existing.sessionId || existing.sessionId === requestedSessionId)
        );

        const isResetOrRestart = Boolean(
          isExplicitReset
          || !hasUnexpiredGame
          || (existing && Number(existing.health) <= 0)
        );

        // When starting fresh or retrying, NEVER merge stale health: 0 or stale coins from Redis.
        // But when reconnecting or refreshing the page, preserve existing coins and health.
        const coinsToPreserve = !isResetOrRestart && existing && Number.isFinite(Number(existing.coins))
          ? Number(existing.coins)
          : (Number(player.coins) || 0);

        const healthToPreserve = !isResetOrRestart && existing && Number(existing.health) > 0
          ? Number(existing.health)
          : (Number(player.health) > 0 ? Number(player.health) : 3);

        const activeSessionId = (!isResetOrRestart && existing?.sessionId)
          ? existing.sessionId
          : requestedSessionId;

        const savedPlayer = await savePlayer(playerId, isResetOrRestart ? {
          id: playerId,
          ...player,
          coins: Number(player.coins) || 0,
          health: Number(player.health) > 0 ? Number(player.health) : 3,
          lastQuestionCoins: 0,
          sessionId: requestedSessionId,
          gameStartedAt: Date.now(),
          historySavedAt: null,
          disconnectedAt: null,
          lobbyId,
          allQuestion: Number(player.allQuestion) || 25
        } : {
          ...player,
          ...(existing || {}),
          id: playerId,
          coins: coinsToPreserve,
          health: healthToPreserve,
          sessionId: activeSessionId,
          gameStartedAt: existing.gameStartedAt,
          historySavedAt: existing.historySavedAt,
          disconnectedAt: null,
          lobbyId,
          allQuestion: Number(player.allQuestion) || Number(existing?.allQuestion) || 0
        });

        const snapshot = await getLobbySnapshot(lobbyId);
        snapshot.players[playerId] = savedPlayer;
        socket.emit('game:snapshot', snapshot);
        socket.to(getLobbyRoom(lobbyId)).emit('player:updated', savedPlayer);
        emitLeaderboardUpdate(io, savedPlayer);
        callback({ ok: true, player: savedPlayer });
      } catch (error) {
        callback({ ok: false, message: 'Gagal bergabung ke game.' });
      }
    });

    socket.on('player:move', async (position, callback = () => {}) => {
      try {
        const player = await movePlayer(playerId, position || {});
        if (!player) {
          const flaggedPlayer = await flagPlayer(playerId, 'invalid_move');
          if (flaggedPlayer) emitLeaderboardUpdate(io, flaggedPlayer);
          return callback({ ok: false, message: 'Gerakan tidak valid.' });
        }

        io.to(getLobbyRoom(socket.data.lobbyId)).emit('player:updated', player);
        emitLeaderboardUpdate(io, player);
        const coinId = `${player.x}x${player.y}`;
        const claimed = await claimCoin(playerId, coinId);
        if (claimed) {
          io.to(getLobbyRoom(socket.data.lobbyId)).emit('coin:claimed', {
            coinId,
            player: claimed.player
          });
          emitLeaderboardUpdate(io, claimed.player);
        }
        callback({ ok: true, player: claimed ? claimed.player : player });
      } catch (error) {
        callback({ ok: false, message: 'Gerakan gagal diproses.' });
      }
    });

    socket.on('player:update', async (changes, callback = () => {}) => {
      try {
        const allowedChanges = {};
        if (typeof changes?.name === 'string') allowedChanges.name = changes.name.slice(0, 30);
        if (typeof changes?.color === 'string') allowedChanges.color = changes.color;
        if (Number.isFinite(Number(changes?.lastQuestionCoins))) {
          allowedChanges.lastQuestionCoins = Math.max(0, Number(changes.lastQuestionCoins));
        }
        const player = await updatePlayer(playerId, allowedChanges);
        if (!player) return callback({ ok: false, message: 'Player tidak ditemukan.' });
        io.to(getLobbyRoom(socket.data.lobbyId)).emit('player:updated', player);
        emitLeaderboardUpdate(io, player);
        callback({ ok: true, player });
      } catch (error) {
        callback({ ok: false, message: 'Data player gagal diperbarui.' });
      }
    });

    socket.on('player:reset', async (resetData = {}, callback = () => {}) => {
      try {
        const current = (await getSnapshot()).players[playerId] || {};
        const freshSessionId = resetData.sessionId || `${playerId}:${Date.now()}`;
        const resetPlayer = await savePlayer(playerId, {
          ...current,
          ...resetData,
          id: playerId,
          coins: 0,
          health: 3,
          death: 0,
          lastDamagedAt: 0,
          lastSkillCastAt: 0,
          lastDamageReason: null,
          lastAttackerId: null,
          lastQuestionCoins: 0,
          sessionId: freshSessionId,
          gameStartedAt: Date.now(),
          historySavedAt: null,
          disconnectedAt: null,
          lobbyId: socket.data.lobbyId || current.lobbyId
        });
        io.to(getLobbyRoom(socket.data.lobbyId)).emit('player:updated', resetPlayer);
        emitLeaderboardUpdate(io, resetPlayer);
        callback({ ok: true, player: resetPlayer });
      } catch (error) {
        callback({ ok: false, message: 'Reset progress gagal.' });
      }
    });

    socket.on('player:skill', async (data = {}, callback = () => {}) => {
      try {
        const currentSnapshot = await getSnapshot();
        const caster = currentSnapshot.players[playerId];
        if (!caster) {
          return callback({ ok: false, message: 'Player tidak ditemukan.' });
        }
        if (Number(caster.health) <= 0) {
          return callback({ ok: false, message: 'Player sudah kalah.' });
        }
        if (!Number.isFinite(Number(caster.x)) || !Number.isFinite(Number(caster.y))) {
          return callback({ ok: false, message: 'Posisi player tidak valid.' });
        }

        const now = Date.now();
        if (caster.lastSkillCastAt && (now - Number(caster.lastSkillCastAt)) < GAMEPLAY_CONFIG.PLAYER_SKILL_COOLDOWN_MS) {
          return callback({ ok: false, message: 'Skill sedang cooldown.' });
        }

        const lobbyId = socket.data.lobbyId || caster.lobbyId;
        const skillIndex = Math.max(0, Number(data.skillIndex) || 0);

        await updatePlayer(playerId, { lastSkillCastAt: now });

        const lobbyPlayers = Object.values(currentSnapshot.players || {}).filter((p) => (
          String(p.lobbyId || '') === String(lobbyId)
          && p.id !== playerId
          && Number(p.health) > 0
          && Number.isFinite(Number(p.x))
          && Number.isFinite(Number(p.y))
        ));

        const hitTargets = [];
        for (const target of lobbyPlayers) {
          const dist = Math.hypot(Number(target.x) - Number(caster.x), Number(target.y) - Number(caster.y));
          if (dist <= GAMEPLAY_CONFIG.PLAYER_SKILL_RANGE) {
            const damageRes = await applyAuthoritativeDamage(target.id, {
              reason: 'pvp_skill',
              attackerId: playerId,
              damage: GAMEPLAY_CONFIG.SKILL_DAMAGE,
              minIntervalMs: GAMEPLAY_CONFIG.DAMAGE_DEBOUNCE_MS
            });
            if (damageRes?.damaged) {
              hitTargets.push(damageRes.player);
              io.to(getLobbyRoom(lobbyId)).emit('player:updated', damageRes.player);
              emitLeaderboardUpdate(io, damageRes.player);
            }
          }
        }

        const lobbyBotsList = getLobbyBots(lobbyId);
        const hitBots = [];
        for (const bot of lobbyBotsList) {
          const dist = Math.hypot(Number(bot.x) - Number(caster.x), Number(bot.y) - Number(caster.y));
          if (dist <= GAMEPLAY_CONFIG.PLAYER_SKILL_RANGE) {
            const botRes = damageBot(lobbyId, bot.id, GAMEPLAY_CONFIG.SKILL_DAMAGE);
            if (botRes) {
              hitBots.push(botRes.bot);
              if (botRes.killed) {
                io.to(getLobbyRoom(lobbyId)).emit('bot:moved', {
                  botId: bot.id,
                  x: bot.x,
                  y: bot.y,
                  direction: bot.direction,
                  state: 'dead',
                  health: 0,
                  maxHealth: botRes.bot.maxHealth
                });
                io.to(getLobbyRoom(lobbyId)).emit('bot:removed', {
                  botId: bot.id,
                  killerId: playerId,
                  x: bot.x,
                  y: bot.y,
                  direction: bot.direction,
                  health: 0,
                  state: 'dead'
                });
              } else {
                io.to(getLobbyRoom(lobbyId)).emit('bot:moved', {
                  botId: bot.id,
                  x: bot.x,
                  y: bot.y,
                  direction: bot.direction,
                  state: 'damaged',
                  health: botRes.bot.health,
                  maxHealth: botRes.bot.maxHealth
                });
              }
            }
          }
        }

        io.to(getLobbyRoom(lobbyId)).emit('skill:effect', {
          casterId: playerId,
          skillIndex,
          hitPlayerIds: hitTargets.map((t) => t.id),
          hitBotIds: hitBots.map((b) => b.id)
        });

        callback({
          ok: true,
          hitCount: hitTargets.length + hitBots.length,
          hitPlayerIds: hitTargets.map((t) => t.id),
          hitBotIds: hitBots.map((b) => b.id)
        });
      } catch (error) {
        callback({ ok: false, message: 'Gagal mengeksekusi skill.' });
      }
    });

    socket.on('player:damage', async (callback = () => {}) => {
      callback({ ok: false, message: 'Client-directed direct damage tidak diizinkan.' });
    });

    socket.on('game:snapshot', async (callback = () => {}) => {
      callback(await getSnapshot());
    });

    socket.on('disconnect', async () => {
      if (connectedPlayers.get(playerId)?.id === socket.id) {
        connectedPlayers.delete(playerId);
        await updatePlayer(playerId, { disconnectedAt: Date.now() }).catch(() => {});
        leaveLobby(socket);
        io.to(getLobbyRoom(socket.data.lobbyId)).emit('player:left', { playerId });
      }
    });
  });

  return io;
};

module.exports = {
  attachRealtimeGame,
  BOT_TEMPLATES,
  clearLobbyBots,
  createManagedRoom,
  damageBot,
  deleteManagedRoom,
  getLobbyBots,
  getLobbySnapshot,
  GLOBAL_GAME,
  listManagedRooms,
  spawnBotForLobby
};
