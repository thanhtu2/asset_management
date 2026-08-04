
-- Add assigned_to_name column to assets table
-- Run this in your MySQL database (phpMyAdmin or MySQL Workbench)

USE asset_management;

-- Add assigned_to_name column if it doesn't exist
ALTER TABLE assets ADD COLUMN assigned_to_name VARCHAR(100) NULL AFTER assigned_to;

-- Add department_id column to inventory_sessions table for inventory by department
ALTER TABLE inventory_sessions ADD COLUMN department_id INT NULL AFTER status;
ALTER TABLE inventory_sessions ADD INDEX (department_id);
ALTER TABLE inventory_sessions ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

-- Migration: Luồng duyệt đăng ký xe mới
-- pending (chờ lãnh đạo duyệt) -> approved (chờ điều phối gán xe) -> scheduled (đã chốt xe, hiển thị Lịch tuần)
-- Chạy script này trên DB đã có sẵn dữ liệu (không cần chạy lại init.sql)
ALTER TABLE vehicle_registrations
  MODIFY COLUMN status ENUM('pending', 'approved', 'scheduled', 'rejected', 'cancelled') DEFAULT 'pending';

-- Bản ghi cũ đã có vehicle_id (dù đang 'pending' hay 'approved' theo enum CŨ) tức là luồng
-- cũ đã cho người tạo tự chọn xe -> coi như đã hoàn tất cả 2 bước duyệt + gán xe -> 'scheduled'.
-- Lưu ý: PHẢI gộp cả 'approved' vào đây — nếu chỉ xét 'pending' thì các bản ghi cũ đã có xe
-- sẵn nhưng đang 'approved' (nghĩa CŨ) sẽ bị hiểu nhầm thành "chờ gán xe" ở nghĩa MỚI và biến
-- mất khỏi Lịch tuần cho đến khi được gán xe lại (dù xe đã có sẵn từ trước).
UPDATE vehicle_registrations SET status = 'scheduled'
WHERE status IN ('pending', 'approved') AND vehicle_id IS NOT NULL;
-- Bản ghi cũ 'approved' (nghĩa CŨ) mà KHÔNG có vehicle_id: khớp đúng nghĩa MỚI của 'approved'
-- ("lãnh đạo đã duyệt, đang chờ gán xe") -> giữ nguyên, không cần đổi.

-- Thêm index tăng tốc tra cứu gợi ý ghép chuyến (cùng ngày + giờ xuất phát + điểm đến)
ALTER TABLE vehicle_registrations
  ADD INDEX idx_merge_lookup (registration_date, departure_time, destination(100));

INSERT IGNORE INTO permissions (code, name, module) VALUES
('APPROVE_VEHICLE_REGISTRATION', 'Duyệt yêu cầu đăng ký xe (lãnh đạo)', 'Đăng ký xe');

-- Gán quyền duyệt mới cho admin và các role đang có quyền điều phối xe
-- (Có thể tách vai trò lãnh đạo duyệt / điều phối xe riêng sau qua màn Quản lý vai trò)
INSERT IGNORE INTO role_permissions (role_code, permission_code)
SELECT 'admin', 'APPROVE_VEHICLE_REGISTRATION';

INSERT IGNORE INTO role_permissions (role_code, permission_code)
SELECT DISTINCT role_code, 'APPROVE_VEHICLE_REGISTRATION'
FROM role_permissions
WHERE permission_code = 'COORDINATE_VEHICLE';

-- 'department-leader' là vai trò "lãnh đạo" đã có sẵn trong hệ thống (đang duyệt Mua sắm cấp
-- phòng ban qua APPROVE_DEPARTMENT_PURCHASE) -> gán luôn quyền xem + duyệt đăng ký xe cho vai
-- trò này, vì rất có thể đây chính là người "lãnh đạo phê duyệt" mà anh đề cập.
INSERT IGNORE INTO role_permissions (role_code, permission_code) VALUES
('department-leader', 'VIEW_VEHICLE_REGISTRATIONS'),
('department-leader', 'APPROVE_VEHICLE_REGISTRATION');

