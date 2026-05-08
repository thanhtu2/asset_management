-- Asset Management System Database Initialization Script

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS asset_management;
USE asset_management;

-- Drop tables if exists (for fresh install)
-- DROP TABLE IF EXISTS inventory_records;
-- DROP TABLE IF EXISTS inventory_sessions;
-- DROP TABLE IF EXISTS maintenance_records;
-- DROP TABLE IF EXISTS assets;
-- DROP TABLE IF EXISTS users;
-- DROP TABLE IF EXISTS departments;
-- DROP TABLE IF EXISTS suppliers;
-- DROP TABLE IF EXISTS locations;
-- DROP TABLE IF EXISTS categories;

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  parent_id INT NULL,
  description TEXT,
  depreciation_rate DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  address VARCHAR(255),
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES locations(id) ON DELETE SET NULL
);

-- Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  contact_person VARCHAR(100),
  phone VARCHAR(20),
  email VARCHAR(100),
  address VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Departments table
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  manager_id INT NULL,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  fullName VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  department_id INT NULL,
  isActive BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  category_id INT NULL,
  location_id INT NULL,
  department_id INT NULL,
  supplier_id INT NULL,
  purchase_date DATE,
  purchase_price DECIMAL(15,2) DEFAULT 0,
  current_value DECIMAL(15,2) DEFAULT 0,
  status ENUM('new', 'good', 'needs_repair', 'damaged', 'disposed') DEFAULT 'new',
  assigned_to INT NULL,
  assigned_to_name VARCHAR(100) NULL,
  assigned_date DATE,
  barcode VARCHAR(100),
  image_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
  FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- Bảng lưu lịch sử luân chuyển/bàn giao tài sản
CREATE TABLE IF NOT EXISTS asset_user_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  user_id INT NULL,
  department_id INT NULL,
  assigned_by INT NULL, -- Người thực hiện bàn giao
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NULL,
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Add assigned_to_name column if it doesn't exist (for existing databases)
-- ALTER TABLE assets ADD COLUMN assigned_to_name VARCHAR(100) NULL AFTER assigned_to;

-- Maintenance Records table
CREATE TABLE IF NOT EXISTS maintenance_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  maintenance_date DATE NOT NULL,
  maintenance_type ENUM('preventive', 'corrective', 'emergency') DEFAULT 'preventive',
  description TEXT,
  cost DECIMAL(15,2) DEFAULT 0,
  technician VARCHAR(100),
  next_maintenance_date DATE,
  status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
  completion_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- Inventory Sessions table
CREATE TABLE IF NOT EXISTS inventory_sessions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status ENUM('draft', 'in_progress', 'completed', 'cancelled') DEFAULT 'draft',
  department_id INT NULL,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- Inventory Records table
CREATE TABLE IF NOT EXISTS inventory_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  asset_id INT NOT NULL,
  -- Status of the asset within this inventory session
  -- pending_check: Initial state for assets on the books
  -- found: Scanned and in the correct location
  -- found_wrong_location: Scanned, but not in its assigned location
  -- extra: Scanned, but was not on the original list for this session
  -- missing: On the books, but not found during the scan (set at completion)
  status VARCHAR(30) DEFAULT 'pending_check' NOT NULL,
  notes TEXT,
  image_url VARCHAR(255), -- URL for damage photo
  actual_location_id INT NULL, -- Where it was actually found
  checked_by INT NULL,
  checked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES inventory_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (checked_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (actual_location_id) REFERENCES locations(id) ON DELETE SET NULL,
  UNIQUE KEY unique_session_asset (session_id, asset_id)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default categories
INSERT IGNORE INTO categories (name, code, description) VALUES
('Máy tính', 'COMPUTER', 'Máy tính để bàn và laptop'),
('Thiết bị văn phòng', 'OFFICE', 'Máy in, máy fax, điện thoại'),
('Đồ đạc', 'FURNITURE', 'Bàn, ghế, tủ'),
('Phương tiện', 'VEHICLE', 'Xe ô tô, xe máy'),
('Thiết bị điện tử', 'ELECTRONIC', 'TV, điều hòa, tủ lạnh');

-- Insert default locations
INSERT IGNORE INTO locations (name, code, address) VALUES
('Văn phòng chính', 'OFFICE1', '40 Võ Thị Sáu, phường Tân Định');

-- Insert default departments
INSERT IGNORE INTO departments (name, code) VALUES
('IT', 'IT');

-- Insert default suppliers
INSERT IGNORE INTO suppliers (name, code, contact_person, phone, email) VALUES
('Công ty TNHH ABC', 'SUP001', 'Nguyễn Văn A', '0901234567', 'abc@supplier.com');

-- NEW TABLES FOR PURCHASE PROPOSALS

-- Xóa các bảng phân quyền cũ để clear dữ liệu trùng lặp
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

-- Roles table
CREATE TABLE IF NOT EXISTS roles (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

-- Permissions table  
CREATE TABLE IF NOT EXISTS permissions (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(100)
);

-- Role-Permissions junction
CREATE TABLE IF NOT EXISTS role_permissions (
  role_code VARCHAR(50),
  permission_code VARCHAR(50),
  PRIMARY KEY (role_code, permission_code),
  FOREIGN KEY (role_code) REFERENCES roles(code),
  FOREIGN KEY (permission_code) REFERENCES permissions(code)
);

-- Purchase Proposals table
CREATE TABLE IF NOT EXISTS purchase_proposals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  requester_id INT NULL,
  department_id INT,
  status ENUM('draft', 'department_pending', 'director_pending', 'approved', 'rejected') DEFAULT 'draft',
  department_leader_id INT NULL,
  department_comment TEXT,
  director_id INT NULL,
  director_comment TEXT,
  total_amount DECIMAL(15,2) DEFAULT 0,
  items JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (department_leader_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (director_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NULL,
  action VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(50),
  old_values JSON NULL,
  new_values JSON NULL,
  description TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Seed default roles
INSERT IGNORE INTO roles (code, name, description) VALUES 
('admin', 'Quản trị viên', 'Toàn quyền hệ thống'),
('manager', 'Quản lý tài sản', 'Quản lý tài sản, kiểm kê, bảo trì'),
('user', 'Người dùng', 'Chỉ xem và sử dụng tài sản được cấp'),
('purchase-requester', 'Người đề xuất mua sắm', 'Người tạo phiếu đề xuất mua sắm'),
('department-leader', 'Lãnh đạo phòng', 'Trưởng phòng duyệt đề xuất của phòng'),
('director', 'Giám đốc', 'Giám đốc phê duyệt cuối cùng');

-- Seed default permissions
INSERT IGNORE INTO permissions (code, name, module) VALUES
('VIEW_DASHBOARD', 'Xem Dashboard', 'Hệ thống'),
('VIEW_REPORTS', 'Xem Báo cáo', 'Hệ thống'),
('VIEW_AUDIT_LOGS', 'Xem Nhật ký hệ thống', 'Hệ thống'),
('MANAGE_USERS', 'Quản lý người dùng', 'Hệ thống'),
('MANAGE_ROLES', 'Quản lý phân quyền', 'Hệ thống'),
('VIEW_ASSETS', 'Xem danh sách tài sản', 'Tài sản'),
('CREATE_ASSET', 'Thêm tài sản', 'Tài sản'),
('EDIT_ASSET', 'Sửa tài sản', 'Tài sản'),
('DELETE_ASSET', 'Xóa tài sản', 'Tài sản'),
('MANAGE_CATEGORIES', 'Quản lý danh mục', 'Danh mục'),
('MANAGE_LOCATIONS', 'Quản lý vị trí', 'Danh mục'),
('MANAGE_DEPARTMENTS', 'Quản lý phòng ban', 'Danh mục'),
('MANAGE_SUPPLIERS', 'Quản lý nhà cung cấp', 'Danh mục'),
('MANAGE_MAINTENANCE', 'Quản lý bảo trì', 'Bảo trì'),
('MANAGE_INVENTORY', 'Quản lý kiểm kê', 'Kiểm kê'),
('MANAGE_PURCHASE_PROPOSALS', 'Quản lý phiếu đề xuất mua sắm', 'Mua sắm'),
('CREATE_PURCHASE_PROPOSAL', 'Tạo phiếu đề xuất', 'Mua sắm'),
('VIEW_PURCHASE_PROPOSALS', 'Xem phiếu đề xuất', 'Mua sắm'),
('APPROVE_DEPARTMENT_PURCHASE', 'Duyệt phòng ban', 'Mua sắm'),
('APPROVE_DIRECTOR_PURCHASE', 'Giám đốc chấp nhận', 'Mua sắm');

-- Cấp toàn bộ quyền (Full permissions) cho Admin
INSERT IGNORE INTO role_permissions (role_code, permission_code)
SELECT 'admin', code FROM permissions;

-- Cấp quyền cơ bản cho Quản lý tài sản (Manager)
INSERT IGNORE INTO role_permissions (role_code, permission_code)
SELECT 'manager', code FROM permissions 
WHERE module IN ('Tài sản', 'Danh mục', 'Bảo trì', 'Kiểm kê')
OR code IN ('VIEW_DASHBOARD', 'VIEW_REPORTS');

-- Cấp quyền cho Lãnh đạo phòng (Department Leader)
INSERT IGNORE INTO role_permissions (role_code, permission_code)
VALUES 
('department-leader', 'VIEW_DASHBOARD'),
('department-leader', 'VIEW_ASSETS'),
('department-leader', 'VIEW_PURCHASE_PROPOSALS'),
('department-leader', 'CREATE_PURCHASE_PROPOSAL'),
('department-leader', 'APPROVE_DEPARTMENT_PURCHASE');

-- Cấp quyền cho Giám đốc (Director)
INSERT IGNORE INTO role_permissions (role_code, permission_code)
VALUES 
('director', 'VIEW_DASHBOARD'),
('director', 'VIEW_REPORTS'),
('director', 'VIEW_ASSETS'),
('director', 'VIEW_PURCHASE_PROPOSALS'),
('director', 'APPROVE_DIRECTOR_PURCHASE');

-- Cấp quyền cho Người dùng (User)
INSERT IGNORE INTO role_permissions (role_code, permission_code)
VALUES 
('user', 'VIEW_DASHBOARD'),
('user', 'VIEW_ASSETS');
