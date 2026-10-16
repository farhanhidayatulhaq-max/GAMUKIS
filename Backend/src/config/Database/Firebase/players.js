const express = require('express');
const { firebaseAuth, firebaseDatabase } = require('./admin');
const { pool } = require('../MySQL/connection');
const { authenticateAny } = require('../../../middlewares/anyAuthMiddleware');
const { requirePermission, requireSelfOr } = require('../../../middlewares/roleMiddleware');

const router = express.Router();

const authenticateFirebaseUser = async (req, res, next) => {
  const authorization = req.headers.authorization || '';

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Firebase ID token diperlukan.' });
  }

  try {
    const idToken = authorization.slice('Bearer '.length);
    req.user = await firebaseAuth.verifyIdToken(idToken);
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Firebase ID token tidak valid.' });
  }
};

router.use(authenticateAny);

router.post('/history', async (req, res) => {
  try {
    const {
      time_playing: timePlaying,
      answer_true: answerTrue,
      answer_false: answerFalse,
      desc_answer_true: descAnswerTrue,
      desc_answer_false: descAnswerFalse,
      all_question: allQuestion,
      coin,
      death
    } = req.body || {};

    const [result] = await pool.query(
      `INSERT INTO history
        (time_playing, answer_true, answer_false, desc_answer_true,
         desc_answer_false, all_question, coin, death)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        timePlaying || '00:00:00',
        Math.max(0, Number(answerTrue) || 0),
        Math.max(0, Number(answerFalse) || 0),
        typeof descAnswerTrue === 'string' ? descAnswerTrue : '',
        typeof descAnswerFalse === 'string' ? descAnswerFalse : '',
        Math.max(0, Number(allQuestion) || 0),
        Math.max(0, Number(coin) || 0),
        Math.max(0, Number(death) || 0)
      ]
    );

    res.status(201).json({ success: true, id_history: result.insertId });
  } catch (error) {
    console.error('Error saving game history:', error);
    res.status(500).json({ message: 'Gagal menyimpan history game.' });
  }
});

router.get('/', requirePermission('players:read_all'), async (req, res) => {
  try {
    const snapshot = await firebaseDatabase.ref('players').once('value');
    res.json(snapshot.val() || {});
  } catch (error) {
    console.error('Error getting players:', error);
    res.status(500).json({ message: 'Gagal mengambil data player.' });
  }
});

router.get('/coins', requirePermission('coins:read'), async (req, res) => {
  try {
    const snapshot = await firebaseDatabase.ref('coins').once('value');
    res.json(snapshot.val() || {});
  } catch (error) {
    console.error('Error getting coins:', error);
    res.status(500).json({ message: 'Gagal mengambil data coin.' });
  }
});

router.put('/coins/:coinId', requirePermission('coins:manage'), async (req, res) => {
  try {
    await firebaseDatabase.ref(`coins/${req.params.coinId}`).set(req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    console.error('Error creating coin:', error);
    res.status(500).json({ message: 'Gagal membuat coin.' });
  }
});

router.delete('/coins/:coinId', requirePermission('coins:manage'), async (req, res) => {
  try {
    await firebaseDatabase.ref(`coins/${req.params.coinId}`).remove();
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing coin:', error);
    res.status(500).json({ message: 'Gagal menghapus coin.' });
  }
});

router.get('/answers/:playerId', requireSelfOr('answers:read_any'), async (req, res) => {
  try {
    const snapshot = await firebaseDatabase
      .ref(`answers/${req.params.playerId}`)
      .once('value');
    res.json(snapshot.val() || {});
  } catch (error) {
    console.error('Error getting answers:', error);
    res.status(500).json({ message: 'Gagal mengambil jawaban.' });
  }
});

router.post('/answers/:playerId', requireSelfOr('players:write_any'), async (req, res) => {
  try {
    const answer = await firebaseDatabase
      .ref(`answers/${req.params.playerId}`)
      .push(req.body);
    res.status(201).json({ success: true, id: answer.key });
  } catch (error) {
    console.error('Error saving answer:', error);
    res.status(500).json({ message: 'Gagal menyimpan jawaban.' });
  }
});

router.put('/:playerId', requireSelfOr('players:write_any'), async (req, res) => {
  try {
    await firebaseDatabase.ref(`players/${req.params.playerId}`).set(req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ message: 'Gagal memperbarui data player.' });
  }
});

router.patch('/:playerId/status', requireSelfOr('players:write_any'), async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status player diperlukan.' });
    }

    await firebaseDatabase
      .ref(`players/${req.params.playerId}/status`)
      .set(status);

    res.json({ success: true, status });
  } catch (error) {
    console.error('Error updating player status:', error);
    res.status(500).json({ message: 'Gagal memperbarui status player.' });
  }
});

router.patch('/:playerId', requireSelfOr('players:write_any'), async (req, res) => {
  try {
    await firebaseDatabase.ref(`players/${req.params.playerId}`).update(req.body);
    res.json({ success: true, data: req.body });
  } catch (error) {
    console.error('Error patching player:', error);
    res.status(500).json({ message: 'Gagal memperbarui data player.' });
  }
});

router.get('/:playerId', requireSelfOr('players:read_all'), async (req, res) => {
  try {
    const snapshot = await firebaseDatabase
      .ref(`players/${req.params.playerId}`)
      .once('value');

    if (!snapshot.exists()) {
      return res.status(404).json({ message: 'Player tidak ditemukan.' });
    }

    res.json(snapshot.val());
  } catch (error) {
    console.error('Error getting player:', error);
    res.status(500).json({ message: 'Gagal mengambil data player.' });
  }
});

router.delete('/:playerId', requireSelfOr('players:write_any'), async (req, res) => {
  try {
    await firebaseDatabase.ref(`players/${req.params.playerId}`).remove();
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing player:', error);
    res.status(500).json({ message: 'Gagal menghapus player.' });
  }
});

module.exports = router;