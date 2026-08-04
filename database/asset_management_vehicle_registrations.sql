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
-- Table structure for table `vehicle_registrations`
--

DROP TABLE IF EXISTS `vehicle_registrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehicle_registrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `asset_id` int DEFAULT NULL,
  `registration_number` varchar(100) NOT NULL,
  `requester_id` int DEFAULT NULL,
  `vehicle_id` int DEFAULT NULL,
  `vehicle_type` varchar(100) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `registration_date` date DEFAULT NULL,
  `departure_time` time DEFAULT NULL,
  `participants` varchar(255) DEFAULT NULL,
  `destination` varchar(255) DEFAULT NULL,
  `expiration_date` date DEFAULT NULL,
  `insurance_policy_number` varchar(255) DEFAULT NULL,
  `notes` text,
  `attachment_path` varchar(255) DEFAULT NULL,
  `document_name` varchar(255) DEFAULT NULL,
  `status` enum('pending','approved','scheduled','rejected','cancelled') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `departure_location` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registration_number` (`registration_number`),
  KEY `asset_id` (`asset_id`),
  KEY `owner_id` (`requester_id`),
  CONSTRAINT `vehicle_registrations_ibfk_1` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE SET NULL,
  CONSTRAINT `vehicle_registrations_ibfk_2` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehicle_registrations`
--

LOCK TABLES `vehicle_registrations` WRITE;
/*!40000 ALTER TABLE `vehicle_registrations` DISABLE KEYS */;
INSERT INTO `vehicle_registrations` VALUES (13,NULL,'REG-1784280229361',334,3,NULL,NULL,'2026-07-21','06:30:00',' Ông Hồ Thanh Thuận , Ông Võ Chí Công, Bà Đặng Thị Kim Thi ,Bà Huỳnh Xuân Anh , Ông Trần Thanh Đạt, Ông Phạm Thế Thương ','Khu xử lý chất thải tập trung Tóc Tiên, xã Châu Pha,  TP.HCM',NULL,NULL,'',NULL,NULL,'pending','2026-07-17 02:23:49','2026-07-17 02:24:28','MBS Office'),(14,NULL,'REG-1784280739902',339,2,NULL,NULL,'2026-07-21','06:30:00','Bà Hoàng Hoa Mỹ, Ông Võ Chí Công','Khu liên hợp xử lý chất thải rắn Nam Bình Dương',NULL,NULL,'',NULL,NULL,'pending','2026-07-17 02:32:19','2026-07-17 02:32:19','MBS Office'),(15,NULL,'REG-1784280879968',339,3,NULL,NULL,'2026-07-23','07:00:00','Bà Huỳnh Xuân Anh','Khu liên hợp xử lý chất thải rắn Tây Bắc',NULL,NULL,'',NULL,NULL,'pending','2026-07-17 02:34:39','2026-07-17 02:34:39','MBS Office'),(16,NULL,'REG-1784514914320',339,2,NULL,NULL,'2026-07-24','06:30:00','Cao Việt Bắc, Ngô Tấn Tài, Nguyễn Lập Thúy An','Nhà mẹ Việt Nam Anh Hùng, Đền Bến Dược, Nghĩa trang liệt sĩ Củ Chi',NULL,NULL,'',NULL,NULL,'pending','2026-07-19 19:35:14','2026-07-22 20:03:22','MBS Office'),(17,NULL,'REG-1784532834205',339,3,NULL,NULL,'2026-07-24','06:00:00','Ông Phan Châu Hoài Nghĩa ','TTC Bưng Riềng, TTC Phước Tân, TTC Phước Hải, TTC Đất Đỏ',NULL,NULL,'',NULL,NULL,'pending','2026-07-20 00:33:54','2026-07-20 00:33:54','MBS Office'),(18,NULL,'REG-1784855270267',339,3,NULL,NULL,'2026-07-31','11:00:00','Ông Phan Châu Hoài Nghĩa ','TTC Vũng Tàu, TTC Rạch Dừa 1, TTC Rạch Dừa 2, TTC Long Sơn',NULL,NULL,'',NULL,NULL,'pending','2026-07-23 18:07:50','2026-07-23 18:07:50','MBS Office'),(19,NULL,'REG-1784865179260',339,3,NULL,NULL,'2026-07-28','06:30:00','Hồ Thanh Thuận (TP.GSKLH), Võ Chí Công, Đặng Kim Thi, Huỳnh Xuân Anh','Khu xử lý chất thải tập trung Tóc Tiên, xã Châu Pha, TP.HCM',NULL,NULL,'',NULL,NULL,'pending','2026-07-23 20:52:59','2026-07-23 20:52:59','MBS Office'),(20,NULL,'REG-1784865364885',339,2,NULL,NULL,'2026-07-28','06:30:00','Ban Giám đốc','Khu liên hợp xử lý chất thải tập trung Tóc Tiên',NULL,NULL,'Phòng GSKLH dời lịch xe đi Nam Bình Dương Thứ Ba (ngày 28/7/2026) sang Thứ Năm (ngày 30/7/2026)',NULL,NULL,'scheduled','2026-07-23 20:56:04','2026-07-30 02:49:39','MBS Office'),(21,NULL,'REG-1784882572509',339,3,NULL,NULL,'2026-07-29','07:00:00','Ông Phan Hồng Khâm, Ông Nguyễn Tiền Phong, Ông Trần Thuận Hóa, Bà Ngô Thị Quỳnh Trang','Khu xử lý chất thải Đa Phước và Khu xử lý Tóc Tiên (Kbec)',NULL,NULL,'thành phần 03 phòng phối hợp đi ',NULL,NULL,'approved','2026-07-24 01:42:52','2026-07-29 09:59:27','MBS Office'),(22,NULL,'REG-1785119341480',339,3,NULL,NULL,'2026-07-30','06:30:00','Bà Hoàng Hoa Mỹ','Khu liên hợp xử lý chất thải rắn Nam Bình Dương, phường Chánh Phú Hòa, TP.HCM',NULL,NULL,'sắp xếp xe dời lịch đi vào ngày 30/7/2026. Vì ngày 28/7/2026 có lịch đột xuất xe phục vụ Ban Giám đốc công tác ngày 28/7/2026',NULL,NULL,'scheduled','2026-07-26 19:29:01','2026-07-30 02:49:15','MBS Office'),(29,NULL,'REG-1785393727798',410,2,NULL,NULL,'2026-07-31','13:41:00',NULL,'Bình Dương',NULL,NULL,'',NULL,NULL,'scheduled','2026-07-30 06:42:07','2026-07-30 06:43:14','MBS Office');
/*!40000 ALTER TABLE `vehicle_registrations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-30 13:46:06
