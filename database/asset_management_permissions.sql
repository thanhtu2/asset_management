-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: asset_management
-- ------------------------------------------------------
-- Server version	8.0.45

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `code` varchar(50) NOT NULL,
  `name` varchar(100) NOT NULL,
  `module` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES ('APPROVE_DEPARTMENT_PURCHASE','Duyệt phòng ban','Mua sắm'),('APPROVE_DIRECTOR_PURCHASE','Giám đốc chấp nhận','Mua sắm'),('COORDINATE_VEHICLE','Điều phối xe','Đăng ký xe'),('CREATE_ASSET','Thêm tài sản','Tài sản'),('CREATE_CATEGORY','Thêm danh mục','Danh mục'),('CREATE_DEPARTMENT','Thêm phòng ban','Danh mục'),('CREATE_INVENTORY','Thêm kiểm kê','Kiểm kê'),('CREATE_LOCATION','Thêm vị trí','Danh mục'),('CREATE_MAINTENANCE','Thêm bảo trì','Bảo trì'),('CREATE_PURCHASE_PROPOSAL','Tạo phiếu đề xuất','Mua sắm'),('CREATE_SUPPLIER','Thêm nhà cung cấp','Danh mục'),('CREATE_VEHICLE_REGISTRATION','Thêm đăng ký xe','Đăng ký xe'),('DELETE_ASSET','Xóa tài sản','Tài sản'),('DELETE_CATEGORY','Xóa danh mục','Danh mục'),('DELETE_DEPARTMENT','Xóa phòng ban','Danh mục'),('DELETE_INVENTORY','Xóa kiểm kê','Kiểm kê'),('DELETE_LOCATION','Xóa vị trí','Danh mục'),('DELETE_MAINTENANCE','Xóa bảo trì','Bảo trì'),('DELETE_SUPPLIER','Xóa nhà cung cấp','Danh mục'),('DELETE_VEHICLE_REGISTRATION','Xóa đăng ký xe','Đăng ký xe'),('EDIT_ASSET','Sửa tài sản','Tài sản'),('EDIT_CATEGORY','Sửa danh mục','Danh mục'),('EDIT_DEPARTMENT','Sửa phòng ban','Danh mục'),('EDIT_INVENTORY','Sửa kiểm kê','Kiểm kê'),('EDIT_LOCATION','Sửa vị trí','Danh mục'),('EDIT_MAINTENANCE','Sửa bảo trì','Bảo trì'),('EDIT_SUPPLIER','Sửa nhà cung cấp','Danh mục'),('EDIT_VEHICLE_REGISTRATION','Sửa đăng ký xe','Đăng ký xe'),('MANAGE_PURCHASE_PROPOSALS','Quản lý phiếu đề xuất mua sắm','Mua sắm'),('MANAGE_ROLES','Quản lý phân quyền','Hệ thống'),('MANAGE_USERS','Quản lý người dùng','Hệ thống'),('VIEW_ASSETS','Xem danh sách tài sản','Tài sản'),('VIEW_AUDIT_LOGS','Xem Nhật ký hệ thống','Hệ thống'),('VIEW_CATEGORIES','Xem danh mục','Danh mục'),('VIEW_DASHBOARD','Xem Dashboard','Hệ thống'),('VIEW_DEPARTMENTS','Xem phòng ban','Danh mục'),('VIEW_INVENTORY','Xem kiểm kê','Kiểm kê'),('VIEW_LOCATIONS','Xem vị trí','Danh mục'),('VIEW_MAINTENANCE','Xem bảo trì','Bảo trì'),('VIEW_PURCHASE_PROPOSALS','Xem phiếu đề xuất','Mua sắm'),('VIEW_REPORTS','Xem Báo cáo','Hệ thống'),('VIEW_SUPPLIERS','Xem nhà cung cấp','Danh mục'),('VIEW_VEHICLE_REGISTRATIONS','Xem danh sách đăng ký xe','Đăng ký xe'),('VIEW_VEHICLE_WEEKLY','Xem lịch tuần xe','Đăng ký xe');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 16:38:41
