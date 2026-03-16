
-- Add assigned_to_name column to assets table
-- Run this in your MySQL database (phpMyAdmin or MySQL Workbench)

USE asset_management;

-- Add assigned_to_name column if it doesn't exist
ALTER TABLE assets ADD COLUMN assigned_to_name VARCHAR(100) NULL AFTER assigned_to;

-- Add department_id column to inventory_sessions table for inventory by department
ALTER TABLE inventory_sessions ADD COLUMN department_id INT NULL AFTER status;
ALTER TABLE inventory_sessions ADD INDEX (department_id);
ALTER TABLE inventory_sessions ADD FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;

