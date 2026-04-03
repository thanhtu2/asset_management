import pool from '../config/database.js';

const Asset = {
  // Get all assets simple (for dropdowns) - no pagination
  async findAllSimple(currentUser = null) {
    let query = `
      SELECT a.id, a.asset_code, a.name, a.status,
             c.name as category_name,
             l.name as location_name,
             d.name as department_name
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE 1=1
    `;
    const params = [];

    // Phân quyền dữ liệu theo role của user
    if (currentUser) {
      const { id, role, department_id } = currentUser;
      if (role === 'user') {
        query += ' AND a.assigned_to = ?';
        params.push(id);
      } else if (role === 'department-manager') {
        if (department_id) {
          query += ' AND a.department_id = ?';
          params.push(department_id);
        } else {
          query += ' AND 1 = 0'; // Lãnh đạo phòng nhưng chưa được gán phòng ban
        }
      }
    }

    query += ' ORDER BY a.name ASC';
    const [rows] = await pool.query(query, params);
    return rows;
  },

  // Get all assets with optional filters and pagination
  async findAll(filters = {}, page = 1, limit = 10) {
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const offset = (pageNum - 1) * limitNum;

    let query = `
      SELECT a.*, 
             c.name as category_name,
             l.name as location_name,
             d.name as department_name,
             c.depreciation_rate as depreciation_rate,
             s.name as supplier_name,
             u.fullName as user_full_name
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN suppliers s ON a.supplier_id = s.id
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE 1=1
    `;
    let countQuery = `
      SELECT COUNT(*) as total 
      FROM assets a 
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE 1=1
    `;
    const params = [];
    const countParams = [];

    if (filters.search) {
      query += ' AND (a.name LIKE ? OR a.asset_code LIKE ? OR a.barcode LIKE ? OR u.fullName LIKE ? OR a.assigned_to_name LIKE ?)';
      countQuery += ' AND (a.name LIKE ? OR a.asset_code LIKE ? OR a.barcode LIKE ? OR u.fullName LIKE ? OR a.assigned_to_name LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
      countParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (filters.category_id) {
      query += ' AND a.category_id = ?';
      countQuery += ' AND a.category_id = ?';
      params.push(filters.category_id);
      countParams.push(filters.category_id);
    }
    if (filters.assigned_to) {
      query += ' AND (u.fullName LIKE ? OR a.assigned_to_name LIKE ?)';
      countQuery += ' AND (u.fullName LIKE ? OR a.assigned_to_name LIKE ?)';
      const userTerm = `%${filters.assigned_to}%`;
      params.push(userTerm, userTerm);
      countParams.push(userTerm, userTerm);
    }
    if (filters.location_id) {
      query += ' AND a.location_id = ?';
      countQuery += ' AND a.location_id = ?';
      params.push(filters.location_id);
      countParams.push(filters.location_id);
    }
    if (filters.department_id) {
      query += ' AND a.department_id = ?';
      countQuery += ' AND a.department_id = ?';
      params.push(filters.department_id);
      countParams.push(filters.department_id);
    }
    if (filters.status) {
      query += ' AND a.status = ?';
      countQuery += ' AND a.status = ?';
      params.push(filters.status);
      countParams.push(filters.status);
    }

    // Phân quyền dữ liệu theo role của user
    if (filters.currentUser) {
      const { id, role, department_id } = filters.currentUser;
      if (role === 'user') {
        query += ' AND a.assigned_to = ?';
        countQuery += ' AND a.assigned_to = ?';
        params.push(id);
        countParams.push(id);
      } else if (role === 'department-manager') {
        if (department_id) {
          query += ' AND a.department_id = ?';
          countQuery += ' AND a.department_id = ?';
          params.push(department_id);
          countParams.push(department_id);
        } else {
          query += ' AND 1 = 0';
          countQuery += ' AND 1 = 0';
        }
      }
    }

    // Get total count
    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    // Add pagination - use string interpolation for LIMIT/OFFSET
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limitNum, offset);

    const [rows] = await pool.query(query, params);

    // Map user_full_name to assigned_to_name for frontend compatibility
    const mappedRows = rows.map(asset => {
      if (asset.user_full_name) {
        asset.assigned_to_name = asset.user_full_name;
      }
      return asset;
    });

    return {
      data: mappedRows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  },

  // Get asset by ID
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT a.*, 
             c.name as category_name,
             l.name as location_name,
             d.name as department_name,
             s.name as supplier_name,
             u.fullName as user_full_name
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN suppliers s ON a.supplier_id = s.id
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.id = ?
    `, [id]);
    
    const asset = rows[0];
    // Map user_full_name to assigned_to_name for frontend compatibility
    if (asset && asset.user_full_name) {
      asset.assigned_to_name = asset.user_full_name;
    }
    return asset;
  },

  // Get asset by code
  async findByCode(code) {
    const [rows] = await pool.query(`
      SELECT a.*, 
             c.name as category_name,
             l.name as location_name,
             d.name as department_name,
             s.name as supplier_name,
             u.fullName as user_full_name
      FROM assets a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN locations l ON a.location_id = l.id
      LEFT JOIN departments d ON a.department_id = d.id
      LEFT JOIN suppliers s ON a.supplier_id = s.id
      LEFT JOIN users u ON a.assigned_to = u.id
      WHERE a.asset_code = ?
    `, [code]);
    const asset = rows[0];
    // Map user_full_name to assigned_to_name for frontend compatibility
    if (asset && asset.user_full_name) {
      asset.assigned_to_name = asset.user_full_name;
    }
    return asset;
  },

  // Get asset by barcode
  async findByBarcode(barcode) {
    const [rows] = await pool.query('SELECT * FROM assets WHERE barcode = ?', [barcode]);
    return rows[0];
  },

  // Create new asset
  async create(assetData) {
    const {
      asset_code, name, description, category_id, location_id, department_id,
      supplier_id, purchase_date, purchase_price, current_value, status, barcode, image_url,
      assigned_to_name
    } = assetData;

    const [result] = await pool.query(
      `INSERT INTO assets (asset_code, name, description, category_id, location_id, department_id,
        supplier_id, purchase_date, purchase_price, current_value, status, barcode, image_url, assigned_to_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [asset_code, name, description, category_id, location_id, department_id,
        supplier_id, purchase_date, purchase_price, current_value || purchase_price, status || 'new', 
        barcode, image_url, assigned_to_name || null]
    );
    return this.findById(result.insertId);
  },

  // Update asset
  async update(id, assetData) {
    const { 
      asset_code, 
      name, 
      description, 
      category_id, 
      location_id, 
      department_id, 
      supplier_id, 
      purchase_date, 
      purchase_price, 
      current_value, 
      status,
      barcode,
      image_url,
      assigned_to_name
    } = assetData;

    // Get existing asset to preserve values
    const existing = await this.findById(id);
    if (!existing) return null;

    // Use provided values or fall back to existing
    await pool.query(
      `UPDATE assets SET asset_code=?, name=?, description=?, category_id=?, location_id=?,
        department_id=?, supplier_id=?, purchase_date=?, purchase_price=?, current_value=?,
        status=?, barcode=?, image_url=?, assigned_to_name=? WHERE id=?`,
      [
        asset_code || existing.asset_code, 
        name || existing.name, 
        description || existing.description, 
        category_id || existing.category_id, 
        location_id || existing.location_id, 
        department_id || existing.department_id, 
        supplier_id || existing.supplier_id, 
        purchase_date || existing.purchase_date, 
        purchase_price || existing.purchase_price, 
        current_value || existing.current_value, 
        status || existing.status, 
        barcode || existing.barcode, 
        image_url || existing.image_url, 
        assigned_to_name || existing.assigned_to_name, 
        id
      ]
    );
    return this.findById(id);
  },

  // Delete asset
  async delete(id) {
    const [result] = await pool.query('DELETE FROM assets WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Get asset statistics
  async getStats() {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_assets,
        SUM(current_value) as total_value,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_count,
        SUM(CASE WHEN status = 'good' THEN 1 ELSE 0 END) as good_count,
        SUM(CASE WHEN status = 'needs_repair' THEN 1 ELSE 0 END) as needs_repair_count,
        SUM(CASE WHEN status = 'disposed' THEN 1 ELSE 0 END) as disposed_count
      FROM assets
    `);
    return rows[0];
  }
};

export default Asset;
