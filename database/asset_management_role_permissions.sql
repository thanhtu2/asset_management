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
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `role_permissions` (
  `role_code` varchar(50) NOT NULL,
  `permission_code` varchar(50) NOT NULL,
  PRIMARY KEY (`role_code`,`permission_code`),
  KEY `permission_code` (`permission_code`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_code`) REFERENCES `roles` (`code`),
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_code`) REFERENCES `permissions` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
INSERT INTO `role_permissions` VALUES ('admin','APPROVE_DEPARTMENT_PURCHASE'),('department-leader','APPROVE_DEPARTMENT_PURCHASE'),('admin','APPROVE_DIRECTOR_PURCHASE'),('director','APPROVE_DIRECTOR_PURCHASE'),('admin','COORDINATE_VEHICLE'),('manager','COORDINATE_VEHICLE'),('admin','CREATE_ASSET'),('manager','CREATE_ASSET'),('admin','CREATE_CATEGORY'),('manager','CREATE_CATEGORY'),('admin','CREATE_DEPARTMENT'),('manager','CREATE_DEPARTMENT'),('admin','CREATE_INVENTORY'),('manager','CREATE_INVENTORY'),('admin','CREATE_LOCATION'),('manager','CREATE_LOCATION'),('admin','CREATE_MAINTENANCE'),('manager','CREATE_MAINTENANCE'),('admin','CREATE_PURCHASE_PROPOSAL'),('department-leader','CREATE_PURCHASE_PROPOSAL'),('purchase-requester','CREATE_PURCHASE_PROPOSAL'),('admin','CREATE_SUPPLIER'),('manager','CREATE_SUPPLIER'),('admin','CREATE_VEHICLE_REGISTRATION'),('manager','CREATE_VEHICLE_REGISTRATION'),('admin','DELETE_ASSET'),('manager','DELETE_ASSET'),('admin','DELETE_CATEGORY'),('manager','DELETE_CATEGORY'),('admin','DELETE_DEPARTMENT'),('manager','DELETE_DEPARTMENT'),('admin','DELETE_INVENTORY'),('manager','DELETE_INVENTORY'),('admin','DELETE_LOCATION'),('manager','DELETE_LOCATION'),('admin','DELETE_MAINTENANCE'),('manager','DELETE_MAINTENANCE'),('admin','DELETE_SUPPLIER'),('manager','DELETE_SUPPLIER'),('admin','DELETE_VEHICLE_REGISTRATION'),('manager','DELETE_VEHICLE_REGISTRATION'),('admin','EDIT_ASSET'),('manager','EDIT_ASSET'),('admin','EDIT_CATEGORY'),('manager','EDIT_CATEGORY'),('admin','EDIT_DEPARTMENT'),('manager','EDIT_DEPARTMENT'),('admin','EDIT_INVENTORY'),('manager','EDIT_INVENTORY'),('admin','EDIT_LOCATION'),('manager','EDIT_LOCATION'),('admin','EDIT_MAINTENANCE'),('manager','EDIT_MAINTENANCE'),('admin','EDIT_SUPPLIER'),('manager','EDIT_SUPPLIER'),('admin','EDIT_VEHICLE_REGISTRATION'),('manager','EDIT_VEHICLE_REGISTRATION'),('admin','MANAGE_PURCHASE_PROPOSALS'),('admin','MANAGE_ROLES'),('admin','MANAGE_USERS'),('admin','VIEW_ASSETS'),('department-leader','VIEW_ASSETS'),('director','VIEW_ASSETS'),('manager','VIEW_ASSETS'),('purchase-requester','VIEW_ASSETS'),('user','VIEW_ASSETS'),('admin','VIEW_AUDIT_LOGS'),('admin','VIEW_CATEGORIES'),('manager','VIEW_CATEGORIES'),('admin','VIEW_DASHBOARD'),('department-leader','VIEW_DASHBOARD'),('director','VIEW_DASHBOARD'),('manager','VIEW_DASHBOARD'),('purchase-requester','VIEW_DASHBOARD'),('user','VIEW_DASHBOARD'),('admin','VIEW_DEPARTMENTS'),('manager','VIEW_DEPARTMENTS'),('admin','VIEW_INVENTORY'),('manager','VIEW_INVENTORY'),('admin','VIEW_LOCATIONS'),('manager','VIEW_LOCATIONS'),('admin','VIEW_MAINTENANCE'),('manager','VIEW_MAINTENANCE'),('admin','VIEW_PURCHASE_PROPOSALS'),('department-leader','VIEW_PURCHASE_PROPOSALS'),('director','VIEW_PURCHASE_PROPOSALS'),('purchase-requester','VIEW_PURCHASE_PROPOSALS'),('admin','VIEW_REPORTS'),('director','VIEW_REPORTS'),('manager','VIEW_REPORTS'),('admin','VIEW_SUPPLIERS'),('manager','VIEW_SUPPLIERS'),('admin','VIEW_VEHICLE_REGISTRATIONS'),('manager','VIEW_VEHICLE_REGISTRATIONS'),('admin','VIEW_VEHICLE_WEEKLY'),('manager','VIEW_VEHICLE_WEEKLY');
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
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
