-- MySQL dump 10.13  Distrib 8.0.44, for macos15 (x86_64)
--
-- Host: 127.0.0.1    Database: finvera_trader_test
-- ------------------------------------------------------
-- Server version	8.0.38

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
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `table_name` varchar(255) NOT NULL,
  `record_id` varchar(255) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `old_values` json DEFAULT NULL,
  `new_values` json DEFAULT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_table_record` (`table_name`,`record_id`),
  KEY `idx_audit_logs_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill_allocations`
--

DROP TABLE IF EXISTS `bill_allocations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_allocations` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `payment_voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `bill_detail_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `allocated_amount` decimal(15,2) DEFAULT '0.00',
  `allocation_date` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bill_allocations_payment_voucher_id` (`payment_voucher_id`),
  KEY `idx_bill_allocations_bill_detail_id` (`bill_detail_id`),
  KEY `idx_bill_allocations_tenant_id` (`tenant_id`),
  CONSTRAINT `bill_allocations_ibfk_1` FOREIGN KEY (`payment_voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bill_allocations_ibfk_2` FOREIGN KEY (`bill_detail_id`) REFERENCES `billwise_details` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_allocations`
--

LOCK TABLES `bill_allocations` WRITE;
/*!40000 ALTER TABLE `bill_allocations` DISABLE KEYS */;
/*!40000 ALTER TABLE `bill_allocations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billwise_details`
--

DROP TABLE IF EXISTS `billwise_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `billwise_details` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ledger_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `bill_number` varchar(255) DEFAULT NULL,
  `bill_date` datetime DEFAULT NULL,
  `bill_amount` decimal(15,2) DEFAULT '0.00',
  `pending_amount` decimal(15,2) DEFAULT '0.00',
  `is_fully_paid` tinyint(1) DEFAULT '0',
  `due_date` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_billwise_details_voucher_id` (`voucher_id`),
  KEY `idx_billwise_details_ledger_id` (`ledger_id`),
  KEY `idx_billwise_details_tenant_id` (`tenant_id`),
  CONSTRAINT `billwise_details_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billwise_details`
--

LOCK TABLES `billwise_details` WRITE;
/*!40000 ALTER TABLE `billwise_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `billwise_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commissions`
--

DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `commissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `commission_type` varchar(255) DEFAULT NULL,
  `subscription_plan` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `payout_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `commission_date` datetime DEFAULT NULL,
  `notes` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_commissions_tenant_status` (`tenant_id`,`status`),
  KEY `idx_commissions_distributor` (`distributor_id`),
  KEY `idx_commissions_salesman` (`salesman_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `distributors`
--

DROP TABLE IF EXISTS `distributors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `distributors` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `distributor_code` varchar(255) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `territory` json DEFAULT NULL,
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `payment_terms` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `distributor_code` (`distributor_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `distributors`
--

LOCK TABLES `distributors` WRITE;
/*!40000 ALTER TABLE `distributors` DISABLE KEYS */;
/*!40000 ALTER TABLE `distributors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `einvoices`
--

DROP TABLE IF EXISTS `einvoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `einvoices` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `irn` varchar(255) DEFAULT NULL,
  `ack_number` varchar(255) DEFAULT NULL,
  `ack_date` datetime DEFAULT NULL,
  `signed_invoice` text,
  `signed_qr_code` text,
  `status` enum('generated','cancelled') DEFAULT 'generated',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `retry_count` int DEFAULT '0' COMMENT 'Number of retry attempts for E-Invoice generation',
  `last_retry_at` datetime DEFAULT NULL COMMENT 'Timestamp of last retry attempt',
  `error_message` text COMMENT 'Error message from failed E-Invoice generation',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_einvoices_voucher_id` (`voucher_id`),
  KEY `idx_einvoices_irn` (`irn`),
  KEY `idx_einvoices_tenant_id` (`tenant_id`),
  CONSTRAINT `einvoices_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `einvoices`
--

LOCK TABLES `einvoices` WRITE;
/*!40000 ALTER TABLE `einvoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `einvoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `eway_bills`
--

DROP TABLE IF EXISTS `eway_bills`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `eway_bills` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ewb_number` varchar(255) DEFAULT NULL,
  `ewb_date` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `vehicle_number` varchar(255) DEFAULT NULL,
  `transporter_id` varchar(255) DEFAULT NULL,
  `status` enum('generated','cancelled','expired') DEFAULT 'generated',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `distance` int DEFAULT NULL COMMENT 'Distance in kilometers for E-Way Bill validity calculation',
  `transport_mode` enum('road','rail','air','ship') DEFAULT 'road' COMMENT 'Mode of transport',
  `vehicle_no` varchar(255) DEFAULT NULL COMMENT 'Vehicle number',
  `transporter_name` varchar(255) DEFAULT NULL COMMENT 'Name of the transporter',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_eway_bills_voucher_id` (`voucher_id`),
  KEY `idx_eway_bills_ewb_number` (`ewb_number`),
  KEY `idx_eway_bills_tenant_id` (`tenant_id`),
  CONSTRAINT `eway_bills_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `eway_bills`
--

LOCK TABLES `eway_bills` WRITE;
/*!40000 ALTER TABLE `eway_bills` DISABLE KEYS */;
/*!40000 ALTER TABLE `eway_bills` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `finbox_consents`
--

DROP TABLE IF EXISTS `finbox_consents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `finbox_consents` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `consent_given` tinyint(1) DEFAULT '0',
  `consent_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `consent_type` varchar(255) DEFAULT NULL,
  `consent_data` json DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_finbox_consents_user_id` (`user_id`),
  KEY `idx_finbox_consents_tenant_id` (`tenant_id`),
  CONSTRAINT `finbox_consents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `finbox_consents`
--

LOCK TABLES `finbox_consents` WRITE;
/*!40000 ALTER TABLE `finbox_consents` DISABLE KEYS */;
/*!40000 ALTER TABLE `finbox_consents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gstins`
--

DROP TABLE IF EXISTS `gstins`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gstins` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `gstin` varchar(15) NOT NULL,
  `legal_name` varchar(255) NOT NULL,
  `trade_name` varchar(255) DEFAULT NULL,
  `address` text,
  `state` varchar(255) DEFAULT NULL,
  `state_code` varchar(2) NOT NULL,
  `gstin_status` varchar(255) DEFAULT NULL COMMENT 'GSTIN status (active, cancelled, etc.)',
  `is_primary` tinyint(1) DEFAULT '0' COMMENT 'Whether this is the primary GSTIN for the tenant',
  `is_active` tinyint(1) DEFAULT '1',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `gstin` (`gstin`),
  UNIQUE KEY `idx_gstins_gstin` (`gstin`),
  KEY `idx_gstins_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gstins`
--

LOCK TABLES `gstins` WRITE;
/*!40000 ALTER TABLE `gstins` DISABLE KEYS */;
/*!40000 ALTER TABLE `gstins` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gstr_returns`
--

DROP TABLE IF EXISTS `gstr_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gstr_returns` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `return_type` varchar(255) NOT NULL,
  `return_period` varchar(255) NOT NULL,
  `gstin` varchar(255) NOT NULL,
  `status` enum('draft','filed','cancelled') DEFAULT 'draft',
  `filing_date` datetime DEFAULT NULL,
  `acknowledgment_number` varchar(255) DEFAULT NULL,
  `return_data` json DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_gstr_returns_unique` (`return_type`,`return_period`,`gstin`),
  KEY `idx_gstr_returns_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gstr_returns`
--

LOCK TABLES `gstr_returns` WRITE;
/*!40000 ALTER TABLE `gstr_returns` DISABLE KEYS */;
/*!40000 ALTER TABLE `gstr_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_items`
--

DROP TABLE IF EXISTS `inventory_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `item_key` varchar(300) NOT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` varchar(500) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL COMMENT 'Product barcode (EAN-13, UPC, etc.)',
  `parent_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `attributes` json DEFAULT NULL COMMENT 'JSON object for variant attributes, e.g. {"Size": "M", "Color": "Blue"}',
  `hsn_sac_code` varchar(20) DEFAULT NULL,
  `uqc` varchar(20) DEFAULT NULL,
  `gst_rate` decimal(6,2) DEFAULT NULL,
  `quantity_on_hand` decimal(15,3) DEFAULT '0.000',
  `avg_cost` decimal(15,4) DEFAULT '0.0000',
  `mrp` decimal(15,2) DEFAULT NULL COMMENT 'Maximum Retail Price',
  `selling_price` decimal(15,2) DEFAULT NULL COMMENT 'Default selling price',
  `purchase_price` decimal(15,2) DEFAULT NULL COMMENT 'Last purchase price',
  `reorder_level` decimal(15,3) DEFAULT '0.000' COMMENT 'Minimum stock level before reorder',
  `reorder_quantity` decimal(15,3) DEFAULT '0.000' COMMENT 'Quantity to reorder when stock falls below reorder level',
  `is_serialized` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Whether this item requires individual unit tracking with unique barcodes',
  `is_active` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_key` (`item_key`),
  UNIQUE KEY `barcode` (`barcode`),
  KEY `parent_item_id` (`parent_item_id`),
  CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`parent_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_items`
--

LOCK TABLES `inventory_items` WRITE;
/*!40000 ALTER TABLE `inventory_items` DISABLE KEYS */;
INSERT INTO `inventory_items` VALUES ('4f04a01c-6a09-45d5-ba70-ce7515906c34','sul','SUL','Sulphur',NULL,NULL,NULL,'25030010','KG',5.00,50000.000,50.0000,NULL,NULL,NULL,0.000,0.000,0,1,'2026-02-12 19:17:47','2026-02-12 19:18:49');
/*!40000 ALTER TABLE `inventory_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `inventory_units`
--

DROP TABLE IF EXISTS `inventory_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventory_units` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `inventory_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `unit_barcode` varchar(100) NOT NULL COMMENT 'Unique barcode for this individual unit',
  `serial_number` varchar(100) DEFAULT NULL COMMENT 'Manufacturer serial number (optional)',
  `imei_number` varchar(50) DEFAULT NULL COMMENT 'IMEI for mobile devices (optional)',
  `status` enum('in_stock','sold','damaged','returned','transferred') NOT NULL DEFAULT 'in_stock',
  `warehouse_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `purchase_voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Voucher ID when this unit was purchased',
  `purchase_date` datetime DEFAULT NULL,
  `purchase_rate` decimal(15,2) DEFAULT NULL COMMENT 'Purchase price of this specific unit',
  `sales_voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Voucher ID when this unit was sold',
  `sales_date` datetime DEFAULT NULL,
  `sales_rate` decimal(15,2) DEFAULT NULL COMMENT 'Sales price of this specific unit',
  `warranty_expiry` datetime DEFAULT NULL COMMENT 'Warranty expiry date',
  `notes` text COMMENT 'Additional notes about this unit',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unit_barcode` (`unit_barcode`),
  KEY `idx_inventory_units_item_id` (`inventory_item_id`),
  KEY `idx_inventory_units_status` (`status`),
  KEY `idx_inventory_units_warehouse_id` (`warehouse_id`),
  KEY `idx_inventory_units_purchase_voucher_id` (`purchase_voucher_id`),
  KEY `idx_inventory_units_sales_voucher_id` (`sales_voucher_id`),
  KEY `idx_inventory_units_tenant_id` (`tenant_id`),
  CONSTRAINT `fk_inventory_units_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `inventory_units_ibfk_1` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `inventory_units`
--

LOCK TABLES `inventory_units` WRITE;
/*!40000 ALTER TABLE `inventory_units` DISABLE KEYS */;
/*!40000 ALTER TABLE `inventory_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_activities`
--

DROP TABLE IF EXISTS `lead_activities`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lead_activities` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `lead_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `activity_type` varchar(255) DEFAULT NULL,
  `description` text,
  `activity_date` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_activities`
--

LOCK TABLES `lead_activities` WRITE;
/*!40000 ALTER TABLE `lead_activities` DISABLE KEYS */;
/*!40000 ALTER TABLE `lead_activities` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `leads` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `company_name` varchar(255) NOT NULL,
  `contact_person` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'new',
  `source` varchar(255) DEFAULT NULL,
  `notes` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ledgers`
--

DROP TABLE IF EXISTS `ledgers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ledgers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ledger_name` varchar(255) NOT NULL,
  `ledger_code` varchar(255) DEFAULT NULL,
  `account_group_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `opening_balance` decimal(15,2) DEFAULT '0.00',
  `opening_balance_type` enum('Dr','Cr') DEFAULT 'Dr',
  `balance_type` enum('debit','credit') DEFAULT 'debit',
  `current_balance` decimal(15,2) DEFAULT '0.00',
  `credit_limit` decimal(15,2) DEFAULT '0.00',
  `credit_days` int DEFAULT '0',
  `address` text,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `pincode` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT 'India',
  `gstin` varchar(255) DEFAULT NULL,
  `pan` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contact_number` varchar(255) DEFAULT NULL,
  `bank_name` varchar(255) DEFAULT NULL,
  `bank_account_number` varchar(100) DEFAULT NULL,
  `bank_ifsc` varchar(20) DEFAULT NULL,
  `bank_branch` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ledgers_tenant_id` (`tenant_id`),
  KEY `idx_ledgers_account_group_id` (`account_group_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ledgers`
--

LOCK TABLES `ledgers` WRITE;
/*!40000 ALTER TABLE `ledgers` DISABLE KEYS */;
INSERT INTO `ledgers` VALUES ('351bdb1a-0846-11f1-9710-38bc06e778a1','Cash on Hand','CASH-001','327f5e77-04c8-4650-b069-2c97aea98b08',0.00,'Dr','debit',15000.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 20:08:26'),('351c45c8-0846-11f1-9710-38bc06e778a1','Bank Account','BANK-001','744d269b-83e4-413d-93af-9dbaca6bb172',0.00,'Dr','debit',460000.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 20:26:53'),('351cbcf6-0846-11f1-9710-38bc06e778a1','Sales','SAL-001','c5250c23-6d47-4d26-af73-4702481f9647',0.00,'Cr','credit',1500000.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:19:49'),('351d6520-0846-11f1-9710-38bc06e778a1','Purchase','PUR-001','339f0a76-10ec-4400-b037-d067a5d6cb2e',0.00,'Dr','debit',0.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:08:25'),('351dd104-0846-11f1-9710-38bc06e778a1','Capital Account','CAP-001','909af34f-908f-4fd7-b553-bf3c04d24c23',0.00,'Cr','credit',100000.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:23:28'),('351e2df2-0846-11f1-9710-38bc06e778a1','Stock in Hand','INV-001','1ff56b9c-a0db-4b13-849c-a2aeb1d1adea',0.00,'Dr','debit',1250000.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:19:49'),('351e9c88-0846-11f1-9710-38bc06e778a1','Input CGST','CGST-INPUT','03a69152-c743-49c2-b07e-9e8d9a9de349',0.00,'Dr','debit',25000.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 20:29:51'),('351eee68-0846-11f1-9710-38bc06e778a1','Input SGST','SGST-INPUT','03a69152-c743-49c2-b07e-9e8d9a9de349',0.00,'Dr','debit',62500.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:18:49'),('351f4c0a-0846-11f1-9710-38bc06e778a1','Input IGST','IGST-INPUT','03a69152-c743-49c2-b07e-9e8d9a9de349',0.00,'Dr','debit',0.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:08:25'),('351fd620-0846-11f1-9710-38bc06e778a1','Output CGST','CGST-OUTPUT','17356155-10aa-4e7b-979d-f5b0d95b770e',0.00,'Cr','credit',0.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 20:29:51'),('35203192-0846-11f1-9710-38bc06e778a1','Output SGST','SGST-OUTPUT','17356155-10aa-4e7b-979d-f5b0d95b770e',0.00,'Cr','credit',37500.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:19:49'),('35208944-0846-11f1-9710-38bc06e778a1','Output IGST','IGST-OUTPUT','17356155-10aa-4e7b-979d-f5b0d95b770e',0.00,'Cr','credit',0.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,1,1,'','2026-02-12 19:08:25','2026-02-12 19:08:25'),('b35e0a40-51b9-4557-b176-8c17017d3f2d','Sales 1','SD-001','8674f4ac-9904-4b9e-9ae4-340c4c04923c',0.00,'Dr','debit',75000.00,0.00,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:15','2026-02-12 20:22:23'),('c61839f9-73a7-4be3-9833-c5f5631f3567','Cost of Goods Sold','COGS','fce255af-3289-4317-a59c-08c378016294',0.00,'Dr','debit',1250000.00,0.00,0,NULL,NULL,NULL,NULL,'India',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('f8502999-e157-4e1c-8733-b1a42c1e7c17','Purchase 1 ','SC-001','039dfc14-f34c-40ff-8e7a-6a887abc6a49',0.00,'Dr','credit',1500000.00,0.00,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,1,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:16:56','2026-02-12 20:26:53');
/*!40000 ALTER TABLE `ledgers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `in_app_enabled` tinyint(1) DEFAULT '1',
  `email_enabled` tinyint(1) DEFAULT '1',
  `desktop_enabled` tinyint(1) DEFAULT '1',
  `sound_enabled` tinyint(1) DEFAULT '1',
  `type_preferences` json DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `idx_notification_preferences_user_id_unique` (`user_id`),
  CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` varchar(255) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` enum('critical','high','medium','low') DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT '0',
  `read_at` datetime DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL,
  `metadata` json DEFAULT NULL,
  `sent_email` tinyint(1) DEFAULT '0',
  `sent_at` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `numbering_history`
--

DROP TABLE IF EXISTS `numbering_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `numbering_history` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `series_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Reference to numbering series',
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Reference to voucher',
  `generated_number` varchar(255) NOT NULL COMMENT 'The generated voucher number',
  `sequence_used` int NOT NULL COMMENT 'The sequence number used',
  `generated_at` datetime DEFAULT NULL COMMENT 'Timestamp when number was generated',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_numbering_history_voucher_id` (`voucher_id`),
  UNIQUE KEY `idx_numbering_history_number_tenant` (`generated_number`,`tenant_id`),
  KEY `idx_numbering_history_series_id` (`series_id`),
  KEY `idx_numbering_history_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `numbering_history`
--

LOCK TABLES `numbering_history` WRITE;
/*!40000 ALTER TABLE `numbering_history` DISABLE KEYS */;
/*!40000 ALTER TABLE `numbering_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `numbering_series`
--

DROP TABLE IF EXISTS `numbering_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `numbering_series` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Company ID for company-specific numbering sequences',
  `branch_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Optional branch association for branch-specific numbering',
  `voucher_type` varchar(255) NOT NULL COMMENT 'Type of voucher (Sales Invoice, Purchase Invoice, etc.)',
  `series_name` varchar(255) NOT NULL COMMENT 'User-friendly name for the series',
  `prefix` varchar(10) NOT NULL COMMENT 'Prefix for voucher numbers (e.g., INV, EXP)',
  `format` varchar(100) NOT NULL DEFAULT '{PREFIX}{YEAR}{MONTH}{SEQUENCE}' COMMENT 'Format string with tokens like {PREFIX}{YEAR}{MONTH}{SEQUENCE}',
  `separator` varchar(5) DEFAULT '' COMMENT 'Separator character between format tokens',
  `sequence_length` int DEFAULT '4' COMMENT 'Number of digits for sequence padding (e.g., 4 = 0001)',
  `current_sequence` int DEFAULT '0' COMMENT 'Current sequence number',
  `start_number` int DEFAULT '1' COMMENT 'Starting sequence number',
  `end_number` int DEFAULT NULL COMMENT 'Optional ending sequence number',
  `reset_frequency` enum('never','monthly','yearly','financial_year') DEFAULT 'yearly' COMMENT 'When to reset the sequence',
  `last_reset_date` datetime DEFAULT NULL COMMENT 'Last date when sequence was reset',
  `is_default` tinyint(1) DEFAULT '0' COMMENT 'Whether this is the default series for the voucher type',
  `is_active` tinyint(1) DEFAULT '1' COMMENT 'Whether this series is active',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_numbering_series_tenant_id` (`tenant_id`),
  KEY `idx_numbering_series_voucher_type` (`voucher_type`),
  KEY `idx_numbering_series_tenant_voucher_type` (`tenant_id`,`voucher_type`),
  KEY `idx_numbering_series_default` (`tenant_id`,`voucher_type`,`is_default`),
  KEY `idx_numbering_tenant_company_type` (`tenant_id`,`company_id`,`voucher_type`),
  KEY `idx_numbering_company_branch_type` (`company_id`,`branch_id`,`voucher_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `numbering_series`
--

LOCK TABLES `numbering_series` WRITE;
/*!40000 ALTER TABLE `numbering_series` DISABLE KEYS */;
INSERT INTO `numbering_series` VALUES ('33a90280-0846-11f1-9710-38bc06e778a1','finvera_trader_test',NULL,NULL,'delivery_challan','Delivery Challan Default','DC','PREFIX-SEPARATOR-YEAR-SEPARATOR-SEQUENCE','-',4,0,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:23','2026-02-12 19:08:23'),('33a96a9a-0846-11f1-9710-38bc06e778a1','finvera_trader_test',NULL,NULL,'proforma_invoice','Proforma Invoice Default','PI','PREFIX-SEPARATOR-YEAR-SEPARATOR-SEQUENCE','-',4,0,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:23','2026-02-12 19:08:23'),('3521543c-0846-11f1-9710-38bc06e778a1','',NULL,NULL,'sales_invoice','Sales Invoice Series','SI','PREFIXSEPARATORYEARSEPARATORSEQUENCE','-',3,1,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:25','2026-02-12 19:08:25'),('3521a6f8-0846-11f1-9710-38bc06e778a1','',NULL,NULL,'tax_invoice','Tax Invoice Series','TI','PREFIXSEPARATORYEARSEPARATORSEQUENCE','-',3,1,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:25','2026-02-12 19:08:25'),('3521f4aa-0846-11f1-9710-38bc06e778a1','',NULL,NULL,'bill_of_supply','Bill of Supply Series','BS','PREFIXSEPARATORYEARSEPARATORSEQUENCE','-',3,1,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:25','2026-02-12 19:08:25'),('35227eca-0846-11f1-9710-38bc06e778a1','',NULL,NULL,'retail_invoice','Retail Invoice Series','RI','PREFIXSEPARATORYEARSEPARATORSEQUENCE','-',3,1,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:25','2026-02-12 19:08:25'),('35236858-0846-11f1-9710-38bc06e778a1','',NULL,NULL,'export_invoice','Export Invoice Series','EI','PREFIXSEPARATORYEARSEPARATORSEQUENCE','-',3,1,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:25','2026-02-12 19:08:25'),('3524493a-0846-11f1-9710-38bc06e778a1','',NULL,NULL,'purchase_invoice','Purchase Invoice Series','PI','PREFIXSEPARATORYEARSEPARATORSEQUENCE','-',3,1,1,NULL,'yearly',NULL,1,1,'2026-02-12 19:08:25','2026-02-12 19:08:25');
/*!40000 ALTER TABLE `numbering_series` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payouts`
--

DROP TABLE IF EXISTS `payouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `payouts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `payout_type` varchar(255) DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `notes` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payouts`
--

LOCK TABLES `payouts` WRITE;
/*!40000 ALTER TABLE `payouts` DISABLE KEYS */;
/*!40000 ALTER TABLE `payouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_attribute_values`
--

DROP TABLE IF EXISTS `product_attribute_values`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_attribute_values` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `product_attribute_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `value` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_attribute_value_tenant_unique` (`product_attribute_id`,`value`,`tenant_id`),
  CONSTRAINT `product_attribute_values_ibfk_1` FOREIGN KEY (`product_attribute_id`) REFERENCES `product_attributes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_attribute_values`
--

LOCK TABLES `product_attribute_values` WRITE;
/*!40000 ALTER TABLE `product_attribute_values` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_attribute_values` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_attributes`
--

DROP TABLE IF EXISTS `product_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_attributes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_tenant_attribute_name_unique` (`tenant_id`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_attributes`
--

LOCK TABLES `product_attributes` WRITE;
/*!40000 ALTER TABLE `product_attributes` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referral_codes`
--

DROP TABLE IF EXISTS `referral_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referral_codes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `code` varchar(255) NOT NULL,
  `owner_type` varchar(255) DEFAULT NULL,
  `owner_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `discount_type` varchar(255) DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `free_trial_days` int DEFAULT NULL,
  `max_uses` int DEFAULT NULL,
  `current_uses` int DEFAULT '0',
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral_codes`
--

LOCK TABLES `referral_codes` WRITE;
/*!40000 ALTER TABLE `referral_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `referral_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referral_discount_configs`
--

DROP TABLE IF EXISTS `referral_discount_configs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referral_discount_configs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `discount_percentage` decimal(5,2) NOT NULL DEFAULT '10.00',
  `effective_from` datetime NOT NULL,
  `effective_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `notes` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral_discount_configs`
--

LOCK TABLES `referral_discount_configs` WRITE;
/*!40000 ALTER TABLE `referral_discount_configs` DISABLE KEYS */;
/*!40000 ALTER TABLE `referral_discount_configs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referral_rewards`
--

DROP TABLE IF EXISTS `referral_rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `referral_rewards` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `referrer_type` varchar(255) DEFAULT NULL,
  `referrer_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `referee_tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `referral_code_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `reward_type` varchar(255) DEFAULT NULL,
  `reward_amount` decimal(15,2) DEFAULT NULL,
  `reward_status` varchar(255) DEFAULT NULL,
  `subscription_plan` varchar(255) DEFAULT NULL,
  `reward_date` datetime DEFAULT NULL,
  `payment_date` datetime DEFAULT NULL,
  `notes` text,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `referral_rewards_referrer_id` (`referrer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral_rewards`
--

LOCK TABLES `referral_rewards` WRITE;
/*!40000 ALTER TABLE `referral_rewards` DISABLE KEYS */;
/*!40000 ALTER TABLE `referral_rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `salesmen`
--

DROP TABLE IF EXISTS `salesmen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `salesmen` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_code` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `territory` json DEFAULT NULL,
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `salesman_code` (`salesman_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `salesmen`
--

LOCK TABLES `salesmen` WRITE;
/*!40000 ALTER TABLE `salesmen` DISABLE KEYS */;
/*!40000 ALTER TABLE `salesmen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `SequelizeMeta`
--

DROP TABLE IF EXISTS `SequelizeMeta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `SequelizeMeta` (
  `name` varchar(255) COLLATE utf8mb3_unicode_ci NOT NULL,
  PRIMARY KEY (`name`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3 COLLATE=utf8mb3_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `SequelizeMeta`
--

LOCK TABLES `SequelizeMeta` WRITE;
/*!40000 ALTER TABLE `SequelizeMeta` DISABLE KEYS */;
INSERT INTO `SequelizeMeta` VALUES ('001-admin-master-migration.js'),('001-tenant-migration.js');
/*!40000 ALTER TABLE `SequelizeMeta` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_movements`
--

DROP TABLE IF EXISTS `stock_movements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stock_movements` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `inventory_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `warehouse_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `movement_type` enum('IN','OUT','ADJUSTMENT','TRANSFER') NOT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `rate` decimal(15,4) DEFAULT '0.0000',
  `amount` decimal(15,2) DEFAULT '0.00',
  `reference_number` varchar(255) DEFAULT NULL,
  `narration` text,
  `movement_date` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_stock_movements_item_id` (`inventory_item_id`),
  KEY `idx_stock_movements_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_movements`
--

LOCK TABLES `stock_movements` WRITE;
/*!40000 ALTER TABLE `stock_movements` DISABLE KEYS */;
INSERT INTO `stock_movements` VALUES ('66eedc86-2de1-418c-9946-95a975af301c','4f04a01c-6a09-45d5-ba70-ce7515906c34',NULL,'3824478e-d17e-43d9-8779-cb37429a78ac','OUT',-25000.000,50.0000,-1250000.00,'SI2026020001','Sale to Customer','2026-02-12 00:00:00','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('eb0fd579-2356-4a9d-8fd6-f79166db1e85','4f04a01c-6a09-45d5-ba70-ce7515906c34',NULL,'eccc41cc-dcd6-4839-89fa-df289b5a3266','IN',50000.000,50.0000,2500000.00,'PI2026020001','Purchase from Supplier','2026-02-12 00:00:00','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:18:49','2026-02-12 19:18:49');
/*!40000 ALTER TABLE `stock_movements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_plans`
--

DROP TABLE IF EXISTS `subscription_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_plans` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `plan_code` varchar(255) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `description` text,
  `billing_cycle` varchar(255) DEFAULT NULL,
  `base_price` decimal(15,2) NOT NULL,
  `discounted_price` decimal(15,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `trial_days` int DEFAULT '0',
  `max_users` int DEFAULT NULL,
  `max_invoices_per_month` int DEFAULT NULL,
  `max_companies` int DEFAULT '1',
  `storage_limit_gb` int DEFAULT NULL,
  `features` json DEFAULT NULL,
  `salesman_commission_rate` decimal(5,2) DEFAULT NULL,
  `distributor_commission_rate` decimal(5,2) DEFAULT NULL,
  `renewal_commission_rate` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `is_visible` tinyint(1) DEFAULT '1',
  `is_featured` tinyint(1) DEFAULT '0',
  `display_order` int DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `plan_code` (`plan_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_plans`
--

LOCK TABLES `subscription_plans` WRITE;
/*!40000 ALTER TABLE `subscription_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_agent_reviews`
--

DROP TABLE IF EXISTS `support_agent_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_agent_reviews` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ticket_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `agent_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Support agent being reviewed',
  `client_name` varchar(100) NOT NULL,
  `client_email` varchar(255) NOT NULL,
  `rating` int NOT NULL,
  `feedback` text,
  `service_quality` int DEFAULT NULL,
  `response_time` int DEFAULT NULL,
  `problem_resolution` int DEFAULT NULL,
  `would_recommend` tinyint(1) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_id` (`ticket_id`),
  UNIQUE KEY `idx_support_agent_reviews_ticket_id` (`ticket_id`),
  KEY `idx_support_agent_reviews_agent_id` (`agent_id`),
  KEY `idx_support_agent_reviews_rating` (`rating`),
  CONSTRAINT `support_agent_reviews_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_agent_reviews`
--

LOCK TABLES `support_agent_reviews` WRITE;
/*!40000 ALTER TABLE `support_agent_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_agent_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `support_tickets` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ticket_number` varchar(20) NOT NULL COMMENT 'Auto-generated ticket number (e.g., TKT-2024-0001)',
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tenant who raised the ticket (null for non-tenant users)',
  `client_name` varchar(100) NOT NULL,
  `client_email` varchar(255) NOT NULL,
  `client_phone` varchar(15) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('technical','billing','feature_request','bug_report','general','other') DEFAULT 'general',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('open','assigned','in_progress','waiting_client','resolved','closed') DEFAULT 'open',
  `assigned_to` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Support agent assigned to this ticket',
  `attachments` json DEFAULT NULL COMMENT 'Array of attachment file paths',
  `resolution_notes` text,
  `resolved_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  UNIQUE KEY `idx_support_tickets_number` (`ticket_number`),
  KEY `idx_support_tickets_tenant_id` (`tenant_id`),
  KEY `idx_support_tickets_status` (`status`),
  KEY `idx_support_tickets_assigned_to` (`assigned_to`),
  KEY `idx_support_tickets_client_email` (`client_email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `targets`
--

DROP TABLE IF EXISTS `targets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `targets` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `target_type` varchar(255) DEFAULT NULL,
  `target_period` varchar(255) DEFAULT NULL,
  `target_value` decimal(15,2) NOT NULL,
  `achieved_value` decimal(15,2) DEFAULT '0.00',
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `targets`
--

LOCK TABLES `targets` WRITE;
/*!40000 ALTER TABLE `targets` DISABLE KEYS */;
/*!40000 ALTER TABLE `targets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tds_details`
--

DROP TABLE IF EXISTS `tds_details`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tds_details` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tds_section` varchar(255) NOT NULL,
  `tds_rate` decimal(6,2) NOT NULL,
  `tds_amount` decimal(15,2) DEFAULT '0.00',
  `quarter` varchar(255) DEFAULT NULL,
  `financial_year` varchar(255) DEFAULT NULL,
  `deductee_pan` varchar(255) DEFAULT NULL,
  `certificate_number` varchar(255) DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deductee_name` varchar(255) DEFAULT NULL COMMENT 'Name of the deductee',
  `certificate_date` datetime DEFAULT NULL COMMENT 'Date of TDS certificate issuance',
  `taxable_amount` decimal(15,2) DEFAULT '0.00' COMMENT 'Taxable amount on which TDS is calculated',
  PRIMARY KEY (`id`),
  KEY `idx_tds_details_voucher_id` (`voucher_id`),
  KEY `idx_tds_details_tenant_id` (`tenant_id`),
  CONSTRAINT `tds_details_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tds_details`
--

LOCK TABLES `tds_details` WRITE;
/*!40000 ALTER TABLE `tds_details` DISABLE KEYS */;
/*!40000 ALTER TABLE `tds_details` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_messages`
--

DROP TABLE IF EXISTS `ticket_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ticket_messages` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ticket_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sender_type` enum('client','agent','system') NOT NULL,
  `sender_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'User ID if sender is agent, null for client/system',
  `sender_name` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `attachments` json DEFAULT NULL COMMENT 'Array of attachment file paths',
  `is_internal` tinyint(1) DEFAULT '0' COMMENT 'Internal notes visible only to agents',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_messages_ticket_id` (`ticket_id`),
  KEY `idx_ticket_messages_sender_id` (`sender_id`),
  CONSTRAINT `ticket_messages_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_messages`
--

LOCK TABLES `ticket_messages` WRITE;
/*!40000 ALTER TABLE `ticket_messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL COMMENT 'Password hash (null for OAuth users)',
  `google_id` varchar(255) DEFAULT NULL COMMENT 'Google OAuth user ID',
  `name` varchar(255) DEFAULT NULL,
  `role` varchar(255) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `google_id` (`google_id`),
  UNIQUE KEY `idx_users_google_id` (`google_id`),
  KEY `users_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('3548431c-0846-11f1-9710-38bc06e778a1','9894a8b8-4013-4a46-af08-fdba36329ea8','info@abctrading.com','$2b$10$EcSPt91.uH7WV8jUSA1VEehRy6pxrAc0hoqcyI6MopI.EjY6MvqIG',NULL,'Admin User','tenant_admin',NULL,NULL,1,NULL,'2026-02-12 19:08:25','2026-02-12 19:08:25');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher_items`
--

DROP TABLE IF EXISTS `voucher_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `inventory_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` varchar(500) DEFAULT NULL,
  `item_description` varchar(255) NOT NULL,
  `quantity` decimal(15,3) DEFAULT '1.000',
  `uqc` varchar(20) DEFAULT NULL,
  `rate` decimal(15,4) NOT NULL,
  `discount_percentage` decimal(6,2) DEFAULT '0.00',
  `discount_amount` decimal(15,2) DEFAULT '0.00',
  `taxable_amount` decimal(15,2) DEFAULT '0.00',
  `amount` decimal(15,2) NOT NULL,
  `hsn_sac_code` varchar(255) DEFAULT NULL,
  `gst_rate` decimal(6,2) DEFAULT '0.00',
  `cgst_amount` decimal(15,2) DEFAULT '0.00',
  `sgst_amount` decimal(15,2) DEFAULT '0.00',
  `igst_amount` decimal(15,2) DEFAULT '0.00',
  `cess_amount` decimal(15,2) DEFAULT '0.00',
  `variant_attributes` json DEFAULT NULL COMMENT 'Variant attributes for the item',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_voucher_items_voucher_id` (`voucher_id`),
  KEY `idx_voucher_items_tenant_id` (`tenant_id`),
  CONSTRAINT `voucher_items_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher_items`
--

LOCK TABLES `voucher_items` WRITE;
/*!40000 ALTER TABLE `voucher_items` DISABLE KEYS */;
INSERT INTO `voucher_items` VALUES ('958fa676-e831-4ed1-afad-b5d297335e40','eccc41cc-dcd6-4839-89fa-df289b5a3266','4f04a01c-6a09-45d5-ba70-ce7515906c34',NULL,'SUL',NULL,'Sulphur',50000.000,NULL,50.0000,0.00,0.00,2500000.00,2500000.00,'25030010',5.00,62500.00,62500.00,0.00,0.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:18:49','2026-02-12 19:18:49'),('e95bf8a3-4660-4f9f-8325-4c8997a49027','3824478e-d17e-43d9-8779-cb37429a78ac','4f04a01c-6a09-45d5-ba70-ce7515906c34',NULL,'SUL','Sulphur','Sulphur',25000.000,NULL,60.0000,0.00,0.00,0.00,1500000.00,'25030010',5.00,37500.00,37500.00,0.00,0.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49');
/*!40000 ALTER TABLE `voucher_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `voucher_ledger_entries`
--

DROP TABLE IF EXISTS `voucher_ledger_entries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `voucher_ledger_entries` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ledger_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `debit_amount` decimal(15,2) DEFAULT '0.00',
  `credit_amount` decimal(15,2) DEFAULT '0.00',
  `narration` text,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_voucher_ledger_entries_voucher_id` (`voucher_id`),
  KEY `idx_voucher_ledger_entries_ledger_id` (`ledger_id`),
  KEY `idx_voucher_ledger_entries_tenant_id` (`tenant_id`),
  CONSTRAINT `voucher_ledger_entries_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `voucher_ledger_entries`
--

LOCK TABLES `voucher_ledger_entries` WRITE;
/*!40000 ALTER TABLE `voucher_ledger_entries` DISABLE KEYS */;
INSERT INTO `voucher_ledger_entries` VALUES ('13aebdd7-a513-4624-976b-ce6c84e5b0d3','3824478e-d17e-43d9-8779-cb37429a78ac','351cbcf6-0846-11f1-9710-38bc06e778a1',0.00,1500000.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('13fd3ea2-f2f1-4b51-bd7b-b397c442c670','eccc41cc-dcd6-4839-89fa-df289b5a3266','351eee68-0846-11f1-9710-38bc06e778a1',62500.00,0.00,'SGST Input','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:18:49','2026-02-12 19:18:49'),('32643e7e-c6e0-4bfb-95b8-bf58a4f6433c','58c01eb9-fc4d-4cc4-b6a7-93f8350c0fea','351c45c8-0846-11f1-9710-38bc06e778a1',100000.00,0.00,'Receipt via bank','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:23:28','2026-02-12 19:23:28'),('36e38be4-5518-4086-a07a-c41580949d9b','37a9c237-af6d-49c7-a190-7a88f4c5a34c','b35e0a40-51b9-4557-b176-8c17017d3f2d',0.00,1500000.00,'Receipt received','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:22:23','2026-02-12 20:22:23'),('387292d5-5cfd-4e44-9399-9a5e19c2eb37','3824478e-d17e-43d9-8779-cb37429a78ac','351e2df2-0846-11f1-9710-38bc06e778a1',0.00,1250000.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('44ffeffa-78fa-4e51-afe3-56021a40459d','3824478e-d17e-43d9-8779-cb37429a78ac','351fd620-0846-11f1-9710-38bc06e778a1',0.00,37500.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('52a303e5-81e4-4fea-9c8d-3060a11fde1c','eccc41cc-dcd6-4839-89fa-df289b5a3266','351e2df2-0846-11f1-9710-38bc06e778a1',2500000.00,0.00,'Inventory purchase','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:18:49','2026-02-12 19:18:49'),('56906d34-9b7c-4b4e-aa0f-25141844bb8c','3824478e-d17e-43d9-8779-cb37429a78ac','35203192-0846-11f1-9710-38bc06e778a1',0.00,37500.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('66c87a19-e95b-4735-997c-d9e18fdf437a','1b5c037c-401c-4a34-839a-204e619ee02f','f8502999-e157-4e1c-8733-b1a42c1e7c17',1125000.00,0.00,'Payment made','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:26:53','2026-02-12 20:26:53'),('67e40ad4-f729-4259-8ced-c1b5f3ca3e47','ffa5bf3e-3e88-471c-bd30-dafeb8de69e1','351bdb1a-0846-11f1-9710-38bc06e778a1',15000.00,0.00,'Transfer from Bank Account','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:08:26','2026-02-12 20:08:26'),('69e9a33b-ceec-448a-b749-bd196e931b0b','3824478e-d17e-43d9-8779-cb37429a78ac','c61839f9-73a7-4be3-9833-c5f5631f3567',1250000.00,0.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('96131313-3aae-4cec-ad8f-16660e2da1c0','ffa5bf3e-3e88-471c-bd30-dafeb8de69e1','351c45c8-0846-11f1-9710-38bc06e778a1',0.00,15000.00,'Transfer to Cash on Hand','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:08:26','2026-02-12 20:08:26'),('9d4eb21f-e19d-499b-9401-83b02c0f8d0a','f36d5951-7af9-4c56-aa03-931a2449cabf','351e9c88-0846-11f1-9710-38bc06e778a1',0.00,37500.00,'Credit entry','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:29:51','2026-02-12 20:29:51'),('aee14f6a-e00e-4f90-a15f-a3137e7247bb','eccc41cc-dcd6-4839-89fa-df289b5a3266','f8502999-e157-4e1c-8733-b1a42c1e7c17',0.00,2625000.00,'Purchase invoice from Purchase 1 ','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:18:49','2026-02-12 19:18:49'),('b0735856-9fe5-4200-a973-cdddcc6ee638','58c01eb9-fc4d-4cc4-b6a7-93f8350c0fea','351dd104-0846-11f1-9710-38bc06e778a1',0.00,100000.00,'Receipt received','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:23:28','2026-02-12 19:23:28'),('bc7cbc9a-20a8-4904-85d3-f23c7fe70248','eccc41cc-dcd6-4839-89fa-df289b5a3266','351e9c88-0846-11f1-9710-38bc06e778a1',62500.00,0.00,'CGST Input','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:18:49','2026-02-12 19:18:49'),('c582cab8-b1b0-42b3-b40f-572cdf976d98','1b5c037c-401c-4a34-839a-204e619ee02f','351c45c8-0846-11f1-9710-38bc06e778a1',0.00,1125000.00,'Payment via bank','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:26:53','2026-02-12 20:26:53'),('d69a752a-720d-487b-a687-618abd2f13df','37a9c237-af6d-49c7-a190-7a88f4c5a34c','351c45c8-0846-11f1-9710-38bc06e778a1',1500000.00,0.00,'Receipt via bank','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:22:23','2026-02-12 20:22:23'),('e8d8a344-9e5f-432a-ae5b-7f572095ead0','3824478e-d17e-43d9-8779-cb37429a78ac','b35e0a40-51b9-4557-b176-8c17017d3f2d',1575000.00,0.00,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 19:19:49','2026-02-12 19:19:49'),('ec92ee8a-9bc1-49e1-b9f2-71c35b4ab234','f36d5951-7af9-4c56-aa03-931a2449cabf','351fd620-0846-11f1-9710-38bc06e778a1',37500.00,0.00,'Debit entry','9894a8b8-4013-4a46-af08-fdba36329ea8','2026-02-12 20:29:51','2026-02-12 20:29:51');
/*!40000 ALTER TABLE `voucher_ledger_entries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vouchers`
--

DROP TABLE IF EXISTS `vouchers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vouchers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_number` varchar(255) NOT NULL,
  `voucher_type` varchar(255) NOT NULL,
  `voucher_date` datetime NOT NULL,
  `party_ledger_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `narration` text,
  `status` enum('draft','posted','cancelled') DEFAULT 'draft',
  `reference_number` varchar(255) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `currency_code` varchar(3) DEFAULT 'INR' COMMENT 'Currency code for foreign currency invoices (ISO 4217 format: USD, EUR, GBP, etc.)',
  `exchange_rate` decimal(15,6) DEFAULT '1.000000' COMMENT 'Exchange rate to convert foreign currency to base currency (INR)',
  `shipping_bill_number` varchar(50) DEFAULT NULL COMMENT 'Shipping bill number for export invoices',
  `shipping_bill_date` datetime DEFAULT NULL COMMENT 'Date of shipping bill for export invoices',
  `port_of_loading` varchar(100) DEFAULT NULL COMMENT 'Port from which goods are shipped for export',
  `destination_country` varchar(100) DEFAULT NULL COMMENT 'Destination country for export invoices',
  `has_lut` tinyint(1) DEFAULT '0' COMMENT 'Whether LUT (Letter of Undertaking) is present for zero-rated GST on exports',
  `purpose` enum('job_work','stock_transfer','sample') DEFAULT NULL COMMENT 'Purpose of delivery challan (job_work, stock_transfer, sample)',
  `converted_to_invoice_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Reference to sales invoice if this voucher was converted',
  `validity_period` int DEFAULT NULL COMMENT 'Number of days the proforma invoice is valid (e.g., 30, 60, 90 days)',
  `valid_until` datetime DEFAULT NULL COMMENT 'Calculated date when the proforma invoice expires (voucher_date + validity_period)',
  `supplier_invoice_number` varchar(100) DEFAULT NULL COMMENT 'Supplier invoice number for purchase invoices',
  `supplier_invoice_date` datetime DEFAULT NULL COMMENT 'Supplier invoice date for purchase invoices',
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Company ID for explicit company-level isolation',
  `branch_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Branch ID for explicit branch-level isolation',
  `tenant_id` varchar(255) NOT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_vouchers_number_tenant` (`voucher_number`,`tenant_id`),
  KEY `idx_vouchers_tenant_id` (`tenant_id`),
  KEY `idx_vouchers_converted_to_invoice_id` (`converted_to_invoice_id`),
  KEY `idx_vouchers_purpose` (`purpose`),
  KEY `idx_vouchers_valid_until` (`valid_until`),
  KEY `idx_vouchers_tenant_company` (`tenant_id`,`company_id`),
  KEY `idx_vouchers_tenant_company_branch` (`tenant_id`,`company_id`,`branch_id`),
  KEY `idx_vouchers_company_date` (`company_id`,`voucher_date`),
  KEY `idx_vouchers_branch_date` (`branch_id`,`voucher_date`),
  CONSTRAINT `vouchers_ibfk_1` FOREIGN KEY (`converted_to_invoice_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vouchers`
--

LOCK TABLES `vouchers` WRITE;
/*!40000 ALTER TABLE `vouchers` DISABLE KEYS */;
INSERT INTO `vouchers` VALUES ('1b5c037c-401c-4a34-839a-204e619ee02f','PAY2026020001','Payment','2026-02-12 00:00:00','f8502999-e157-4e1c-8733-b1a42c1e7c17',1125000.00,'','posted',NULL,NULL,'INR',1.000000,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8',NULL,'2026-02-12 20:26:53','2026-02-12 20:26:53'),('37a9c237-af6d-49c7-a190-7a88f4c5a34c','REC2026020002','Receipt','2026-02-12 00:00:00','b35e0a40-51b9-4557-b176-8c17017d3f2d',1500000.00,'','posted',NULL,NULL,'INR',1.000000,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8',NULL,'2026-02-12 20:22:23','2026-02-12 20:22:23'),('3824478e-d17e-43d9-8779-cb37429a78ac','SI2026020001','sales_invoice','2026-02-12 00:00:00','b35e0a40-51b9-4557-b176-8c17017d3f2d',1575000.00,NULL,'posted',NULL,NULL,'INR',1.000000,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8',NULL,'2026-02-12 19:19:49','2026-02-12 19:19:49'),('58c01eb9-fc4d-4cc4-b6a7-93f8350c0fea','REC2026020001','Receipt','2026-02-12 00:00:00','351dd104-0846-11f1-9710-38bc06e778a1',100000.00,'','posted',NULL,NULL,'INR',1.000000,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8',NULL,'2026-02-12 19:23:28','2026-02-12 19:23:28'),('eccc41cc-dcd6-4839-89fa-df289b5a3266','PI2026020001','purchase_invoice','2026-02-12 00:00:00','f8502999-e157-4e1c-8733-b1a42c1e7c17',2625000.00,NULL,'posted',NULL,NULL,'INR',1.000000,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,'123','2026-02-11 00:00:00',NULL,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8',NULL,'2026-02-12 19:18:49','2026-02-12 19:18:49'),('f36d5951-7af9-4c56-aa03-931a2449cabf','JV2026020001','journal','2026-02-12 00:00:00',NULL,37500.00,'','posted',NULL,NULL,'INR',1.000000,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8',NULL,'2026-02-12 20:29:51','2026-02-12 20:29:51'),('ffa5bf3e-3e88-471c-bd30-dafeb8de69e1','CON2026020001','contra','2026-02-12 00:00:00',NULL,15000.00,'','posted',NULL,NULL,'INR',1.000000,NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'9894a8b8-4013-4a46-af08-fdba36329ea8',NULL,'2026-02-12 19:57:37','2026-02-12 19:57:37');
/*!40000 ALTER TABLE `vouchers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouse_stocks`
--

DROP TABLE IF EXISTS `warehouse_stocks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouse_stocks` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `warehouse_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `inventory_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` decimal(15,3) DEFAULT '0.000',
  `avg_cost` decimal(15,4) DEFAULT '0.0000',
  `last_updated` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_warehouse_stocks_unique` (`warehouse_id`,`inventory_item_id`),
  KEY `idx_warehouse_stocks_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouse_stocks`
--

LOCK TABLES `warehouse_stocks` WRITE;
/*!40000 ALTER TABLE `warehouse_stocks` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouse_stocks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `warehouses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `warehouse_name` varchar(255) NOT NULL,
  `warehouse_code` varchar(255) DEFAULT NULL,
  `address` text,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `pincode` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_warehouses_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-02-13  2:26:25

