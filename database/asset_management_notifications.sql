-- MySQL dump 10.13  Distrib 8.0.45, for Win64 (x86_64)
--
-- Host: localhost    Database: asset_management
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `type` varchar(50) DEFAULT 'info',
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=1255 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (115,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 111 tài sản từ file Excel.','success',1,'2026-03-27 02:13:09'),(116,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 111 tài sản từ file Excel.','success',1,'2026-03-27 02:21:24'),(117,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 111 tài sản từ file Excel.','success',1,'2026-03-27 02:38:03'),(118,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 111 tài sản từ file Excel.','success',1,'2026-03-27 02:42:16'),(119,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 120 tài sản từ file Excel.','success',1,'2026-03-27 02:48:54'),(1242,NULL,'Cập nhật tài sản','Tài sản \"Máy in Brother HL-L2366DW\" đã được chỉnh sửa thông tin.','info',1,'2026-07-21 18:31:40'),(1243,NULL,'Cập nhật tài sản','Tài sản \"Máy in Brother HL-L2366DW\" đã được chỉnh sửa thông tin.','info',1,'2026-07-21 18:32:08'),(1244,NULL,'Cập nhật tài sản','Tài sản \"Máy in Brother HL-L2366DW\" đã được chỉnh sửa thông tin.','info',1,'2026-07-21 18:32:41'),(1245,NULL,'Cập nhật tài sản','Tài sản \"Bàn làm việc xám (70x140x20)\r\n+ ghế xoay thấp\" đã được chỉnh sửa thông tin.','info',0,'2026-07-23 18:48:23'),(1246,NULL,'Cập nhật tài sản','Tài sản \"Máy in Brother HL-L2366DW\" đã được chỉnh sửa thông tin.','info',0,'2026-07-23 18:51:01'),(1247,NULL,'Cập nhật tài sản','Tài sản \"Máy in Brother HL-L2366DW\" đã được chỉnh sửa thông tin.','info',0,'2026-07-23 18:51:23'),(1248,NULL,'Cập nhật tài sản','Tài sản \"Bàn làm việc xám (70x140x20)\r\n+ ghế xoay thấp\" đã được chỉnh sửa thông tin.','info',1,'2026-07-23 18:52:08'),(1249,NULL,'Cập nhật tài sản','Tài sản \"Bộ bàn ghế nhân viên\" đã được chỉnh sửa thông tin.','info',0,'2026-07-23 18:54:39'),(1250,NULL,'Cập nhật tài sản','Tài sản \"Bộ bàn ghế nhân viên\" đã được chỉnh sửa thông tin.','info',0,'2026-07-23 18:54:49'),(1251,NULL,'Cập nhật tài sản','Tài sản \"Giá sách GS1B (Kệ hồ sơ sắt xám)\" đã được chỉnh sửa thông tin.','info',0,'2026-07-23 18:55:04'),(1252,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 27 tài sản từ file Excel.','success',0,'2026-07-24 07:41:57'),(1253,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 26 tài sản từ file Excel.','success',0,'2026-07-24 07:51:57'),(1254,NULL,'Import tài sản thành công','Hệ thống vừa import thành công 2 tài sản từ file Excel. (Có 26 dòng bị lỗi/bỏ qua)','success',0,'2026-07-24 02:31:32');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-30 13:46:05
