const { pool } = require('../config/Database/MySQL/connection');

class LeaderboardModel {
  static async recordMatch({ userId, username, score = 0, coins = 0, accuracy = 0, timeRemaining = 0, exp = 0 }) {
    const numExp = Math.max(0, parseInt(exp, 10) || 0);
    try {
      let result;
      try {
        [result] = await pool.query(
          `INSERT INTO match_history (user_id, username, score, coins, accuracy, time_remaining, exp)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            String(userId),
            String(username || 'Pemain'),
            Math.max(0, parseInt(score, 10) || 0),
            Math.max(0, parseInt(coins, 10) || 0),
            Math.max(0, parseFloat(accuracy) || 0),
            Math.max(0, parseInt(timeRemaining, 10) || 0),
            numExp
          ]
        );
      } catch (insertErr) {
        if (insertErr.message && insertErr.message.includes("Unknown column 'exp'")) {
          [result] = await pool.query(
            `INSERT INTO match_history (user_id, username, score, coins, accuracy, time_remaining)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              String(userId),
              String(username || 'Pemain'),
              Math.max(0, parseInt(score, 10) || 0),
              Math.max(0, parseInt(coins, 10) || 0),
              Math.max(0, parseFloat(accuracy) || 0),
              Math.max(0, parseInt(timeRemaining, 10) || 0)
            ]
          );
        } else {
          throw insertErr;
        }
      }
      return { id: result.insertId, userId, username, score, coins, accuracy, timeRemaining, exp: numExp };
    } catch (error) {
      console.error('Error in LeaderboardModel.recordMatch:', error.message);
      return null;
    }
  }

  static async getTopScores(period = 'alltime', limit = 10) {
    const safeLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    let timeClause = '';

    if (period === 'daily') {
      timeClause = 'WHERE created_at >= CURDATE()';
    } else if (period === 'weekly') {
      timeClause = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    try {
      const [rows] = await pool.query(
        `SELECT user_id, username, MAX(score) AS score, MAX(coins) AS coins, MAX(accuracy) AS accuracy
         FROM match_history
         ${timeClause}
         GROUP BY user_id, username
         ORDER BY score DESC, coins DESC, user_id ASC
         LIMIT ?`,
        [safeLimit]
      );

      return rows.map((row, index) => ({
        rank: index + 1,
        userId: row.user_id,
        username: row.username,
        score: Number(row.score) || 0,
        coins: Number(row.coins) || 0,
        accuracy: Number(row.accuracy) || 0
      }));
    } catch (error) {
      console.error('Error in LeaderboardModel.getTopScores:', error.message);
      return [];
    }
  }

  static async getUserRank(userId, period = 'alltime') {
    if (!userId) return null;
    let timeClause = '';
    if (period === 'daily') {
      timeClause = 'WHERE created_at >= CURDATE()';
    } else if (period === 'weekly') {
      timeClause = 'WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    }

    try {
      // Dapatkan top score user beserta username terakhir
      const [userRows] = await pool.query(
        `SELECT username, MAX(score) AS score, MAX(coins) AS coins, MAX(accuracy) AS accuracy
         FROM match_history
         ${timeClause ? `${timeClause} AND user_id = ?` : 'WHERE user_id = ?'}
         GROUP BY user_id, username
         ORDER BY score DESC LIMIT 1`,
        [String(userId)]
      );

      const userScore = userRows[0]?.score;
      if (userScore === null || userScore === undefined) {
        return null;
      }

      // Hitung rank berapa orang yang punya score lebih tinggi
      const [rankRows] = await pool.query(
        `SELECT COUNT(DISTINCT user_id) AS higher_count
         FROM match_history
         ${timeClause ? `${timeClause} AND score > ?` : 'WHERE score > ?'}`,
        [userScore]
      );

      const rank = (rankRows[0]?.higher_count || 0) + 1;
      return {
        rank,
        userId: String(userId),
        username: userRows[0]?.username || 'Pemain',
        score: Number(userScore) || 0,
        coins: Number(userRows[0]?.coins) || 0,
        accuracy: Number(userRows[0]?.accuracy) || 0
      };
    } catch (error) {
      console.error('Error in LeaderboardModel.getUserRank:', error.message);
      return null;
    }
  }

  static async getUserStats(userId) {
    if (!userId) return null;
    try {
      let rows;
      try {
        [rows] = await pool.query(
          `SELECT 
             COUNT(*) AS total_games,
             COALESCE(SUM(score), 0) AS total_score,
             COALESCE(MAX(score), 0) AS max_score,
             COALESCE(SUM(coins), 0) AS total_coins,
             COALESCE(AVG(accuracy), 0) AS avg_accuracy,
             COALESCE(SUM(exp), 0) AS total_exp
           FROM match_history
           WHERE user_id = ?`,
          [String(userId)]
        );
      } catch (queryErr) {
        if (queryErr.message && queryErr.message.includes("Unknown column 'exp'")) {
          [rows] = await pool.query(
            `SELECT 
               COUNT(*) AS total_games,
               COALESCE(SUM(score), 0) AS total_score,
               COALESCE(MAX(score), 0) AS max_score,
               COALESCE(SUM(coins), 0) AS total_coins,
               COALESCE(AVG(accuracy), 0) AS avg_accuracy
             FROM match_history
             WHERE user_id = ?`,
            [String(userId)]
          );
        } else {
          throw queryErr;
        }
      }

      const stats = rows[0] || {};
      const gamesCount = Number(stats.total_games) || 0;
      const totalScore = Number(stats.total_score) || 0;
      const avgAccuracy = Math.round(Number(stats.avg_accuracy) || 0);
      const totalExp = Number(stats.total_exp) || 0;

      return {
        userId: String(userId),
        gamesPlayed: gamesCount,
        totalScore,
        maxScore: Number(stats.max_score) || 0,
        totalCoins: Number(stats.total_coins) || 0,
        avgAccuracy,
        totalExp
      };
    } catch (error) {
      console.error('Error in LeaderboardModel.getUserStats:', error.message);
      return {
        userId: String(userId),
        gamesPlayed: 0,
        totalScore: 0,
        maxScore: 0,
        totalCoins: 0,
        avgAccuracy: 0,
        totalExp: 0
      };
    }
  }
}

module.exports = LeaderboardModel;
