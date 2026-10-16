const { pool } = require('../config/Database/MySQL/connection');

const ACHIEVEMENTS_CATALOG = [
  {
    id: 'first_game',
    name: 'Pemain Pemula',
    description: 'Menyelesaikan permainan pertama Anda.',
    icon: '🎮',
    check: () => true
  },
  {
    id: 'coin_collector',
    name: 'Kolektor Koin',
    description: 'Mengumpulkan setidaknya 30 koin dalam satu sesi permainan.',
    icon: '🪙',
    check: ({ coins }) => Number(coins) >= 30
  },
  {
    id: 'sharp_shooter',
    name: 'Penembak Jitu',
    description: 'Menjawab soal dengan akurasi sempurna 100%.',
    icon: '🎯',
    check: ({ accuracy }) => Number(accuracy) >= 100
  },
  {
    id: 'speed_demon',
    name: 'Iblis Kecepatan',
    description: 'Menyelesaikan permainan dengan sisa waktu lebih dari 60 detik.',
    icon: '⚡',
    check: ({ timeRemaining }) => Number(timeRemaining) > 60
  },
  {
    id: 'high_scorer',
    name: 'Bintang Prestasi',
    description: 'Mencapai skor 100 poin atau lebih dalam satu sesi.',
    icon: '⭐',
    check: ({ score }) => Number(score) >= 100
  }
];

const memoryAchievements = new Map();

class AchievementModel {
  static getCatalog() {
    return ACHIEVEMENTS_CATALOG.map(({ id, name, description, icon }) => ({
      id,
      name,
      description,
      icon
    }));
  }

  static async getUserAchievements(userId) {
    if (!userId) return [];
    const uid = String(userId);
    try {
      if (pool && typeof pool.query === 'function') {
        const [rows] = await pool.query(
          `SELECT badge_id AS id, badge_name AS name, badge_description AS description,
                  badge_icon AS icon, unlocked_at
           FROM user_achievements
           WHERE user_id = ?
           ORDER BY unlocked_at DESC, id ASC`,
          [uid]
        );
        if (rows && rows.length > 0) {
          memoryAchievements.set(uid, rows);
          return rows;
        }
      }
    } catch (error) {
      console.error('Error in AchievementModel.getUserAchievements:', error.message);
    }
    return memoryAchievements.get(uid) || [];
  }

  static async awardAchievement(userId, badge) {
    if (!userId || !badge) return false;
    const uid = String(userId);
    let mysqlSuccess = false;
    try {
      if (pool && typeof pool.query === 'function') {
        const [result] = await pool.query(
          `INSERT IGNORE INTO user_achievements (user_id, badge_id, badge_name, badge_description, badge_icon)
           VALUES (?, ?, ?, ?, ?)`,
          [
            uid,
            badge.id,
            badge.name,
            badge.description,
            badge.icon
          ]
        );
        mysqlSuccess = result.affectedRows > 0;
      }
    } catch (error) {
      console.error('Error in AchievementModel.awardAchievement:', error.message);
    }

    const list = memoryAchievements.get(uid) || [];
    if (!list.some((b) => b.id === badge.id)) {
      list.push({
        id: badge.id,
        name: badge.name,
        description: badge.description,
        icon: badge.icon,
        unlocked_at: new Date().toISOString()
      });
      memoryAchievements.set(uid, list);
      return true;
    }
    return mysqlSuccess;
  }
}

module.exports = AchievementModel;
module.exports.ACHIEVEMENTS_CATALOG = ACHIEVEMENTS_CATALOG;
