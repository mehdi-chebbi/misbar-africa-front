const bcrypt = require('bcryptjs');
const { query, queryOne, execute } = require('../config/database');

class User {
  // Find user by email
  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?';
    return await queryOne(sql, [email]);
  }

  // Find user by ID
  static async findById(id) {
    const sql = 'SELECT id, email, role, created_at, updated_at, is_active, last_login FROM users WHERE id = ?';
    return await queryOne(sql, [id]);
  }

  // Create new user
  static async create(userData) {
    const { email, password, role = 'user' } = userData;

    // Hash password
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const sql = `
      INSERT INTO users (email, password_hash, role, created_at, updated_at, is_active)
      VALUES (?, ?, ?, NOW(), NOW(), TRUE)
    `;

    const result = await execute(sql, [email, hashedPassword, role]);

    // Return created user without password
    return await this.findById(result.insertId);
  }

  // Verify password
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Update last login
  static async updateLastLogin(id) {
    const sql = 'UPDATE users SET last_login = NOW() WHERE id = ?';
    return await execute(sql, [id]);
  }

  // Update user
  static async update(id, userData) {
    const { email, role, is_active } = userData;
    const updates = [];
    const values = [];

    if (email !== undefined) {
      updates.push('email = ?');
      values.push(email);
    }

    if (role !== undefined) {
      updates.push('role = ?');
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    await execute(sql, values);

    return await this.findById(id);
  }

  // Soft delete user (deactivate)
  static async deactivate(id) {
    const sql = 'UPDATE users SET is_active = FALSE, updated_at = NOW() WHERE id = ?';
    return await execute(sql, [id]);
  }

  // Get all users with pagination
  static async getAll(page = 1, limit = 10, search = '', role = '') {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const values = [];

    // Add search filter
    if (search) {
      whereClause += ' AND email LIKE ?';
      values.push(`%${search}%`);
    }

    // Add role filter
    if (role) {
      whereClause += ' AND role = ?';
      values.push(role);
    }

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await queryOne(countSql, values);

    // Get users
    const sql = `
      SELECT id, email, role, created_at, updated_at, is_active, last_login
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    const users = await query(sql, [...values, limit, offset]);

    return {
      users,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }

  // Get user statistics
  static async getStats() {
    const sql = `
      SELECT
        COUNT(*) as totalUsers,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) as activeUsers,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 1 MONTH) THEN 1 END) as newUsersThisMonth,
        COUNT(CASE WHEN DATE(last_login) = CURDATE() THEN 1 END) as loginsToday
      FROM users
    `;

    return await queryOne(sql);
  }

  // Create user activity log
  static async logActivity(userId, action, details = null, ipAddress = null) {
    const sql = `
      INSERT INTO user_activity_logs (user_id, action, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, NOW())
    `;

    return await execute(sql, [userId, action, details, ipAddress]);
  }

  // Get user activity logs
  static async getActivityLogs(page = 1, limit = 50, userId = null, action = null) {
    const offset = (page - 1) * limit;
    let whereClause = 'WHERE 1=1';
    const values = [];

    if (userId) {
      whereClause += ' AND ual.user_id = ?';
      values.push(userId);
    }

    if (action) {
      whereClause += ' AND ual.action = ?';
      values.push(action);
    }

    // Get total count
    const countSql = `
      SELECT COUNT(*) as total
      FROM user_activity_logs ual
      ${whereClause}
    `;
    const countResult = await queryOne(countSql, values);

    // Get logs with user info
    const sql = `
      SELECT
        ual.id,
        ual.user_id,
        u.email,
        ual.action,
        ual.details,
        ual.ip_address,
        ual.created_at
      FROM user_activity_logs ual
      JOIN users u ON ual.user_id = u.id
      ${whereClause}
      ORDER BY ual.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const logs = await query(sql, [...values, limit, offset]);

    return {
      logs,
      total: countResult.total,
      page,
      limit,
      totalPages: Math.ceil(countResult.total / limit)
    };
  }
}

module.exports = User;