const test = require('node:test');
const assert = require('node:assert/strict');
const LeaderboardService = require('../src/services/leaderboardService');

test('Backend - EXP Non-linear Difficulty Scaling & Rank Progressions', async (t) => {
  await t.test('Newbie scaling: 100 EXP per tier (up to 500 total)', () => {
    const t0 = LeaderboardService.calculateExpTierProgress(0);
    assert.equal(t0.rankName, 'Newbie');
    assert.equal(t0.subTier, 1);
    assert.equal(t0.percent, 0);
    assert.equal(t0.nextMajorRankName, 'Rookie');

    const t50 = LeaderboardService.calculateExpTierProgress(50);
    assert.equal(t50.subTier, 1);
    assert.equal(t50.percent, 50);

    const t100 = LeaderboardService.calculateExpTierProgress(100);
    assert.equal(t100.subTier, 2);
    assert.equal(t100.percent, 0);

    const t400 = LeaderboardService.calculateExpTierProgress(400);
    assert.equal(t400.subTier, 5);
  });

  await t.test('Rookie scaling: 250 EXP per tier (500 to 1750 EXP)', () => {
    const rStart = LeaderboardService.calculateExpTierProgress(500);
    assert.equal(rStart.rankName, 'Rookie');
    assert.equal(rStart.subTier, 1);
    assert.equal(rStart.percent, 0);
    assert.equal(rStart.nextMajorRankName, 'Common');

    const rMid = LeaderboardService.calculateExpTierProgress(625);
    assert.equal(rMid.subTier, 1);
    assert.equal(rMid.percent, 50);

    const rTier2 = LeaderboardService.calculateExpTierProgress(750);
    assert.equal(rTier2.subTier, 2);
  });

  await t.test('Common scaling: 500 EXP per tier (1750 to 4250 EXP)', () => {
    const cStart = LeaderboardService.calculateExpTierProgress(1750);
    assert.equal(cStart.rankName, 'Common');
    assert.equal(cStart.subTier, 1);
    assert.equal(cStart.percent, 0);
    assert.equal(cStart.nextMajorRankName, 'Beginner');

    // 2050 EXP -> 300 / 500 = 60% (matches user mockup!)
    const c60 = LeaderboardService.calculateExpTierProgress(2050);
    assert.equal(c60.rankName, 'Common');
    assert.equal(c60.subTier, 1);
    assert.equal(c60.percent, 60);
    assert.equal(c60.nextMajorRankName, 'Beginner');
  });

  await t.test('Beginner scaling: 1000 EXP per tier (4250 to 9250 EXP)', () => {
    const bStart = LeaderboardService.calculateExpTierProgress(4250);
    assert.equal(bStart.rankName, 'Beginner');
    assert.equal(bStart.subTier, 1);
    assert.equal(bStart.percent, 0);
    assert.equal(bStart.nextMajorRankName, 'Legendary');
  });

  await t.test('Legendary scaling: 2000 EXP per tier (9250 to 19250 EXP, max capped)', () => {
    const lStart = LeaderboardService.calculateExpTierProgress(9250);
    assert.equal(lStart.rankName, 'Legendary');
    assert.equal(lStart.subTier, 1);

    const maxExp = LeaderboardService.calculateExpTierProgress(25000);
    assert.equal(maxExp.rankName, 'Legendary');
    assert.equal(maxExp.subTier, 5);
    assert.equal(maxExp.percent, 100);
    assert.equal(maxExp.isMaxLevel, true);
  });

  await t.test('Per-match EXP formula calculation', () => {
    const exp = LeaderboardService.calculateMatchExp({
      coins: 10,
      botKills: 2,
      playerKills: 1,
      correctAnswers: 5,
      accuracy: 80
    });
    // 50 + 30 + 30 + 50 + 40 + 20 = 220
    assert.equal(exp, 220);
  });
});

