const { pool } = require('../config/Database/MySQL/connection');

const saveHistory = async ({
  timePlaying,
  answerTrue,
  answerFalse,
  descAnswerTrue,
  descAnswerFalse,
  allQuestion,
  coin,
  death
}) => {
  const [result] = await pool.query(
    `INSERT INTO history
      (time_playing, answer_true, answer_false, desc_answer_true,
       desc_answer_false, all_question, coin, death)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      timePlaying || '00:05:00',
      Math.max(0, Number(answerTrue) || 0),
      Math.max(0, Number(answerFalse) || 0),
      typeof descAnswerTrue === 'string' ? descAnswerTrue : '',
      typeof descAnswerFalse === 'string' ? descAnswerFalse : '',
      Math.max(0, Number(allQuestion) || 0),
      Math.max(0, Number(coin) || 0),
      Math.max(0, Number(death) || 0)
    ]
  );

  return result.insertId;
};

const listHistory = async () => {
  const [rows] = await pool.query(
    `SELECT id_history, time_playing, answer_true, answer_false,
            desc_answer_true, desc_answer_false, all_question, coin, death, created_at
     FROM history
     ORDER BY created_at DESC, id_history DESC`
  );
  return rows;
};

module.exports = { listHistory, saveHistory };
