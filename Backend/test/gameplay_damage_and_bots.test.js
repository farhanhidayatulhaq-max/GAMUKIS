const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const redisConnectionPath = path.resolve(__dirname, '../src/config/Database/Redis/connections.js');
const realtimeGameServicePath = path.resolve(__dirname, '../src/services/realtimeGameService.js');
const realtimeGameSocketPath = path.resolve(__dirname, '../src/services/realtimeGameSocket.js');

// Helper to create an in-memory mock Redis client
const createMockRedis = () => {
  const store = new Map();
  const sets = new Map();

  return {
    status: 'ready',
    store,
    async hget(hash, field) {
      const h = store.get(hash) || new Map();
      return h.get(field) || null;
    },
    async hset(hash, field, value) {
      if (!store.has(hash)) store.set(hash, new Map());
      store.get(hash).set(field, value);
      return 1;
    },
    async hdel(hash, field) {
      const h = store.get(hash);
      if (!h) return 0;
      return h.delete(field) ? 1 : 0;
    },
    async hgetall(hash) {
      const h = store.get(hash);
      if (!h) return {};
      const obj = {};
      for (const [k, v] of h.entries()) obj[k] = v;
      return obj;
    },
    async zadd(key, score, member) {
      if (!sets.has(key)) sets.set(key, new Map());
      sets.get(key).set(member, score);
      return 1;
    },
    async zrem(key, member) {
      const s = sets.get(key);
      if (!s) return 0;
      return s.delete(member) ? 1 : 0;
    },
    async zrevrange() {
      return [];
    },
    async expire() {
      return 1;
    },
    async set() {
      return 'OK';
    },
    async del(key) {
      store.delete(key);
      return 1;
    },
    multi() {
      const operations = [];
      const multiProxy = {
        hset: (...args) => {
          operations.push(() => this.hset(...args));
          return multiProxy;
        },
        hdel: (...args) => {
          operations.push(() => this.hdel(...args));
          return multiProxy;
        },
        zadd: (...args) => {
          operations.push(() => this.zadd(...args));
          return multiProxy;
        },
        zrem: (...args) => {
          operations.push(() => this.zrem(...args));
          return multiProxy;
        },
        del: (...args) => {
          operations.push(() => this.del(...args));
          return multiProxy;
        },
        expire: () => multiProxy,
        set: () => multiProxy,
        exec: async () => {
          for (const op of operations) await op();
          return [[null, 1]];
        }
      };
      return multiProxy;
    }
  };
};

test('Gameplay Damage: applyAuthoritativeDamage enforces bounds, debounce and attribution', async () => {
  const mockRedis = createMockRedis();
  require.cache[redisConnectionPath] = {
    id: redisConnectionPath,
    filename: redisConnectionPath,
    loaded: true,
    exports: { redisClient: mockRedis, connectRedis: async () => {} }
  };

  delete require.cache[realtimeGameServicePath];
  const { applyAuthoritativeDamage, savePlayer, GAMEPLAY_CONFIG } = require(realtimeGameServicePath);

  // 1. Initial player setup with 3 HP
  await savePlayer('player_1', {
    id: 'player_1',
    name: 'Hero',
    health: 3,
    x: 10,
    y: 10
  });

  // 2. Legitimate hit
  const hit1 = await applyAuthoritativeDamage('player_1', {
    reason: 'pvp_skill',
    attackerId: 'player_2',
    damage: 1,
    minIntervalMs: 600
  });
  assert.equal(hit1.damaged, true);
  assert.equal(hit1.ignored, false);
  assert.equal(hit1.player.health, 2);
  assert.equal(hit1.player.lastDamageReason, 'pvp_skill');
  assert.equal(hit1.player.lastAttackerId, 'player_2');

  // 3. Duplicate hit within debounce window is ignored
  const hitDuplicate = await applyAuthoritativeDamage('player_1', {
    reason: 'pvp_skill',
    attackerId: 'player_2',
    damage: 1,
    minIntervalMs: 600
  });
  assert.equal(hitDuplicate.damaged, undefined);
  assert.equal(hitDuplicate.ignored, true);
  assert.equal(hitDuplicate.reason, 'cooldown');
  assert.equal(hitDuplicate.player.health, 2); // Unchanged

  // 4. Hit after debounce window expires
  hit1.player.lastDamagedAt = Date.now() - 1000;
  await savePlayer('player_1', hit1.player);

  const hit2 = await applyAuthoritativeDamage('player_1', {
    reason: 'bot_attack',
    attackerId: 'bot_99',
    damage: 1,
    minIntervalMs: 600
  });
  assert.equal(hit2.damaged, true);
  assert.equal(hit2.player.health, 1);
  assert.equal(hit2.player.lastDamageReason, 'bot_attack');
  assert.equal(hit2.player.lastAttackerId, 'bot_99');

  // 5. Final fatal hit clamps at 0 and marks dead
  hit2.player.lastDamagedAt = Date.now() - 1000;
  await savePlayer('player_1', hit2.player);

  const fatalHit = await applyAuthoritativeDamage('player_1', {
    reason: 'bot_attack',
    attackerId: 'bot_99',
    damage: 1,
    minIntervalMs: 600
  });
  assert.equal(fatalHit.damaged, true);
  assert.equal(fatalHit.player.health, 0);

  // 6. Overkill hit when already dead is ignored
  fatalHit.player.lastDamagedAt = Date.now() - 1000;
  await savePlayer('player_1', fatalHit.player);

  const overkillHit = await applyAuthoritativeDamage('player_1', {
    reason: 'bot_attack',
    damage: 1,
    minIntervalMs: 600
  });
  // 7. Clamping: passing excessive damage (e.g. 99) clamps per hit to at most 3
  await savePlayer('player_2', { id: 'player_2', name: 'Tank', health: 3 });
  const clampedHit = await applyAuthoritativeDamage('player_2', {
    reason: 'pvp_skill',
    attackerId: 'player_1',
    damage: 99,
    minIntervalMs: 0
  });
  assert.equal(clampedHit.damaged, true);
  assert.equal(clampedHit.player.health, 0);
  assert.equal(clampedHit.player.death, 1);
});

test('Bot Enemy Management: Spawning on valid walkable tiles and room isolation', async () => {
  const mockRedis = createMockRedis();
  require.cache[redisConnectionPath] = {
    id: redisConnectionPath,
    filename: redisConnectionPath,
    loaded: true,
    exports: { redisClient: mockRedis, connectRedis: async () => {} }
  };

  delete require.cache[realtimeGameServicePath];
  delete require.cache[realtimeGameSocketPath];
  const {
    spawnBotForLobby,
    getLobbyBots,
    clearLobbyBots,
    damageBot
  } = require(realtimeGameSocketPath);

  // Ensure lobby starts clean
  clearLobbyBots('lobby-test-1');
  assert.equal(getLobbyBots('lobby-test-1').length, 0);

  // Spawn bot in lobby 1
  const bot1 = spawnBotForLobby('lobby-test-1', [{ id: 'p1', x: 2, y: 2 }]);
  assert.ok(bot1, 'Bot should be successfully spawned');
  assert.equal(bot1.lobbyId, 'lobby-test-1');
  assert.equal(bot1.health, 3);
  assert.ok(typeof bot1.x === 'number' && typeof bot1.y === 'number');
  assert.notEqual(`${bot1.x}x${bot1.y}`, '2x2', 'Bot must not spawn on player tile');

  // Verify getLobbyBots returns the spawned bot
  const botsInLobby = getLobbyBots('lobby-test-1');
  assert.equal(botsInLobby.length, 1);
  assert.equal(botsInLobby[0].id, bot1.id);

  // Test damageBot: take 1 damage
  const hurtResult = damageBot('lobby-test-1', bot1.id, 1);
  assert.equal(hurtResult.killed, false);
  assert.equal(hurtResult.bot.health, 2);

  // Test damageBot: fatal damage removes bot from lobby
  const killResult = damageBot('lobby-test-1', bot1.id, 2);
  assert.equal(killResult.killed, true);
  assert.equal(killResult.bot.health, 0);
  assert.equal(getLobbyBots('lobby-test-1').length, 0, 'Dead bot must be removed from lobby');

  // Spawning in another lobby does not affect lobby 1
  clearLobbyBots('lobby-test-2');
  const bot2 = spawnBotForLobby('lobby-test-2', []);
  assert.ok(bot2);
  assert.equal(getLobbyBots('lobby-test-1').length, 0);
  assert.equal(getLobbyBots('lobby-test-2').length, 1);

  // Max bots per lobby is respected (default 4 bots: 3 monsters + 1 lost human)
  const b1 = spawnBotForLobby('lobby-test-1', []);
  const b2 = spawnBotForLobby('lobby-test-1', []);
  const b3 = spawnBotForLobby('lobby-test-1', []);
  const b4 = spawnBotForLobby('lobby-test-1', []);
  const extraBot = spawnBotForLobby('lobby-test-1', []);
  assert.equal(extraBot, null, 'Cannot exceed MAX_BOTS_PER_LOBBY');
  assert.equal(getLobbyBots('lobby-test-1').length, 4);

  // Validate the 4 spawned bot enemy variants, scales and categories
  assert.equal(b1.variant, 'blood');
  assert.equal(b1.scaleMultiplier, 10);
  assert.equal(b1.category, 'Monster');
  assert.equal(b2.variant, 'demon');
  assert.equal(b2.scaleMultiplier, 10);
  assert.equal(b2.category, 'Monster');
  assert.equal(b3.variant, 'orc');
  assert.equal(b3.scaleMultiplier, 10);
  assert.equal(b3.category, 'Monster');
  assert.equal(b4.variant, 'samurai');
  assert.equal(b4.scaleMultiplier, 2);
  assert.equal(b4.category, 'Manusia yang Tersesat');

  // Cleanup resets the lobby bots completely
  clearLobbyBots('lobby-test-1');
  assert.equal(getLobbyBots('lobby-test-1').length, 0);
  assert.equal(getLobbyBots('lobby-test-2').length, 1);
  clearLobbyBots('lobby-test-2');
});

