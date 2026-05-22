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
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `code` varchar(50) NOT NULL,
  `parent_id` int DEFAULT NULL,
  `description` text,
  `depreciation_rate` decimal(5,2) DEFAULT '0.00',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `parent_id` (`parent_id`),
  CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=801 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Máy tính','COMPUTER',NULL,'Máy tính để bàn và laptop',10.00,'2026-03-05 03:54:21','2026-04-01 07:49:12'),(2,'Thiết bị văn phòng','OFFICE',NULL,'Máy in, máy fax, điện thoại',20.00,'2026-03-05 03:54:21','2026-04-01 07:53:27'),(3,'Đồ đạc','FURNITURE',NULL,'Bàn, ghế, tủ',0.00,'2026-03-05 03:54:21','2026-03-05 03:54:21'),(4,'Phương tiện','VEHICLE',NULL,'Xe ô tô, xe máy',10.00,'2026-03-05 03:54:21','2026-04-01 07:53:39'),(5,'Thiết bị điện tử','ELECTRONIC',NULL,'TV, điều hòa, tủ lạnh',15.00,'2026-03-05 03:54:21','2026-04-01 07:53:55'),(482,'Thiết bị mạng','NETWORK',NULL,'các thiệt bị mạng',0.00,'2026-05-07 08:49:48','2026-05-07 08:49:48'),(483,'các thiết bị pccc','PCCC',NULL,NULL,0.00,'2026-05-07 08:50:01','2026-05-07 08:50:01'),(484,'Thiết bị ghi hình','CAMERA',NULL,NULL,0.00,'2026-05-07 08:50:28','2026-05-07 08:50:28'),(485,'Thiết bị cân','WEIGHBRIDGE',NULL,NULL,0.00,'2026-05-07 08:50:45','2026-05-07 08:50:45'),(486,'Thiết bị khác','OTHER',NULL,NULL,0.00,'2026-05-07 08:51:00','2026-05-07 08:51:00'),(487,'Thiết bị phòng họp','MEETING',NULL,NULL,0.00,'2026-05-07 08:56:22','2026-05-07 08:56:22');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
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
