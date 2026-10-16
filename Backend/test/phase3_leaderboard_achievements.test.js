const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const request = require('supertest');

const AchievementService = require('../src/services/achievementService');
const AchievementModel = require('../src/models/achievementModel');
const LeaderboardService = require('../src/services/leaderboardService');
const LeaderboardModel = require('../src/models/leaderboardModel');
const leaderboardRoute = require('../src/routes/leaderboardRoute');
const achievementRoute = require('../src/routes/achievementRoute');
const { pool } = require('../src/config/Database/MySQL/connection');
const { redisClient } = require('../src/config/Database/Redis/connections');

test('Phase 3 - Achievements Catalog & Rules Evaluation', async (t) => {
  const catalog = AchievementService.getAllAchievements();
  assert.ok(Array.isArray(catalog));
  assert.ok(catalog.length >= 4);

  const ids = catalog.map((a) => a.id);
  assert.ok(ids.includes('first_game'), 'Harus memiliki achievement first_game');
  assert.ok(ids.includes('coin_collector'), 'Harus memiliki achievement coin_collector');
  assert.ok(ids.includes('sharp_shooter'), 'Harus memiliki achievement sharp_shooter');
  assert.ok(ids.includes('speed_demon'), 'Harus memiliki achievement speed_demon');

  // Test rule checks in ACHIEVEMENTS_CATALOG
  const firstGameBadge = AchievementModel.ACHIEVEMENTS_CATALOG.find((b) => b.id === 'first_game');
  assert.equal(firstGameBadge.check({}), true);

  const coinBadge = AchievementModel.ACHIEVEMENTS_CATALOG.find((b) => b.id === 'coin_collector');
  assert.equal(coinBadge.check({ coins: 30 }), true);
  assert.equal(coinBadge.check({ coins: 25 }), false);

  const accuracyBadge = AchievementModel.ACHIEVEMENTS_CATALOG.find((b) => b.id === 'sharp_shooter');
  assert.equal(accuracyBadge.check({ accuracy: 100 }), true);
  assert.equal(accuracyBadge.check({ accuracy: 90 }), false);

  const speedBadge = AchievementModel.ACHIEVEMENTS_CATALOG.find((b) => b.id === 'speed_demon');
  assert.equal(speedBadge.check({ timeRemaining: 65 }), true);
  assert.equal(speedBadge.check({ timeRemaining: 40 }), false);
});

test('Phase 3 - Leaderboard Period Key Generation', async () => {
  const daily = LeaderboardService.getDailyKey(new Date('2026-10-11T00:00:00Z'));
  assert.match(daily, /^leaderboard:daily:\d{4}-\d{2}-\d{2}$/);

  const weekly = LeaderboardService.getWeeklyKey(new Date('2026-10-11T00:00:00Z'));
  assert.match(weekly, /^leaderboard:weekly:\d{4}-W\d{2}$/);

  const alltime = LeaderboardService.getAllTimeKey();
  assert.equal(alltime, 'leaderboard:alltime');
});

test('Phase 3 - LeaderboardService with Mock Redis ZSET Pipeline', async () => {
  const originalStatus = redisClient.status;
  const originalZrevrange = redisClient.zrevrange;
  const originalZscore = redisClient.zscore;
  const originalZrevrank = redisClient.zrevrank;
  const originalZadd = redisClient.zadd;
  const originalHset = redisClient.hset;
  const originalHgetall = redisClient.hgetall;

  // Pasang status ready
  redisClient.status = 'ready';

  const mockZset = new Map();
  const mockHashes = new Map();

  redisClient.zscore = async (key, member) => {
    return mockZset.has(member) ? String(mockZset.get(member)) : null;
  };

  redisClient.zadd = async (key, score, member) => {
    mockZset.set(member, Number(score));
    return 1;
  };

  redisClient.hset = async (key, obj) => {
    mockHashes.set(key, obj);
    return 1;
  };

  redisClient.hgetall = async (key) => {
    return mockHashes.get(key) || null;
  };

  redisClient.zrevrange = async (key, start, stop, withScores) => {
    const sorted = Array.from(mockZset.entries()).sort((a, b) => b[1] - a[1]);
    const sliced = sorted.slice(start, stop + 1);
    const result = [];
    for (const [mem, sc] of sliced) {
      result.push(mem, String(sc));
    }
    return result;
  };

  redisClient.zrevrank = async (key, member) => {
    const sorted = Array.from(mockZset.entries()).sort((a, b) => b[1] - a[1]);
    const idx = sorted.findIndex(([m]) => m === member);
    return idx >= 0 ? idx : null;
  };

  try {
    // Record scores
    await LeaderboardService.recordScore({
      userId: 'user_101',
      username: 'Budi Santoso',
      score: 150,
      coins: 35,
      accuracy: 95
    });

    await LeaderboardService.recordScore({
      userId: 'user_102',
      username: 'Siti Rahma',
      score: 200,
      coins: 50,
      accuracy: 100
    });

    // Query leaderboard
    const result = await LeaderboardService.getLeaderboard({ period: 'alltime', limit: 10, userId: 'user_101' });
    assert.equal(result.source, 'redis');
    assert.equal(result.leaderboard.length, 2);
    assert.equal(result.leaderboard[0].username, 'Siti Rahma');
    assert.equal(result.leaderboard[0].score, 200);
    assert.equal(result.leaderboard[0].rank, 1);

    assert.equal(result.leaderboard[1].username, 'Budi Santoso');
    assert.equal(result.leaderboard[1].score, 150);
    assert.equal(result.leaderboard[1].rank, 2);

    assert.ok(result.userRank);
    assert.equal(result.userRank.rank, 2);
    assert.equal(result.userRank.score, 150);
  } finally {
    redisClient.status = originalStatus;
    redisClient.zrevrange = originalZrevrange;
    redisClient.zscore = originalZscore;
    redisClient.zrevrank = originalZrevrank;
    redisClient.zadd = originalZadd;
    redisClient.hset = originalHset;
    redisClient.hgetall = originalHgetall;
  }
});

test('Phase 3 - LeaderboardService Fallback to MySQL when Redis offline', async () => {
  const originalStatus = redisClient.status;
  redisClient.status = 'end'; // offline

  const originalGetTopScores = LeaderboardModel.getTopScores;
  const originalGetUserRank = LeaderboardModel.getUserRank;

  LeaderboardModel.getTopScores = async () => [
    { rank: 1, userId: 'mysql_user_1', username: 'Pemain MySQL', score: 120, coins: 20, accuracy: 80 }
  ];

  LeaderboardModel.getUserRank = async (uid) => ({
    rank: 1, userId: uid, score: 120, coins: 20, accuracy: 80
  });

  try {
    const result = await LeaderboardService.getLeaderboard({ period: 'daily', limit: 5, userId: 'mysql_user_1' });
    assert.equal(result.source, 'mysql');
    assert.equal(result.leaderboard.length, 1);
    assert.equal(result.leaderboard[0].username, 'Pemain MySQL');
    assert.equal(result.userRank.rank, 1);
  } finally {
    redisClient.status = originalStatus;
    LeaderboardModel.getTopScores = originalGetTopScores;
    LeaderboardModel.getUserRank = originalGetUserRank;
  }
});

test('Phase 3 - API HTTP Endpoints (Leaderboard & Achievements)', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/leaderboard', leaderboardRoute);
  app.use('/api/achievements', achievementRoute);

  // 1. GET /api/achievements/list
  const resList = await request(app).get('/api/achievements/list');
  assert.equal(resList.status, 200);
  assert.equal(resList.body.status, 'success');
  assert.ok(Array.isArray(resList.body.achievements));

  // 2. GET /api/achievements/my without userId should return 401
  const resMyNoAuth = await request(app).get('/api/achievements/my');
  assert.equal(resMyNoAuth.status, 401);

  // 3. GET /api/achievements/my?userId=test_user
  const resMy = await request(app).get('/api/achievements/my?userId=test_user');
  assert.equal(resMy.status, 200);
  assert.equal(resMy.body.status, 'success');
  assert.ok(Array.isArray(resMy.body.achievements));

  // 4. POST /api/leaderboard/record
  const resRecord = await request(app)
    .post('/api/leaderboard/record')
    .send({
      userId: 'tester_42',
      username: 'Gamer Sejati',
      score: 180,
      coins: 45,
      accuracy: 100,
      timeRemaining: 75
    });

  assert.equal(resRecord.status, 200);
  assert.equal(resRecord.body.status, 'success');
  assert.equal(resRecord.body.record.username, 'Gamer Sejati');
  assert.equal(resRecord.body.record.score, 180);

  // 5. GET /api/leaderboard
  const resLeaderboard = await request(app).get('/api/leaderboard?period=alltime&limit=5');
  assert.equal(resLeaderboard.status, 200);
  assert.equal(resLeaderboard.body.status, 'success');
  assert.ok(Array.isArray(resLeaderboard.body.leaderboard));
});

test('Phase 3 - LeaderboardModel.getUserRank provides username and deterministic sort', async () => {
  const originalQuery = pool.query;
  pool.query = async (sql, params = []) => {
    if (sql.includes('ORDER BY score DESC LIMIT 1')) {
      return [[{ username: 'Budi Santoso', score: 250, coins: 50, accuracy: 95 }]];
    }
    if (sql.includes('higher_count')) {
      return [[{ higher_count: 2 }]];
    }
    if (sql.includes('ORDER BY score DESC, coins DESC, user_id ASC')) {
      return [[
        { user_id: 'u1', username: 'Juara 1', score: 300, coins: 60, accuracy: 100 },
        { user_id: 'u2', username: 'Juara 2', score: 250, coins: 50, accuracy: 95 }
      ]];
    }
    return [[]];
  };

  try {
    const rankInfo = await LeaderboardModel.getUserRank('u2');
    assert.equal(rankInfo.rank, 3);
    assert.equal(rankInfo.username, 'Budi Santoso');
    assert.equal(rankInfo.score, 250);

    const topScores = await LeaderboardModel.getTopScores('alltime', 2);
    assert.equal(topScores.length, 2);
    assert.equal(topScores[0].rank, 1);
    assert.equal(topScores[0].username, 'Juara 1');
  } finally {
    pool.query = originalQuery;
  }
});

test('Phase 3 - AchievementModel fallback works seamlessly when MySQL is offline', async () => {
  const originalQuery = pool.query;
  pool.query = async () => {
    throw new Error('MySQL connection refused');
  };

  try {
    const awarded = await AchievementModel.awardAchievement('user_offline_1', {
      id: 'first_game',
      name: 'Pemain Pemula',
      description: 'Menyelesaikan permainan pertama Anda.',
      icon: '🎮'
    });
    assert.equal(awarded, true);

    const achievements = await AchievementModel.getUserAchievements('user_offline_1');
    assert.equal(achievements.length, 1);
    assert.equal(achievements[0].id, 'first_game');
    assert.equal(achievements[0].name, 'Pemain Pemula');
  } finally {
    pool.query = originalQuery;
  }
});

