const AchievementModel = require('../models/achievementModel');

class AchievementService {
  /**
   * Mengambil semua definisi badge / achievements yang tersedia.
   */
  static getAllAchievements() {
    return AchievementModel.getCatalog();
  }

  /**
   * Mengambil badge yang sudah diraih oleh seorang user.
   */
  static async getUserAchievements(userId) {
    if (!userId) return [];
    return AchievementModel.getUserAchievements(userId);
  }

  /**
   * Mengevaluasi performa game dan memberikan badge yang belum dimiliki jika syarat terpenuhi.
   */
  static async evaluateAchievements({ userId, score = 0, coins = 0, accuracy = 0, timeRemaining = 0 }) {
    if (!userId) return { newlyUnlocked: [], unlocked: [] };

    const uid = String(userId);
    const existingBadges = await AchievementModel.getUserAchievements(uid);
    const unlockedIds = new Set(existingBadges.map((b) => b.id));

    const gameStats = {
      score: Number(score) || 0,
      coins: Number(coins) || 0,
      accuracy: Number(accuracy) || 0,
      timeRemaining: Number(timeRemaining) || 0
    };

    const newlyUnlocked = [];

    for (const badgeDef of AchievementModel.ACHIEVEMENTS_CATALOG) {
      if (!unlockedIds.has(badgeDef.id)) {
        if (typeof badgeDef.check === 'function' && badgeDef.check(gameStats)) {
          const awarded = await AchievementModel.awardAchievement(uid, badgeDef);
          if (awarded) {
            newlyUnlocked.push({
              id: badgeDef.id,
              name: badgeDef.name,
              description: badgeDef.description,
              icon: badgeDef.icon,
              unlocked_at: new Date().toISOString()
            });
            unlockedIds.add(badgeDef.id);
          }
        }
      }
    }

    const updatedBadges = await AchievementModel.getUserAchievements(uid);

    return {
      newlyUnlocked,
      unlocked: updatedBadges.length > 0 ? updatedBadges : existingBadges.concat(newlyUnlocked)
    };
  }
}

module.exports = AchievementService;
