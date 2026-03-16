import pool from '../config/database.js';

const Category = {
  // Get all categories with pagination
  async findAll(page = 1, limit = 10) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    const [countResult] = await pool.query('SELECT COUNT(*) as total FROM categories');
    const total = countResult[0].total;

    const [rows] = await pool.query(`
      SELECT c.*, 
             p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?
    `, [limitNum, offset]);

    return {
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  },

  // Get category by ID
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT c.*, p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id
      WHERE c.id = ?
    `, [id]);
    return rows[0];
  },

  // Get category by code
  async findByCode(code) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE code = ?', [code]);
    return rows[0];
  },

  // Create new category
  async create(categoryData) {
    const { name, code, parent_id, description, depreciation_rate } = categoryData;
    
    const [result] = await pool.query(
      'INSERT INTO categories (name, code, parent_id, description, depreciation_rate) VALUES (?, ?, ?, ?, ?)',
      [name, code, parent_id || null, description || null, depreciation_rate || 0]
    );
    return this.findById(result.insertId);
  },

  // Update category
  async update(id, categoryData) {
    const { name, code, parent_id, description, depreciation_rate } = categoryData;
    
    await pool.query(
      'UPDATE categories SET name = ?, code = ?, parent_id = ?, description = ?, depreciation_rate = ? WHERE id = ?',
      [name, code, parent_id || null, description || null, depreciation_rate || 0, id]
    );
    return this.findById(id);
  },

  // Delete category
  async delete(id) {
    const [result] = await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Get subcategories
  async findSubcategories(parentId) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE parent_id = ?', [parentId]);
    return rows;
  },

  // Get all categories without pagination (for dropdowns)
  async findAllSimple() {
    const [rows] = await pool.query(`
      SELECT c.*, 
             p.name as parent_name 
      FROM categories c 
      LEFT JOIN categories p ON c.parent_id = p.id
      ORDER BY c.name ASC
    `);
    return rows;
  }
};

export default Category;
