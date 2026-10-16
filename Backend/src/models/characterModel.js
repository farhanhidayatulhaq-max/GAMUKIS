const { pool } = require('../config/Database/MySQL/connection');

const MAX_CHARACTERS_PER_USER = Number(process.env.MAX_CHARACTERS_PER_USER) || 5;

const toCharacter = (row) => row && {
  id: row.id,
  name: row.name,
  data: typeof row.data === 'string' ? JSON.parse(row.data) : (row.data || {}),
  isActive: Boolean(row.is_active),
  createdAt: row.created_at,
  updatedAt: row.updated_at
};

class CharacterModel {
  static async list(ownerKey) {
    const [rows] = await pool.query(
      'SELECT * FROM characters WHERE owner_key = ? ORDER BY created_at ASC',
      [ownerKey]
    );
    return rows.map(toCharacter);
  }

  static async findOne(ownerKey, id) {
    const [rows] = await pool.query(
      'SELECT * FROM characters WHERE id = ? AND owner_key = ? LIMIT 1',
      [id, ownerKey]
    );
    return toCharacter(rows[0]) || null;
  }

  static async count(ownerKey) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM characters WHERE owner_key = ?',
      [ownerKey]
    );
    return rows[0].total;
  }

  static async create(account, { name, data }) {
    const [result] = await pool.query(
      `INSERT INTO characters (owner_key, auth_type, owner_id, email, name, data, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [account.ownerKey, account.authType, account.userId, account.email,
        name, JSON.stringify(data || {}), (await this.count(account.ownerKey)) === 0 ? 1 : 0]
    );
    return this.findOne(account.ownerKey, result.insertId);
  }

  static async update(ownerKey, id, { name, data }) {
    const [result] = await pool.query(
      `UPDATE characters
          SET name = COALESCE(?, name), data = COALESCE(?, data)
        WHERE id = ? AND owner_key = ?`,
      [name ?? null, data === undefined ? null : JSON.stringify(data), id, ownerKey]
    );
    return result.affectedRows > 0 ? this.findOne(ownerKey, id) : null;
  }

  static async setActive(ownerKey, id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [found] = await connection.query(
        'SELECT id FROM characters WHERE id = ? AND owner_key = ? FOR UPDATE',
        [id, ownerKey]
      );
      if (found.length === 0) {
        await connection.rollback();
        return null;
      }
      await connection.query('UPDATE characters SET is_active = 0 WHERE owner_key = ?', [ownerKey]);
      await connection.query('UPDATE characters SET is_active = 1 WHERE id = ?', [id]);
      await connection.commit();
      return this.findOne(ownerKey, id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  static async remove(ownerKey, id) {
    const [result] = await pool.query(
      'DELETE FROM characters WHERE id = ? AND owner_key = ?',
      [id, ownerKey]
    );
    return result.affectedRows > 0;
  }
}

module.exports = CharacterModel;
module.exports.MAX_CHARACTERS_PER_USER = MAX_CHARACTERS_PER_USER;
