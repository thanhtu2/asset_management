import pool from '../config/database.js';

const Changelog = {
  async findAll() {
    const [rows] = await pool.query(`
      SELECT id, version, release_date, title, type, description, created_at, updated_at
      FROM changelogs
      ORDER BY release_date DESC, id DESC
    `);
    return rows;
  },

  async create({ version, release_date, title, type, description, userId }) {
    const [result] = await pool.query(
      `INSERT INTO changelogs (version, release_date, title, type, description, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [version, release_date, title, type, description, userId]
    );
    return result.insertId;
  },

  async update(id, { version, release_date, title, type, description }) {
    const [result] = await pool.query(
      `UPDATE changelogs
       SET version = ?, release_date = ?, title = ?, type = ?, description = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [version, release_date, title, type, description, id]
    );
    return result.affectedRows;
  },

  async remove(id) {
    const [result] = await pool.query('DELETE FROM changelogs WHERE id = ?', [id]);
    return result.affectedRows;
  }
};

export default Changelog;
