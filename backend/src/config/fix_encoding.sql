-- Script sửa lỗi encoding cho database asset_management
-- Chạy script này một lần để sửa dữ liệu tiếng Việt bị lỗi

USE asset_management;

-- Bước 1: Đổi charset của database và các bảng sang utf8mb4
ALTER DATABASE asset_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bước 2: Đổi charset của các bảng
ALTER TABLE categories CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE locations CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE suppliers CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE departments CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE users CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE assets CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE maintenance_records CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE inventory_sessions CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE inventory_records CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Bước 3: Convert dữ liệu bị lỗi từ latin1 sang utf8mb4
-- Chạy từng dòng một để xem có dòng nào lỗi không

-- Categories
UPDATE categories SET 
  name = CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4),
  code = CONVERT(CONVERT(CONVERT(code USING latin1) USING utf8mb4) USING utf8mb4),
  description = CONVERT(CONVERT(CONVERT(description USING latin1) USING utf8mb4) USING utf8mb4)
WHERE name != CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4);

-- Locations
UPDATE locations SET 
  name = CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4),
  code = CONVERT(CONVERT(CONVERT(code USING latin1) USING utf8mb4) USING utf8mb4),
  address = CONVERT(CONVERT(CONVERT(address USING latin1) USING utf8mb4) USING utf8mb4)
WHERE name != CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4);

-- Suppliers
UPDATE suppliers SET 
  name = CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4),
  code = CONVERT(CONVERT(CONVERT(code USING latin1) USING utf8mb4) USING utf8mb4),
  contact_person = CONVERT(CONVERT(CONVERT(contact_person USING latin1) USING utf8mb4) USING utf8mb4),
  address = CONVERT(CONVERT(CONVERT(address USING latin1) USING utf8mb4) USING utf8mb4)
WHERE name != CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4);

-- Departments
UPDATE departments SET 
  name = CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4),
  code = CONVERT(CONVERT(CONVERT(code USING latin1) USING utf8mb4) USING utf8mb4)
WHERE name != CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4);

-- Users
UPDATE users SET 
  fullName = CONVERT(CONVERT(CONVERT(fullName USING latin1) USING utf8mb4) USING utf8mb4)
WHERE fullName != CONVERT(CONVERT(CONVERT(fullName USING latin1) USING utf8mb4) USING utf8mb4);

-- Assets (bảng chính bị ảnh hưởng)
UPDATE assets SET 
  name = CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4),
  asset_code = CONVERT(CONVERT(CONVERT(asset_code USING latin1) USING utf8mb4) USING utf8mb4),
  description = CONVERT(CONVERT(CONVERT(description USING latin1) USING utf8mb4) USING utf8mb4),
  barcode = CONVERT(CONVERT(CONVERT(barcode USING latin1) USING utf8mb4) USING utf8mb4),
  assigned_to_name = CONVERT(CONVERT(CONVERT(assigned_to_name USING latin1) USING utf8mb4) USING utf8mb4)
WHERE name != CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4);

-- Maintenance Records
UPDATE maintenance_records SET 
  description = CONVERT(CONVERT(CONVERT(description USING latin1) USING utf8mb4) USING utf8mb4),
  technician = CONVERT(CONVERT(CONVERT(technician USING latin1) USING utf8mb4) USING utf8mb4)
WHERE description != CONVERT(CONVERT(CONVERT(description USING latin1) USING utf8mb4) USING utf8mb4);

-- Inventory Sessions
UPDATE inventory_sessions SET 
  name = CONVERT(CONVERT(CONVERT(name USING latin1) USING utf8mb4) USING utf8mb4);

-- Inventory Records
UPDATE inventory_records SET 
  notes = CONVERT(CONVERT(CONVERT(notes USING latin1) USING utf8mb4) USING utf8mb4)
WHERE notes IS NOT NULL AND notes != CONVERT(CONVERT(CONVERT(notes USING latin1) USING utf8mb4) USING utf8mb4);

-- Bước 4: Kiểm tra dữ liệu sau khi sửa
SELECT 'Categories:' as table_name, COUNT(*) as count FROM categories;
SELECT * FROM categories LIMIT 5;

SELECT 'Locations:' as table_name, COUNT(*) as count FROM locations;
SELECT * FROM locations LIMIT 5;

SELECT 'Assets:' as table_name, COUNT(*) as count FROM assets;
SELECT id, asset_code, name FROM assets LIMIT 10;

-- Kiểm tra dữ liệu tiếng Việt
SELECT id, asset_code, name FROM assets WHERE name LIKE '% Máy%' OR name LIKE '%máy%';
