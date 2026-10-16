const { pool } = require('../config/Database/MySQL/connection');
const { ROLES } = require('../config/permissions');
const { createHash } = require('node:crypto');

const DEFAULT_MAX_CHARACTERS = Number(process.env.MAX_CHARACTERS_PER_USER) || 5;
const parseJson = (v) => (typeof v === 'string' ? JSON.parse(v) : (v || {}));

const toPlan = (row) => row && {
  id: row.id,
  code: row.code,
  name: row.name,
  audience: row.audience,
  price: row.price,
  durationDays: row.duration_days,
  features: parseJson(row.features),
  isActive: Boolean(row.is_active)
};

class MembershipModel {
  // ---------- Paket ----------
  static async listPlans({ audience, includeInactive = false } = {}) {
    const where = [];
    const params = [];
    if (audience) { where.push('audience = ?'); params.push(audience); }
    if (!includeInactive) where.push('is_active = 1');
    const [rows] = await pool.query(
      `SELECT * FROM membership_plans ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY audience, price`,
      params
    );
    return rows.map(toPlan);
  }

  static async findPlanByCode(code) {
    const [rows] = await pool.query('SELECT * FROM membership_plans WHERE code = ? LIMIT 1', [code]);
    return toPlan(rows[0]) || null;
  }

  static async createPlan({ code, name, audience, price, durationDays, features }) {
    const [result] = await pool.query(
      `INSERT INTO membership_plans (code, name, audience, price, duration_days, features)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, audience, price, durationDays, JSON.stringify(features || {})]
    );
    const [rows] = await pool.query('SELECT * FROM membership_plans WHERE id = ?', [result.insertId]);
    return toPlan(rows[0]);
  }

  static async updatePlan(id, { name, price, durationDays, features, isActive }) {
    const assignments = [];
    const params = [];
    if (name !== undefined) { assignments.push('name = ?'); params.push(name); }
    if (price !== undefined) { assignments.push('price = ?'); params.push(price); }
    if (durationDays !== undefined) { assignments.push('duration_days = ?'); params.push(durationDays); }
    if (features !== undefined) { assignments.push('features = ?'); params.push(JSON.stringify(features)); }
    if (isActive !== undefined) { assignments.push('is_active = ?'); params.push(isActive ? 1 : 0); }
    if (assignments.length === 0) return this.findPlanById(id);
    params.push(id);
    await pool.query(
      `UPDATE membership_plans SET ${assignments.join(', ')} WHERE id = ?`, params
    );
    return this.findPlanById(id);
  }

  static async findPlanById(id) {
    const [rows] = await pool.query('SELECT * FROM membership_plans WHERE id = ? LIMIT 1', [id]);
    return toPlan(rows[0]) || null;
  }

  // ---------- Langganan ----------
  static async getActive(ownerKey) {
    const [rows] = await pool.query(
      `SELECT m.id AS membership_id, m.status, m.started_at, m.expires_at, p.*
         FROM memberships m JOIN membership_plans p ON p.id = m.plan_id
        WHERE m.owner_key = ? AND m.status = 'active'
          AND (m.expires_at IS NULL OR m.expires_at > NOW())
        ORDER BY m.id DESC LIMIT 1`,
      [ownerKey]
    );
    if (!rows[0]) return null;
    return { membershipId: rows[0].membership_id, status: rows[0].status, startedAt: rows[0].started_at, expiresAt: rows[0].expires_at, plan: toPlan(rows[0]) };
  }

  static async getPending(ownerKey) {
    const [rows] = await pool.query(
      `SELECT m.id AS membership_id, m.created_at, p.* FROM memberships m JOIN membership_plans p ON p.id = m.plan_id
        WHERE m.owner_key = ? AND m.status = 'pending' ORDER BY m.id DESC LIMIT 1`,
      [ownerKey]
    );
    return rows[0] ? { membershipId: rows[0].membership_id, createdAt: rows[0].created_at, plan: toPlan(rows[0]) } : null;
  }

  static async setPendingPaymentRef(membershipId, orderId) {
    const [result] = await pool.query(
      "UPDATE memberships SET payment_ref = ? WHERE id = ? AND status = 'pending'",
      [orderId, membershipId]
    );
    return result.affectedRows > 0;
  }

  static async getMembershipByPaymentRef(orderId) {
    const [rows] = await pool.query(
      `SELECT m.id AS membership_id, m.owner_key, m.status, p.price
         FROM memberships m JOIN membership_plans p ON p.id = m.plan_id
        WHERE m.payment_ref = ? LIMIT 1`,
      [orderId]
    );
    return rows[0] ? {
      membershipId: rows[0].membership_id,
      ownerKey: rows[0].owner_key,
      status: rows[0].status,
      price: Number(rows[0].price)
    } : null;
  }

  static async getPendingByPaymentRef(orderId) {
    const membership = await this.getMembershipByPaymentRef(orderId);
    return membership?.status === 'pending' ? membership : null;
  }

  static async cancelPendingByPaymentRef(orderId) {
    const [result] = await pool.query(
      "UPDATE memberships SET status = 'cancelled' WHERE payment_ref = ? AND status = 'pending'",
      [orderId]
    );
    return result.affectedRows > 0;
  }

  /**
   * Fitur efektif akun. Tanpa langganan aktif -> paket gratis `<role>_free`.
   * Administrator -> semua fitur terbuka.
   */
  static async getEffective(account) {
    if (account.role === ROLES.ADMIN) {
      return { plan: null, source: 'administrator', features: { unlimited: true, maxCharacters: 50 }, expiresAt: null };
    }
    const active = await this.getActive(account.ownerKey);
    if (active) {
      return { plan: active.plan, source: 'membership', features: active.plan.features, expiresAt: active.expiresAt };
    }
    const free = await this.findPlanByCode(`${account.role}_free`);
    return { plan: free, source: 'default', features: free?.features || { maxCharacters: DEFAULT_MAX_CHARACTERS }, expiresAt: null };
  }

  static async hasFeature(account, feature) {
    const { features } = await this.getEffective(account);
    return Boolean(features.unlimited || features[feature]);
  }

  // Langganan baru. Paket gratis aktif langsung; berbayar -> pending sampai pembayaran dikonfirmasi.
  static async subscribe(account, plan, { grantedBy = null } = {}) {
    const connection = await pool.getConnection();
    // A transaction alone cannot lock a missing pending-membership row. A MySQL
    // advisory lock serializes subscriptions for this owner, including the first.
    const lockName = `membership:${createHash('sha256').update(account.ownerKey).digest('hex').slice(0, 48)}`;
    let lockAcquired = false;
    try {
      const [lockRows] = await connection.query('SELECT GET_LOCK(?, 10) AS acquired', [lockName]);
      if (Number(lockRows?.[0]?.acquired) !== 1) {
        const error = new Error('Membership subscription is busy; retry shortly.');
        error.code = 'MEMBERSHIP_LOCK_TIMEOUT';
        throw error;
      }
      lockAcquired = true;
      await connection.beginTransaction();
      await connection.query(
        "UPDATE memberships SET status = 'cancelled' WHERE owner_key = ? AND status = 'pending'",
        [account.ownerKey]
      );
      let status = 'pending';
      if (plan.price === 0) {
        await connection.query(
          "UPDATE memberships SET status = 'cancelled' WHERE owner_key = ? AND status = 'active'",
          [account.ownerKey]
        );
        status = 'active';
      }
      const [result] = await connection.query(
        `INSERT INTO memberships (owner_key, auth_type, owner_id, plan_id, status, started_at, expires_at, granted_by)
         VALUES (?, ?, ?, ?, ?, ${status === 'active' ? 'NOW()' : 'NULL'},
                 ${status === 'active' && plan.durationDays ? 'DATE_ADD(NOW(), INTERVAL ? DAY)' : 'NULL'}, ?)`,
        [account.ownerKey, account.authType, account.userId, plan.id, status,
          ...(status === 'active' && plan.durationDays ? [plan.durationDays] : []), grantedBy]
      );
      await connection.commit();
      return { membershipId: result.insertId, status };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      if (lockAcquired) {
        try { await connection.query('SELECT RELEASE_LOCK(?)', [lockName]); }
        catch (error) { console.error('Membership lock release error:', error); }
      }
      connection.release();
    }
  }

  // Aktivasi (dipanggil setelah pembayaran sukses atau pemberian manual oleh admin).
  static async activate(membershipId, { paymentRef = null } = {}) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        `SELECT m.owner_key, p.duration_days FROM memberships m
           JOIN membership_plans p ON p.id = m.plan_id
          WHERE m.id = ? AND m.status = 'pending' FOR UPDATE`,
        [membershipId]
      );
      if (!rows[0]) { await connection.rollback(); return false; }
      await connection.query(
        "UPDATE memberships SET status = 'cancelled' WHERE owner_key = ? AND status = 'active'",
        [rows[0].owner_key]
      );
      await connection.query(
        `UPDATE memberships SET status = 'active', started_at = NOW(), payment_ref = ?,
                expires_at = ${rows[0].duration_days ? 'DATE_ADD(NOW(), INTERVAL ? DAY)' : 'NULL'}
          WHERE id = ?`,
        [paymentRef, ...(rows[0].duration_days ? [rows[0].duration_days] : []), membershipId]
      );
      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  // Batalkan langganan aktif/pending milik owner (kembali ke paket gratis).
  static async cancel(ownerKey) {
    const [result] = await pool.query(
      "UPDATE memberships SET status = 'cancelled' WHERE owner_key = ? AND status IN ('active', 'pending')",
      [ownerKey]
    );
    return result.affectedRows;
  }

  static async cancelPending(membershipId) {
    const [result] = await pool.query(
      "UPDATE memberships SET status = 'cancelled' WHERE id = ? AND status = 'pending'",
      [membershipId]
    );
    return result.affectedRows > 0;
  }

  static async history(ownerKey) {
    const [rows] = await pool.query(
      `SELECT m.id, m.status, m.started_at, m.expires_at, m.payment_ref, m.created_at, p.code, p.name, p.price
         FROM memberships m JOIN membership_plans p ON p.id = m.plan_id
        WHERE m.owner_key = ? ORDER BY m.id DESC`,
      [ownerKey]
    );
    return rows;
  }
}

module.exports = MembershipModel;
module.exports.DEFAULT_MAX_CHARACTERS = DEFAULT_MAX_CHARACTERS;
