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
-- Table structure for table `purchase_proposals`
--

DROP TABLE IF EXISTS `purchase_proposals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchase_proposals` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `requester_id` int DEFAULT NULL,
  `department_id` int DEFAULT NULL,
  `status` enum('draft','department_pending','director_pending','approved','rejected') DEFAULT 'draft',
  `department_leader_id` int DEFAULT NULL,
  `department_comment` text,
  `director_id` int DEFAULT NULL,
  `director_comment` text,
  `total_amount` decimal(15,2) DEFAULT '0.00',
  `items` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `attached_file_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`),
  KEY `requester_id` (`requester_id`),
  KEY `department_id` (`department_id`),
  KEY `department_leader_id` (`department_leader_id`),
  KEY `director_id` (`director_id`),
  CONSTRAINT `purchase_proposals_ibfk_1` FOREIGN KEY (`requester_id`) REFERENCES `users` (`id`),
  CONSTRAINT `purchase_proposals_ibfk_2` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`),
  CONSTRAINT `purchase_proposals_ibfk_3` FOREIGN KEY (`department_leader_id`) REFERENCES `users` (`id`),
  CONSTRAINT `purchase_proposals_ibfk_4` FOREIGN KEY (`director_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_proposals`
--

LOCK TABLES `purchase_proposals` WRITE;
/*!40000 ALTER TABLE `purchase_proposals` DISABLE KEYS */;
INSERT INTO `purchase_proposals` VALUES (13,'PP-20260508-001','mua sắm máy tính 2026','',10,1,'approved',2,'',2,'',49200000.00,'[{\"name\": \"Bộ máy vi tính \", \"spec\": \"i5 12400f\", \"unit\": \"Bộ\", \"quantity\": 2, \"unit_price\": 15600000}, {\"name\": \"Bộ máy vi tính\", \"spec\": \"i4 10500\", \"unit\": \"Bộ\", \"quantity\": 1, \"unit_price\": 18000000}]','2026-05-08 04:10:16','2026-05-13 03:41:01','/uploads/1778213416903-261160726-Asset-Management-System.pdf'),(14,'PP-20260514-001','mua sắm server','....',10,1,'approved',11,'kính trình',12,'chấp thuận',17748000.00,'[{\"name\": \"cloud server\", \"spec\": \"8 core, 12gb ram, 100gb ssd\", \"unit\": \"Chiếc\", \"quantity\": 1, \"unit_price\": 16632000}, {\"name\": \"domain\", \"spec\": \"\", \"unit\": \"Chiếc\", \"quantity\": 2, \"unit_price\": 558000}]','2026-05-14 08:21:34','2026-05-14 08:22:40','/uploads/1778746894676-296669671-3.-[VIETNIX]---BÃO-GIÃ-Dá»CH-Vá»¤---ENTERPRISE-CLOUD-+-TÃN-MIá»N-VIá»T-NAM.pdf');
/*!40000 ALTER TABLE `purchase_proposals` ENABLE KEYS */;
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
