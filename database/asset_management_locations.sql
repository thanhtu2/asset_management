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
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `parent_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `locations_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `locations` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=374 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (34,'Trụ sở chính','OFFICE','40 Võ Thị Sáu, phường Tân Định',NULL,'2026-03-05 08:27:35','2026-03-24 00:26:44'),(80,'Văn phòng trạm cân Phước Hiệp','GSKL_VPPH',NULL,NULL,'2026-03-09 08:17:02','2026-03-24 00:26:35'),(228,'Trạm cân Vietstar','GSKL_VST',NULL,NULL,'2026-03-24 00:30:23','2026-03-24 00:30:23'),(229,'Trạm cân Tâm Sinh Nghĩa','GSKL_TSN',NULL,NULL,'2026-03-24 00:31:33','2026-03-24 00:31:33'),(230,'Văn phòng Container Phước Hiệp','GSKLH_VPPH',NULL,NULL,'2026-03-24 00:33:14','2026-03-24 00:33:14'),(231,'Trạm cân Đa Phước','GSKL_ĐP',NULL,NULL,'2026-03-24 00:33:57','2026-03-24 00:33:57'),(232,'Container Đa Phước','GSKLH_ĐP',NULL,NULL,'2026-03-24 00:34:25','2026-03-24 00:34:25'),(233,'Công trường Đông Thạnh','GSKLH_ĐT',NULL,NULL,'2026-03-24 00:35:15','2026-03-24 00:35:15'),(234,'Công trường Gò Cát','GSKLH_GC',NULL,NULL,'2026-03-24 00:35:38','2026-03-24 00:35:38');
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-19 16:38:40
