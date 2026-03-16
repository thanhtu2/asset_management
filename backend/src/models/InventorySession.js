import pool from '../config/database.js';

const InventorySession = {
  // Get all inventory sessions
  async findAll() {
    const [rows] = await pool.query(`
      SELECT i.*, u.fullName as created_by_name, d.name as department_name
      FROM inventory_sessions i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN departments d ON i.department_id = d.id
      ORDER BY i.created_at DESC
    `);
    return rows;
  },

  // Get inventory session by ID
  async findById(id) {
    const [rows] = await pool.query(`
      SELECT i.*, u.fullName as created_by_name, d.name as department_name
      FROM inventory_sessions i
      LEFT JOIN users u ON i.created_by = u.id
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE i.id = ?
    `, [id]);
    return rows[0];
  },

  // Create inventory session and populate with assets from the specified department
  async create(data, userId) {
    const { name, start_date, end_date, department_id } = data;

    if (!department_id) {
        throw new Error('Department ID is required to create an inventory session.');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
        // 1. Create the session
        const [result] = await connection.query(
            'INSERT INTO inventory_sessions (name, start_date, end_date, created_by, department_id, status) VALUES (?, ?, ?, ?, ?, ?)',
            [name, start_date, end_date || null, userId, department_id, 'in_progress']
        );
        const sessionId = result.insertId;

        // 2. "Chốt sổ sách": Get assets based on department
        const [assets] = await connection.query('SELECT id FROM assets WHERE department_id = ?', [department_id]);

        // 3. Populate inventory_records
        if (assets.length > 0) {
            const assetIds = assets.map(a => a.id);
            const recordsData = assetIds.map(id => [sessionId, id, 0]);
            
            await connection.query(
                'INSERT INTO inventory_records (session_id, asset_id, actual_quantity) VALUES ?',
                [recordsData]
            );
        }

        await connection.commit();
        connection.release();

        return this.findById(sessionId);

    } catch (error) {
        await connection.rollback();
        connection.release();
        console.error("Error creating inventory session:", error);
        throw error;
    }
  },

  // Update inventory session
  async update(id, data) {
    const { name, start_date, end_date, status, department_id } = data;
    
    await pool.query(
      'UPDATE inventory_sessions SET name=?, start_date=?, end_date=?, status=?, department_id=? WHERE id=?',
      [name, start_date, end_date, status, department_id || null, id]
    );
    return this.findById(id);
  },

  // Delete inventory session
  async delete(id) {
    const [result] = await pool.query('DELETE FROM inventory_sessions WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  // Add assets to inventory session
  async addAssets(sessionId, assetIds) {
    for (const assetId of assetIds) {
      await pool.query(
        'INSERT INTO inventory_records (session_id, asset_id, actual_quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE session_id=session_id',
        [sessionId, assetId]
      );
    }
    return true;
  },

  // Get inventory records for a session
  async getRecords(sessionId) {
    const [rows] = await pool.query(`
      SELECT ir.*, a.asset_code, a.name as asset_name
      FROM inventory_records ir
      LEFT JOIN assets a ON ir.asset_id = a.id
      WHERE ir.session_id = ?
    `, [sessionId]);
    return rows;
  },

  // Update inventory record
  async updateRecord(sessionId, recordId, data) {
    const { status, actual_quantity, notes, checked_by } = data;
    
    await pool.query(
      'UPDATE inventory_records SET status=?, actual_quantity=?, notes=?, checked_by=?, checked_at=NOW() WHERE id=? AND session_id=?',
      [status, actual_quantity, notes, checked_by, recordId, sessionId]
    );
    return true;
  },

  // Get inventory summary
  async getSummary(sessionId) {
    const [rows] = await pool.query(`
      SELECT 
        COUNT(*) as total_expected,
        SUM(CASE WHEN status = 'found' THEN 1 ELSE 0 END) as found,
        SUM(CASE WHEN status = 'missing' THEN 1 ELSE 0 END) as missing,
        SUM(CASE WHEN status = 'extra' THEN 1 ELSE 0 END) as extra,
        SUM(CASE WHEN status = 'found_wrong_location' THEN 1 ELSE 0 END) as found_wrong_location
      FROM inventory_records
      WHERE session_id = ?
    `, [sessionId]);
    return rows[0];
  },

  // Complete inventory session
  async complete(sessionId) {
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Mark all non-scanned assets as 'missing'
      await connection.query(
        "UPDATE inventory_records SET status = 'missing' WHERE session_id = ? AND checked_at IS NULL",
        [sessionId]
      );

      // 2. Update the session status to 'completed'
      await connection.query(
        "UPDATE inventory_sessions SET status = 'completed', end_date = CURDATE() WHERE id = ?",
        [sessionId]
      );

      await connection.commit();
      connection.release();

      // 3. Return the final summary
      return this.getSummary(sessionId);

    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error completing inventory session:", error);
      throw error;
    }
  },

  // Add assets by department
  async addAssetsByDepartment(sessionId, departmentId) {
    const [assets] = await pool.query(
      'SELECT id FROM assets WHERE department_id = ?',
      [departmentId]
    );
    
    if (assets.length === 0) {
      return { added: 0, message: 'No assets found for this department' };
    }

    const assetIds = assets.map(a => a.id);
    for (const assetId of assetIds) {
      await pool.query(
        'INSERT INTO inventory_records (session_id, asset_id, actual_quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE session_id=session_id',
        [sessionId, assetId]
      );
    }
    return { added: assetIds.length, message: `Added ${assetIds.length} assets` };
  },

  // Add all assets to inventory session
  async addAllAssets(sessionId) {
    const [assets] = await pool.query('SELECT id FROM assets');
    
    if (assets.length === 0) {
      return { added: 0, message: 'No assets found' };
    }

    const assetIds = assets.map(a => a.id);
    for (const assetId of assetIds) {
      await pool.query(
        'INSERT INTO inventory_records (session_id, asset_id, actual_quantity) VALUES (?, ?, 0) ON DUPLICATE KEY UPDATE session_id=session_id',
        [sessionId, assetId]
      );
    }
    return { added: assetIds.length, message: `Added ${assetIds.length} assets` };
  },

  // Get inventory records with department info
  async getRecordsWithDepartment(sessionId) {
    const [rows] = await pool.query(`
      SELECT ir.*, a.asset_code, a.name as asset_name, a.department_id,
             d.name as department_name
      FROM inventory_records ir
      LEFT JOIN assets a ON ir.asset_id = a.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE ir.session_id = ?
      ORDER BY d.name, a.asset_code
    `, [sessionId]);
    return rows;
  },

  // Get inventory summary by department
  async getSummaryByDepartment(sessionId) {
    const [rows] = await pool.query(`
      SELECT 
        a.department_id,
        d.name as department_name,
        SUM(CASE WHEN ir.status IN ('found', 'missing', 'damaged', 'pending_check', 'found_wrong_location') THEN 1 ELSE 0 END) as total,
        SUM(CASE WHEN ir.status = 'found' OR ir.status = 'found_wrong_location' THEN 1 ELSE 0 END) as found_count,
        SUM(CASE WHEN ir.status = 'missing' THEN 1 ELSE 0 END) as missing_count,
        SUM(CASE WHEN ir.status = 'damaged' THEN 1 ELSE 0 END) as damaged_count,
        SUM(CASE WHEN ir.status = 'extra' THEN 1 ELSE 0 END) as extra_count
      FROM inventory_records ir
      LEFT JOIN assets a ON ir.asset_id = a.id
      LEFT JOIN departments d ON a.department_id = d.id
      WHERE ir.session_id = ?
      GROUP BY a.department_id, d.name
      ORDER BY d.name
    `, [sessionId]);
    return rows;
  },

  // Handle asset scan during an inventory session
  async handleScan(sessionId, scanData, userId) {
    const { barcode, notes } = scanData;

    if (!barcode) {
      throw new Error('Barcode is required.');
    }

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // 1. Find asset by barcode OR ID for flexibility
      const [assets] = await connection.query('SELECT * FROM assets WHERE barcode = ? OR id = ?', [barcode, barcode]);
      if (assets.length === 0) {
        throw new Error(`Asset with identifier '${barcode}' not found.`);
      }
      const asset = assets[0];

      // 2. Find inventory session to get its scope (department_id)
      const [sessions] = await connection.query('SELECT * FROM inventory_sessions WHERE id = ?', [sessionId]);
      if (sessions.length === 0) {
        throw new Error(`Inventory session with ID ${sessionId} not found.`);
      }
      const session = sessions[0];

      // 3. Check if a record for this asset already exists in this session
      const [existingRecords] = await connection.query(
        'SELECT * FROM inventory_records WHERE session_id = ? AND asset_id = ?',
        [sessionId, asset.id]
      );

      let recordStatus;
      let message;

      if (existingRecords.length > 0) {
        // Asset was expected
        const record = existingRecords[0];
        recordStatus = asset.department_id === session.department_id ? 'found' : 'found_wrong_location';
        message = `Đã ghi nhận '${asset.name}'. Trạng thái: ${recordStatus === 'found' ? 'Đúng vị trí' : 'Sai vị trí'}.`;

        await connection.query(
          `UPDATE inventory_records SET status = ?, actual_quantity = 1, notes = ?,
           checked_by = ?, checked_at = NOW() WHERE id = ?`,
          [recordStatus, notes || record.notes, userId, record.id]
        );

      } else {
        // Asset was not expected in this session's initial list.
        if (asset.department_id === session.department_id) {
          // It's an extra asset from the correct department.
          recordStatus = 'extra';
          message = `Tài sản '${asset.name}' không có trong danh sách nhưng thuộc phòng này (ghi nhận là Thừa).`;
        } else {
          // It's an asset from a completely different department.
          recordStatus = 'found_wrong_location';
          // We need the asset's actual department name for a better message.
          const [assetDepts] = await connection.query('SELECT name FROM departments WHERE id = ?', [asset.department_id]);
          const assetDeptName = assetDepts.length > 0 ? assetDepts[0].name : 'không xác định';
          message = `Cảnh báo: Tài sản '${asset.name}' thuộc về phòng '${assetDeptName}', không thuộc phiên kiểm kê này. Đã ghi nhận là 'Sai vị trí'.`;
        }
        
        await connection.query(
          `INSERT INTO inventory_records (session_id, asset_id, status, actual_quantity, notes,
           checked_by, checked_at) VALUES (?, ?, ?, 1, ?, ?, NOW())`,
          [sessionId, asset.id, recordStatus, notes, userId]
        );
      }
      
      await connection.commit();
      connection.release();

      return { success: true, message, details: { assetName: asset.name, status: recordStatus } };

    } catch (error) {
      await connection.rollback();
      connection.release();
      console.error("Error handling scan:", error);
      throw error;
    }
  }
};

export default InventorySession;
