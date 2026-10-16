const { redisClient } = require('../config/Database/Redis/connections');
const LeaderboardModel = require('../models/leaderboardModel');

class LeaderboardService {
  static getDailyKey(date = new Date()) {
    const d = new Date(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `leaderboard:daily:${yyyy}-${mm}-${dd}`;
  }

  static getWeeklyKey(date = new Date()) {
    const d = new Date(date);
    const startOfYear = new Date(d.getFullYear(), 0, 1);
    const weekNumber = Math.ceil((((d - startOfYear) / 86400000) + startOfYear.getDay() + 1) / 7);
    return `leaderboard:weekly:${d.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
  }

  static getAllTimeKey() {
    return 'leaderboard:alltime';
  }

  static getKeyForPeriod(period = 'alltime') {
    switch (period) {
      case 'daily':
        return this.getDailyKey();
      case 'weekly':
        return this.getWeeklyKey();
      case 'alltime':
      default:
        return this.getAllTimeKey();
    }
  }

  static isRedisConnected() {
    return Boolean(redisClient && (redisClient.status === 'ready' || redisClient.status === 'connecting'));
  }

  /**
   * Mencatat skor pemain ke Redis ZSET dan MySQL.
   */
  static async recordScore({
    userId,
    username,
    score = 0,
    coins = 0,
    accuracy = 0,
    timeRemaining = 0,
    exp = null,
    botKills = 0,
    playerKills = 0,
    correctAnswers = 0
  }) {
    const numericScore = Math.max(0, parseInt(score, 10) || 0);
    const numericCoins = Math.max(0, parseInt(coins, 10) || 0);
    const numericAccuracy = Math.max(0, parseFloat(accuracy) || 0);
    const numericTime = Math.max(0, parseInt(timeRemaining, 10) || 0);
    const safeUsername = String(username || 'Pemain').trim();
    const uid = String(userId);

    // Hitung perolehan EXP pertandingan jika tidak ditentukan secara eksplisit
    const numericExp = exp !== null && exp !== undefined && !isNaN(Number(exp)) && Number(exp) > 0
      ? Math.max(0, parseInt(exp, 10) || 0)
      : this.calculateMatchExp({
          coins: numericCoins,
          botKills: Math.max(0, parseInt(botKills, 10) || 0),
          playerKills: Math.max(0, parseInt(playerKills, 10) || 0),
          accuracy: numericAccuracy,
          correctAnswers: Math.max(0, parseInt(correctAnswers, 10) || 0)
        });

    // 1. Simpan ke MySQL (riwayat persisten)
    let mysqlResult = null;
    try {
      mysqlResult = await LeaderboardModel.recordMatch({
        userId: uid,
        username: safeUsername,
        score: numericScore,
        coins: numericCoins,
        accuracy: numericAccuracy,
        timeRemaining: numericTime,
        exp: numericExp
      });
    } catch (mysqlErr) {
      console.warn('⚠️ [LeaderboardService] MySQL match recording failed:', mysqlErr.message);
    }

    // 2. Simpan ke Redis ZSET (Realtime Sorted Sets)
    let redisSuccess = false;
    try {
      if (this.isRedisConnected()) {
        const dailyKey = this.getDailyKey();
        const weeklyKey = this.getWeeklyKey();
        const alltimeKey = this.getAllTimeKey();

        const keys = [dailyKey, weeklyKey, alltimeKey];

        for (const key of keys) {
          const currentScore = await redisClient.zscore(key, uid);
          if (currentScore === null || numericScore > Number(currentScore)) {
            await redisClient.zadd(key, numericScore, uid);
          }
        }

        // Akumulasi totalExp di metadata Redis
        let currentExp = numericExp;
        try {
          const existingMeta = await redisClient.hgetall(`leaderboard:user:${uid}`);
          if (existingMeta?.totalExp) {
            currentExp = (Number(existingMeta.totalExp) || 0) + numericExp;
          }
        } catch (e) {}

        // Set metadata user di Redis
        await redisClient.hset(`leaderboard:user:${uid}`, {
          username: safeUsername,
          coins: String(numericCoins),
          accuracy: String(numericAccuracy),
          totalExp: String(currentExp)
        });

        // Set TTL untuk key harian (7 hari) dan mingguan (30 hari)
        if (typeof redisClient.expire === 'function') {
          await redisClient.expire(dailyKey, 7 * 86400).catch(() => {});
          await redisClient.expire(weeklyKey, 30 * 86400).catch(() => {});
        }

        redisSuccess = true;
      }
    } catch (redisErr) {
      console.warn('⚠️ [LeaderboardService] Redis ZSET update failed, fallback to MySQL:', redisErr.message);
    }

    return {
      userId: uid,
      username: safeUsername,
      score: numericScore,
      coins: numericCoins,
      accuracy: numericAccuracy,
      timeRemaining: numericTime,
      exp: numericExp,
      redisUpdated: redisSuccess,
      mysqlUpdated: Boolean(mysqlResult)
    };
  }

  /**
   * Mengambil peringkat teratas dari Redis ZSET atau fallback MySQL jika Redis offline.
   */
  static async getLeaderboard({ period = 'alltime', limit = 10, userId = null } = {}) {
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const targetKey = this.getKeyForPeriod(period);

    let rankings = [];
    let userRank = null;
    let source = 'redis';

    try {
      if (this.isRedisConnected()) {
        // ZREVRANGE key 0 limit-1 WITHSCORES
        const rawResults = await redisClient.zrevrange(targetKey, 0, safeLimit - 1, 'WITHSCORES');

        if (Array.isArray(rawResults) && rawResults.length > 0) {
          const members = [];
          for (let i = 0; i < rawResults.length; i += 2) {
            const memberId = rawResults[i];
            const memberScore = Number(rawResults[i + 1]) || 0;
            members.push({ memberId, score: memberScore });
          }

          // Ambil metadata masing-masing user
          for (let idx = 0; idx < members.length; idx++) {
            const { memberId, score } = members[idx];
            let meta = null;
            try {
              meta = await redisClient.hgetall(`leaderboard:user:${memberId}`);
            } catch (hErr) {
              meta = null;
            }

            rankings.push({
              rank: idx + 1,
              userId: memberId,
              username: meta?.username || `Pemain_${memberId.slice(-4)}`,
              score,
              coins: Number(meta?.coins) || 0,
              accuracy: Number(meta?.accuracy) || 0
            });
          }
        }

        // Jika userId diberikan, hitung peringkat spesifiknya
        if (userId) {
          const rankIndex = await redisClient.zrevrank(targetKey, String(userId));
          const score = await redisClient.zscore(targetKey, String(userId));
          if (rankIndex !== null && rankIndex !== undefined && score !== null) {
            const meta = await redisClient.hgetall(`leaderboard:user:${userId}`).catch(() => null);
            userRank = {
              rank: rankIndex + 1,
              userId: String(userId),
              username: meta?.username || 'Saya',
              score: Number(score) || 0,
              coins: Number(meta?.coins) || 0,
              accuracy: Number(meta?.accuracy) || 0
            };
          }
        }
      } else {
        source = 'mysql';
      }
    } catch (redisErr) {
      console.warn('⚠️ [LeaderboardService] Redis read failed, falling back to MySQL:', redisErr.message);
      source = 'mysql';
      rankings = [];
      userRank = null;
    }

    // Fallback ke MySQL jika Redis offline atau belum memiliki data
    if (rankings.length === 0 && source === 'mysql') {
      rankings = await LeaderboardModel.getTopScores(period, safeLimit);
      if (userId) {
        userRank = await LeaderboardModel.getUserRank(userId, period);
      }
    } else if (userId && !userRank) {
      userRank = await LeaderboardModel.getUserRank(userId, period);
    }

    return {
      period,
      limit: safeLimit,
      source,
      leaderboard: rankings,
      userRank
    };
  }

  /**
   * Mengambil peringkat pengguna tertentu.
   */
  static async getUserRank({ period = 'alltime', userId }) {
    if (!userId) return null;
    const targetKey = this.getKeyForPeriod(period);

    try {
      if (this.isRedisConnected()) {
        const rankIndex = await redisClient.zrevrank(targetKey, String(userId));
        const score = await redisClient.zscore(targetKey, String(userId));
        if (rankIndex !== null && rankIndex !== undefined && score !== null) {
          const meta = await redisClient.hgetall(`leaderboard:user:${userId}`).catch(() => null);
          return {
            rank: rankIndex + 1,
            userId: String(userId),
            username: meta?.username || 'Pemain',
            score: Number(score) || 0,
            coins: Number(meta?.coins) || 0,
            accuracy: Number(meta?.accuracy) || 0,
            source: 'redis'
          };
        }
      }
    } catch (err) {
      console.warn('⚠️ [LeaderboardService] Redis getUserRank error, fallback MySQL:', err.message);
    }

    const mysqlRank = await LeaderboardModel.getUserRank(userId, period);
    return mysqlRank ? { ...mysqlRank, source: 'mysql' } : null;
  }

  /**
   * Menghitung rank dan sub-tingkatan (1 sampai 5) berdasarkan total permainan (course attempt).
   * Ranks: Newbie (1-5), Rookie (1-5), Common (1-5), Beginner (1-5), Legendary (1-5).
   */
  static calculateTierProgress(gamesPlayed = 0) {
    const count = Math.max(0, parseInt(gamesPlayed, 10) || 0);

    const RANKS = [
      { id: 'newbie', name: 'Newbie', nextName: 'Rookie', minGames: 0, maxGames: 5 },
      { id: 'rookie', name: 'Rookie', nextName: 'Common', minGames: 5, maxGames: 15 },
      { id: 'common', name: 'Common', nextName: 'Beginner', minGames: 15, maxGames: 30 },
      { id: 'beginner', name: 'Beginner', nextName: 'Legendary', minGames: 30, maxGames: 55 },
      { id: 'legendary', name: 'Legendary', nextName: 'Max', minGames: 55, maxGames: 100 }
    ];

    let currentRank = RANKS[0];
    for (let i = RANKS.length - 1; i >= 0; i--) {
      if (count >= RANKS[i].minGames) {
        currentRank = RANKS[i];
        break;
      }
    }

    const rankRange = currentRank.maxGames - currentRank.minGames;
    const progressInRank = Math.min(rankRange, Math.max(0, count - currentRank.minGames));
    const subTierStep = rankRange / 5;
    const subTier = Math.min(5, Math.floor(progressInRank / subTierStep) + 1);

    const subTierStart = (subTier - 1) * subTierStep;
    const subTierEnd = subTier * subTierStep;
    const progressInSubTier = Math.min(subTierStep, Math.max(0, progressInRank - subTierStart));
    const percent = Math.min(100, Math.round((progressInSubTier / subTierStep) * 100));

    const nextSubTierName = subTier < 5
      ? `${currentRank.name} ${subTier + 1}`
      : (currentRank.nextName !== 'Max' ? `${currentRank.nextName} 1` : 'Max Level');

    return {
      rankId: currentRank.id,
      rankName: currentRank.name,
      subTier,
      fullRankName: `${currentRank.name} ${subTier}`,
      nextRankName: nextSubTierName,
      percent,
      gamesPlayed: count
    };
  }

  /**
   * Konfigurasi Rank dan Scaling EXP Berjenjang (Non-linear):
   * - Newbie: 100 EXP per tier (5 sub-tier = 500 EXP)
   * - Rookie: 250 EXP per tier (5 sub-tier = 1250 EXP, kumulatif: 1750 EXP)
   * - Common: 500 EXP per tier (5 sub-tier = 2500 EXP, kumulatif: 4250 EXP)
   * - Beginner: 1000 EXP per tier (5 sub-tier = 5000 EXP, kumulatif: 9250 EXP)
   * - Legendary: 2000 EXP per tier (5 sub-tier = 10000 EXP, kumulatif: 19250 EXP)
   */
  static get EXP_RANKS() {
    return [
      { id: 'newbie', name: 'Newbie', nextName: 'Rookie', expPerTier: 100, subTiers: 5, cumulativeStartExp: 0, cumulativeEndExp: 500 },
      { id: 'rookie', name: 'Rookie', nextName: 'Common', expPerTier: 250, subTiers: 5, cumulativeStartExp: 500, cumulativeEndExp: 1750 },
      { id: 'common', name: 'Common', nextName: 'Beginner', expPerTier: 500, subTiers: 5, cumulativeStartExp: 1750, cumulativeEndExp: 4250 },
      { id: 'beginner', name: 'Beginner', nextName: 'Legendary', expPerTier: 1000, subTiers: 5, cumulativeStartExp: 4250, cumulativeEndExp: 9250 },
      { id: 'legendary', name: 'Legendary', nextName: 'Max', expPerTier: 2000, subTiers: 5, cumulativeStartExp: 9250, cumulativeEndExp: 19250 }
    ];
  }

  /**
   * Menghitung rank dan progress tier saat ini berdasarkan total akumulasi EXP pemain.
   */
  static calculateExpTierProgress(totalExp = 0) {
    const safeExp = Math.max(0, parseInt(totalExp, 10) || 0);
    const ranks = this.EXP_RANKS;
    const maxRank = ranks[ranks.length - 1];

    if (safeExp >= maxRank.cumulativeEndExp) {
      return {
        rankId: maxRank.id,
        rankName: maxRank.name,
        subTier: 5,
        fullRankName: `${maxRank.name} 5 (Max)`,
        nextRankName: 'Max Level',
        nextMajorRankName: 'Max',
        percent: 100,
        expInCurrentTier: maxRank.expPerTier,
        expNeededForCurrentTier: maxRank.expPerTier,
        expRemainingToNextTier: 0,
        totalExp: safeExp,
        isMaxLevel: true
      };
    }

    let currentRank = ranks[0];
    let rankIndex = 0;
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (safeExp >= ranks[i].cumulativeStartExp) {
        currentRank = ranks[i];
        rankIndex = i;
        break;
      }
    }

    const expInRank = safeExp - currentRank.cumulativeStartExp;
    const subTier = Math.min(5, Math.floor(expInRank / currentRank.expPerTier) + 1);
    const subTierStart = (subTier - 1) * currentRank.expPerTier;
    const expInCurrentTier = expInRank - subTierStart;
    const expNeededForCurrentTier = currentRank.expPerTier;
    const expRemainingToNextTier = expNeededForCurrentTier - expInCurrentTier;
    const percent = Math.min(100, Math.floor((expInCurrentTier / expNeededForCurrentTier) * 100));

    let nextRankName = '';
    const nextMajor = ranks[rankIndex + 1];

    if (subTier < 5) {
      nextRankName = `${currentRank.name} ${subTier + 1}`;
    } else {
      nextRankName = nextMajor ? `${nextMajor.name} 1` : 'Max Level';
    }

    return {
      rankId: currentRank.id,
      rankName: currentRank.name,
      subTier,
      fullRankName: `${currentRank.name} ${subTier}`,
      nextRankName,
      nextMajorRankName: currentRank.nextName !== 'Max' ? currentRank.nextName : 'Max',
      percent,
      expInCurrentTier,
      expNeededForCurrentTier,
      expRemainingToNextTier,
      totalExp: safeExp,
      isMaxLevel: false
    };
  }

  /**
   * Menghitung perolehan EXP match berdasarkan performa game.
   */
  static calculateMatchExp({ coins = 0, botKills = 0, playerKills = 0, accuracy = 0, correctAnswers = 0 } = {}) {
    const c = Math.max(0, parseInt(coins, 10) || 0);
    const b = Math.max(0, parseInt(botKills, 10) || 0);
    const p = Math.max(0, parseInt(playerKills, 10) || 0);
    const acc = Math.max(0, Math.min(100, parseFloat(accuracy) || 0));
    const ca = Math.max(0, parseInt(correctAnswers, 10) || 0);

    const total = (c * 5) + (b * 15) + (p * 30) + (ca * 10) + Math.round(acc * 0.5) + 20;
    return Math.max(10, total);
  }

  /**
   * Mengambil statistik akumulatif permainan user (jumlah bermain, total skor, akurasi, rank, dan exp).
   */
  static async getUserStats(userId) {
    if (!userId) return null;
    const baseStats = await LeaderboardModel.getUserStats(userId);
    const rankInfo = await this.getUserRank({ period: 'alltime', userId });
    const tierProgress = this.calculateTierProgress(baseStats?.gamesPlayed || 0);

    // Cek apakah Redis memiliki akumulasi totalExp
    let redisExp = 0;
    try {
      if (this.isRedisConnected()) {
        const meta = await redisClient.hgetall(`leaderboard:user:${userId}`).catch(() => null);
        if (meta?.totalExp) {
          redisExp = Number(meta.totalExp) || 0;
        }
      }
    } catch (e) {}

    // Prioritaskan MySQL totalExp jika ada, lalu Redis totalExp, lalu fallback rumus
    let totalExp = 0;
    if (baseStats?.totalExp && Number(baseStats.totalExp) > 0) {
      totalExp = Number(baseStats.totalExp);
    } else if (redisExp > 0) {
      totalExp = redisExp;
    } else {
      totalExp = (baseStats?.totalScore || 0) + (baseStats?.totalCoins ? baseStats.totalCoins * 5 : 0);
    }

    const expTierProgress = this.calculateExpTierProgress(totalExp);

    return {
      ...baseStats,
      rank: rankInfo?.rank || null,
      topScore: rankInfo?.score || baseStats?.maxScore || 0,
      tierProgress,
      totalExp,
      exp: totalExp,
      expTierProgress
    };
  }
}

module.exports = LeaderboardService;
