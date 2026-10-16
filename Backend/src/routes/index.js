const express = require('express');
const router = express.Router();

const manualAuthRoute = require('./manualAuthRoute');
const accessRoute = require('./accessRoute');
const teacherApplicationRoute = require('./teacherApplicationRoute');
const adminRoomRoute = require('./adminRoomRoute');
const membershipRoute = require('./membershipRoute');
const characterRoute = require('./characterRoute');
const questionRoute = require('./questionRoute');
const leaderboardRoute = require('./leaderboardRoute');
const achievementRoute = require('./achievementRoute');

router.use('/auth/manual', manualAuthRoute);
router.use('/access', accessRoute);
router.use('/admin/teachers', teacherApplicationRoute);
router.use('/admin/rooms', adminRoomRoute);
router.use('/memberships', membershipRoute);
router.use('/characters', characterRoute);
router.use('/questions', questionRoute);
router.use('/leaderboard', leaderboardRoute);
router.use('/achievements', achievementRoute);

try {
  const firebaseAuthRoute = require('./firebaseAuthRoute');
  router.use('/auth', firebaseAuthRoute);
} catch (e) {
  // Firebase optional
}

module.exports = router;