-- Asset Management System Database Initialization Script

CREATE DATABASE IF NOT EXISTS asset_management;
USE asset_management;

-- 1. Categories (không phụ thuộc ai)
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

-- 2. Locations (không phụ thuộc ai)
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

-- 3. Suppliers (không phụ thuộc ai)
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

-- 4. Departments (chưa có manager_id vì users chưa tồn tại)
CREATE TABLE IF NOT EXISTS departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  manager_id INT NULL,
  parent_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES departments(id) ON DELETE SET NULL
);

-- 5. Users (phụ thuộc departments)
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

-- 6. Thêm manager_id vào departments sau khi users đã tồn tại
ALTER TABLE departments ADD CONSTRAINT fk_dept_manager 
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- 7. Assets (phụ thuộc categories, locations, departments, suppliers, users)
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

-- 8. Vehicles (phụ thuộc assets)
CREATE TABLE IF NOT EXISTS vehicles (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT UNIQUE NULL,
  plate_number VARCHAR(20) UNIQUE NOT NULL,
  vehicle_type VARCHAR(100),
  brand VARCHAR(100),
  model VARCHAR(100),
  seats INT,
  current_km INT DEFAULT 0,
  status ENUM('available', 'in_use', 'maintenance', 'retired') DEFAULT 'available',
  inspection_expiration DATE,
  insurance_expiration DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE SET NULL
);

-- 9. Vehicle Registrations (phụ thuộc users, vehicles)
CREATE TABLE IF NOT EXISTS vehicle_registrations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  registration_number VARCHAR(50) UNIQUE NOT NULL,
  requester_id INT NULL,
  vehicle_id INT NULL,
  registration_date DATE,
  departure_location VARCHAR(255),
  departure_time TIME,
  destination VARCHAR(255),
  participants TEXT,
  notes TEXT,
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE SET NULL
);

-- Bảng trung gian Đăng ký xe - Phòng ban (để chọn nhiều phòng)
CREATE TABLE IF NOT EXISTS vehicle_registration_departments (
  registration_id INT NOT NULL,
  department_id INT NOT NULL,
  PRIMARY KEY (registration_id, department_id),
  FOREIGN KEY (registration_id) REFERENCES vehicle_registrations(id) ON DELETE CASCADE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

-- 10. Asset User History (phụ thuộc assets, users, departments)
CREATE TABLE IF NOT EXISTS asset_user_history (
  id INT PRIMARY KEY AUTO_INCREMENT,
  asset_id INT NOT NULL,
  user_id INT NULL,
  department_id INT NULL,
  assigned_by INT NULL,
  start_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  end_date DATETIME NULL,
  notes TEXT,
  FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 11. Maintenance Records (phụ thuộc assets)
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

-- 12. Inventory Sessions (phụ thuộc users, departments)
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

-- 13. Inventory Records (phụ thuộc inventory_sessions, assets, users, locations)
CREATE TABLE IF NOT EXISTS inventory_records (
  id INT PRIMARY KEY AUTO_INCREMENT,
  session_id INT NOT NULL,
  asset_id INT NOT NULL,
  status VARCHAR(30) DEFAULT 'pending_check' NOT NULL,
  notes TEXT,
  image_url VARCHAR(255),
  actual_location_id INT NULL,
  actual_quantity INT DEFAULT 0,
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

-- 14. Notifications (phụ thuộc users)
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

-- 15. Roles, Permissions (không phụ thuộc ai)
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;

CREATE TABLE IF NOT EXISTS roles (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS permissions (
  code VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  module VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_code VARCHAR(50),
  permission_code VARCHAR(50),
  PRIMARY KEY (role_code, permission_code),
  FOREIGN KEY (role_code) REFERENCES roles(code),
  FOREIGN KEY (permission_code) REFERENCES permissions(code)
);

-- 16. Purchase Proposals (phụ thuộc users, departments)
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

-- 17. Audit Logs (phụ thuộc users)
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

-- Seed data
INSERT IGNORE INTO categories (name, code, description) VALUES
('Máy tính', 'COMPUTER', 'Máy tính để bàn và laptop'),
('Thiết bị văn phòng', 'OFFICE', 'Máy in, máy fax, điện thoại'),
('Đồ đạc', 'FURNITURE', 'Bàn, ghế, tủ'),
('Phương tiện', 'VEHICLE', 'Xe ô tô, xe máy'),
('Thiết bị điện tử', 'ELECTRONIC', 'TV, điều hòa, tủ lạnh');

INSERT IGNORE INTO departments (name, code) VALUES ('IT', 'IT');

INSERT IGNORE INTO suppliers (name, code, contact_person, phone, email) VALUES
('Công ty TNHH ABC', 'SUP001', 'Nguyễn Văn A', '0901234567', 'abc@supplier.com');

INSERT IGNORE INTO roles (code, name, description) VALUES 
('admin', 'Quản trị viên', 'Toàn quyền hệ thống'),
('manager', 'Quản lý tài sản', 'Quản lý tài sản, kiểm kê, bảo trì'),
('user', 'Người dùng', 'Chỉ xem và sử dụng tài sản được cấp'),
('purchase-requester', 'Người đề xuất mua sắm', 'Người tạo phiếu đề xuất mua sắm'),
('department-leader', 'Lãnh đạo phòng', 'Trưởng phòng duyệt đề xuất của phòng'),
('director', 'Giám đốc', 'Giám đốc phê duyệt cuối cùng');

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
('VIEW_CATEGORIES', 'Xem danh mục', 'Danh mục'),
('CREATE_CATEGORY', 'Thêm danh mục', 'Danh mục'),
('EDIT_CATEGORY', 'Sửa danh mục', 'Danh mục'),
('DELETE_CATEGORY', 'Xóa danh mục', 'Danh mục'),
('VIEW_LOCATIONS', 'Xem vị trí', 'Danh mục'),
('CREATE_LOCATION', 'Thêm vị trí', 'Danh mục'),
('EDIT_LOCATION', 'Sửa vị trí', 'Danh mục'),
('DELETE_LOCATION', 'Xóa vị trí', 'Danh mục'),
('VIEW_DEPARTMENTS', 'Xem phòng ban', 'Danh mục'),
('CREATE_DEPARTMENT', 'Thêm phòng ban', 'Danh mục'),
('EDIT_DEPARTMENT', 'Sửa phòng ban', 'Danh mục'),
('DELETE_DEPARTMENT', 'Xóa phòng ban', 'Danh mục'),
('VIEW_SUPPLIERS', 'Xem nhà cung cấp', 'Danh mục'),
('CREATE_SUPPLIER', 'Thêm nhà cung cấp', 'Danh mục'),
('EDIT_SUPPLIER', 'Sửa nhà cung cấp', 'Danh mục'),
('DELETE_SUPPLIER', 'Xóa nhà cung cấp', 'Danh mục'),
('VIEW_MAINTENANCE', 'Xem bảo trì', 'Bảo trì'),
('CREATE_MAINTENANCE', 'Thêm bảo trì', 'Bảo trì'),
('EDIT_MAINTENANCE', 'Sửa bảo trì', 'Bảo trì'),
('DELETE_MAINTENANCE', 'Xóa bảo trì', 'Bảo trì'),
('VIEW_INVENTORY', 'Xem kiểm kê', 'Kiểm kê'),
('CREATE_INVENTORY', 'Thêm kiểm kê', 'Kiểm kê'),
('EDIT_INVENTORY', 'Sửa kiểm kê', 'Kiểm kê'),
('DELETE_INVENTORY', 'Xóa kiểm kê', 'Kiểm kê'),
('MANAGE_PURCHASE_PROPOSALS', 'Quản lý phiếu đề xuất mua sắm', 'Mua sắm'),
('CREATE_PURCHASE_PROPOSAL', 'Tạo phiếu đề xuất', 'Mua sắm'),
('VIEW_PURCHASE_PROPOSALS', 'Xem phiếu đề xuất', 'Mua sắm'),
('APPROVE_DEPARTMENT_PURCHASE', 'Duyệt phòng ban', 'Mua sắm'),
('APPROVE_DIRECTOR_PURCHASE', 'Giám đốc chấp nhận', 'Mua sắm'),
('VIEW_VEHICLE_REGISTRATIONS', 'Xem danh sách đăng ký xe', 'Đăng ký xe'),
('VIEW_VEHICLE_WEEKLY', 'Xem lịch tuần xe', 'Đăng ký xe'),
('CREATE_VEHICLE_REGISTRATION', 'Thêm đăng ký xe', 'Đăng ký xe'),
('EDIT_VEHICLE_REGISTRATION', 'Sửa đăng ký xe', 'Đăng ký xe'),
('DELETE_VEHICLE_REGISTRATION', 'Xóa đăng ký xe', 'Đăng ký xe'),
('COORDINATE_VEHICLE', 'Điều phối xe', 'Đăng ký xe');

INSERT IGNORE INTO role_permissions (role_code, permission_code)
SELECT 'admin', code FROM permissions;

INSERT IGNORE INTO role_permissions (role_code, permission_code)
SELECT 'manager', code FROM permissions 
WHERE module IN ('Tài sản', 'Danh mục', 'Bảo trì', 'Kiểm kê')
OR code IN ('VIEW_DASHBOARD', 'VIEW_REPORTS', 'VIEW_VEHICLE_REGISTRATIONS', 'VIEW_VEHICLE_WEEKLY', 'CREATE_VEHICLE_REGISTRATION', 'EDIT_VEHICLE_REGISTRATION', 'DELETE_VEHICLE_REGISTRATION', 'COORDINATE_VEHICLE');

INSERT IGNORE INTO role_permissions (role_code, permission_code) VALUES 
('department-leader', 'VIEW_DASHBOARD'),
('department-leader', 'VIEW_ASSETS'),
('department-leader', 'VIEW_PURCHASE_PROPOSALS'),
('department-leader', 'CREATE_PURCHASE_PROPOSAL'),
('department-leader', 'APPROVE_DEPARTMENT_PURCHASE');

INSERT IGNORE INTO role_permissions (role_code, permission_code) VALUES 
('director', 'VIEW_DASHBOARD'),
('director', 'VIEW_REPORTS'),
('director', 'VIEW_ASSETS'),
('director', 'VIEW_PURCHASE_PROPOSALS'),
('director', 'APPROVE_DIRECTOR_PURCHASE');

INSERT IGNORE INTO role_permissions (role_code, permission_code) VALUES 
('user', 'VIEW_DASHBOARD'),
('user', 'VIEW_ASSETS');

INSERT IGNORE INTO role_permissions (role_code, permission_code) VALUES 
('purchase-requester', 'VIEW_DASHBOARD'),
('purchase-requester', 'VIEW_ASSETS'),
('purchase-requester', 'VIEW_PURCHASE_PROPOSALS'),
('purchase-requester', 'CREATE_PURCHASE_PROPOSAL');