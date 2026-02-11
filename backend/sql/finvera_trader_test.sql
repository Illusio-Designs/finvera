-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 11, 2026 at 02:59 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `finvera_trader_test`
--

-- --------------------------------------------------------

--
-- Table structure for table `audit_logs`
--

CREATE TABLE `audit_logs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `table_name` varchar(255) NOT NULL,
  `record_id` varchar(255) NOT NULL,
  `action` enum('CREATE','UPDATE','DELETE') NOT NULL,
  `old_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`old_values`)),
  `new_values` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`new_values`)),
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `ip_address` varchar(255) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `billwise_details`
--

CREATE TABLE `billwise_details` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ledger_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `bill_number` varchar(255) DEFAULT NULL,
  `bill_date` datetime DEFAULT NULL,
  `bill_amount` decimal(15,2) DEFAULT 0.00,
  `pending_amount` decimal(15,2) DEFAULT 0.00,
  `is_fully_paid` tinyint(1) DEFAULT 0,
  `due_date` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bill_allocations`
--

CREATE TABLE `bill_allocations` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `payment_voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `bill_detail_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `allocated_amount` decimal(15,2) DEFAULT 0.00,
  `allocation_date` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `einvoices`
--

CREATE TABLE `einvoices` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `irn` varchar(255) DEFAULT NULL,
  `ack_number` varchar(255) DEFAULT NULL,
  `ack_date` datetime DEFAULT NULL,
  `signed_invoice` text DEFAULT NULL,
  `signed_qr_code` text DEFAULT NULL,
  `status` enum('generated','cancelled') DEFAULT 'generated',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `retry_count` int(11) DEFAULT 0 COMMENT 'Number of retry attempts for E-Invoice generation',
  `last_retry_at` datetime DEFAULT NULL COMMENT 'Timestamp of last retry attempt',
  `error_message` text DEFAULT NULL COMMENT 'Error message from failed E-Invoice generation'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `eway_bills`
--

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
  `distance` int(11) DEFAULT NULL COMMENT 'Distance in kilometers for E-Way Bill validity calculation',
  `transport_mode` enum('road','rail','air','ship') DEFAULT 'road' COMMENT 'Mode of transport',
  `vehicle_no` varchar(255) DEFAULT NULL COMMENT 'Vehicle number',
  `transporter_name` varchar(255) DEFAULT NULL COMMENT 'Name of the transporter'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finbox_consents`
--

CREATE TABLE `finbox_consents` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `consent_given` tinyint(1) DEFAULT 0,
  `consent_date` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `consent_type` varchar(255) DEFAULT NULL,
  `consent_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`consent_data`)),
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `gstins`
--

CREATE TABLE `gstins` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `gstin` varchar(15) NOT NULL,
  `legal_name` varchar(255) NOT NULL,
  `trade_name` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `state_code` varchar(2) NOT NULL,
  `gstin_status` varchar(255) DEFAULT NULL COMMENT 'GSTIN status (active, cancelled, etc.)',
  `is_primary` tinyint(1) DEFAULT 0 COMMENT 'Whether this is the primary GSTIN for the tenant',
  `is_active` tinyint(1) DEFAULT 1,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gstins`
--

INSERT INTO `gstins` (`id`, `gstin`, `legal_name`, `trade_name`, `address`, `state`, `state_code`, `gstin_status`, `is_primary`, `is_active`, `tenant_id`, `createdAt`, `updatedAt`) VALUES
('8dab31fb-0b68-49c2-bc37-8080addebdfd', '27AABCT1234A1Z5', 'ABC Trading Company', 'ABC Trading Company', '123 Business Park, Andheri East', 'Maharashtra', '27', 'active', 1, 1, '77f19448-c378-46c5-9c11-0d00f85f06c2', '2026-02-11 08:27:21', '2026-02-11 08:27:21');

-- --------------------------------------------------------

--
-- Table structure for table `gstr_returns`
--

CREATE TABLE `gstr_returns` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `return_type` varchar(255) NOT NULL,
  `return_period` varchar(255) NOT NULL,
  `gstin` varchar(255) NOT NULL,
  `status` enum('draft','filed','cancelled') DEFAULT 'draft',
  `filing_date` datetime DEFAULT NULL,
  `acknowledgment_number` varchar(255) DEFAULT NULL,
  `return_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`return_data`)),
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `inventory_items`
--

CREATE TABLE `inventory_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `item_key` varchar(300) NOT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` varchar(500) NOT NULL,
  `barcode` varchar(100) DEFAULT NULL COMMENT 'Product barcode (EAN-13, UPC, etc.)',
  `parent_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON object for variant attributes, e.g. {"Size": "M", "Color": "Blue"}' CHECK (json_valid(`attributes`)),
  `hsn_sac_code` varchar(20) DEFAULT NULL,
  `uqc` varchar(20) DEFAULT NULL,
  `gst_rate` decimal(6,2) DEFAULT NULL,
  `quantity_on_hand` decimal(15,3) DEFAULT 0.000,
  `avg_cost` decimal(15,4) DEFAULT 0.0000,
  `mrp` decimal(15,2) DEFAULT NULL COMMENT 'Maximum Retail Price',
  `selling_price` decimal(15,2) DEFAULT NULL COMMENT 'Default selling price',
  `purchase_price` decimal(15,2) DEFAULT NULL COMMENT 'Last purchase price',
  `reorder_level` decimal(15,3) DEFAULT 0.000 COMMENT 'Minimum stock level before reorder',
  `reorder_quantity` decimal(15,3) DEFAULT 0.000 COMMENT 'Quantity to reorder when stock falls below reorder level',
  `is_serialized` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether this item requires individual unit tracking with unique barcodes',
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `inventory_items`
--

INSERT INTO `inventory_items` (`id`, `item_key`, `item_code`, `item_name`, `barcode`, `parent_item_id`, `attributes`, `hsn_sac_code`, `uqc`, `gst_rate`, `quantity_on_hand`, `avg_cost`, `mrp`, `selling_price`, `purchase_price`, `reorder_level`, `reorder_quantity`, `is_serialized`, `is_active`, `createdAt`, `updatedAt`) VALUES
('3b3f7213-0c44-4d82-800c-7b0a2838629e', 'sul', 'Sul', 'Sulphur', NULL, NULL, NULL, '25030010', 'KG', 5.00, 24580.000, 53.0000, NULL, NULL, NULL, 0.000, 0.000, 0, 1, '2026-02-11 08:28:51', '2026-02-11 08:48:55');

-- --------------------------------------------------------

--
-- Table structure for table `inventory_units`
--

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
  `notes` text DEFAULT NULL COMMENT 'Additional notes about this unit',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ledgers`
--

CREATE TABLE `ledgers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ledger_name` varchar(255) NOT NULL,
  `ledger_code` varchar(255) DEFAULT NULL,
  `account_group_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `opening_balance` decimal(15,2) DEFAULT 0.00,
  `opening_balance_type` enum('Dr','Cr') DEFAULT 'Dr',
  `balance_type` enum('debit','credit') DEFAULT 'debit',
  `current_balance` decimal(15,2) DEFAULT 0.00,
  `credit_limit` decimal(15,2) DEFAULT 0.00,
  `credit_days` int(11) DEFAULT 0,
  `address` text DEFAULT NULL,
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
  `is_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ledgers`
--

INSERT INTO `ledgers` (`id`, `ledger_name`, `ledger_code`, `account_group_id`, `opening_balance`, `opening_balance_type`, `balance_type`, `current_balance`, `credit_limit`, `credit_days`, `address`, `city`, `state`, `pincode`, `country`, `gstin`, `pan`, `email`, `contact_number`, `bank_name`, `bank_account_number`, `bank_ifsc`, `bank_branch`, `is_default`, `is_active`, `tenant_id`, `createdAt`, `updatedAt`) VALUES
('462bf187-e8dc-4d9d-9ecd-30d7edc61032', 'Test purchase ', 'SC-001', '039dfc14-f34c-40ff-8e7a-6a887abc6a49', 0.00, 'Dr', 'credit', 2589014.00, 0.00, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:29:27', '2026-02-11 13:54:20'),
('630d181d-eba8-46cb-ab51-78b72806cfbc', 'Test sales ', 'SD-001', '8674f4ac-9904-4b9e-9ae4-340c4c04923c', 0.00, 'Dr', 'debit', 1197000.00, 0.00, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:29:39', '2026-02-11 11:59:56'),
('7c5842a2-0723-11f1-90a3-9c1aab0c3c09', 'Cash on Hand', 'CASH-001', '327f5e77-04c8-4650-b069-2c97aea98b08', 0.00, 'Dr', 'debit', 10000.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '', '2026-02-11 08:27:21', '2026-02-11 13:54:20'),
('7c58b633-0723-11f1-90a3-9c1aab0c3c09', 'Bank Account', 'BANK-001', '744d269b-83e4-413d-93af-9dbaca6bb172', 0.00, 'Dr', 'debit', 0.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '', '2026-02-11 08:27:21', '2026-02-11 13:54:04'),
('7c594e18-0723-11f1-90a3-9c1aab0c3c09', 'Sales', 'SAL-001', 'c5250c23-6d47-4d26-af73-4702481f9647', 0.00, 'Cr', 'credit', 1140000.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:27:21', '2026-02-11 11:59:56'),
('7c59c731-0723-11f1-90a3-9c1aab0c3c09', 'Purchase', 'PUR-001', '339f0a76-10ec-4400-b037-d067a5d6cb2e', 0.00, 'Dr', 'debit', 2362740.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '', '2026-02-11 08:27:21', '2026-02-11 11:59:56'),
('7c5a5e30-0723-11f1-90a3-9c1aab0c3c09', 'Rushikesh', 'CAP-001', '909af34f-908f-4fd7-b553-bf3c04d24c23', 0.00, 'Cr', 'credit', 0.00, 0.00, 0, '', '', '', '', 'India', '', '', '', NULL, NULL, NULL, NULL, NULL, 1, 1, '', '2026-02-11 08:27:21', '2026-02-11 11:59:56'),
('7c5b3b50-0723-11f1-90a3-9c1aab0c3c09', 'Stock in Hand', 'INV-001', '1ff56b9c-a0db-4b13-849c-a2aeb1d1adea', 0.00, 'Dr', 'debit', 1302740.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:27:21', '2026-02-11 11:59:56'),
('7c5c03a8-0723-11f1-90a3-9c1aab0c3c09', 'CGST', 'CGST-001', '17356155-10aa-4e7b-979d-f5b0d95b770e', 0.00, 'Cr', 'debit', 89637.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '', '2026-02-11 08:27:21', '2026-02-11 11:59:56'),
('7c5c862c-0723-11f1-90a3-9c1aab0c3c09', 'SGST', 'SGST-001', '17356155-10aa-4e7b-979d-f5b0d95b770e', 0.00, 'Cr', 'debit', 89637.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '', '2026-02-11 08:27:21', '2026-02-11 11:59:56'),
('7c5d0520-0723-11f1-90a3-9c1aab0c3c09', 'IGST', 'IGST-001', '17356155-10aa-4e7b-979d-f5b0d95b770e', 0.00, 'Cr', 'credit', 0.00, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 1, '', '2026-02-11 08:27:21', '2026-02-11 11:59:56'),
('de0d5df3-7c71-4f26-9dd0-a2283169ad7a', 'Round Off', 'ROUND_OFF', '02f1c166-0f0f-4179-b854-c704b68e9ab4', 0.00, 'Dr', 'debit', 0.20, 0.00, 0, NULL, NULL, NULL, NULL, 'India', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, 1, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:30:11', '2026-02-11 11:59:56');

-- --------------------------------------------------------

--
-- Table structure for table `numbering_history`
--

CREATE TABLE `numbering_history` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `series_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Reference to numbering series',
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Reference to voucher',
  `generated_number` varchar(255) NOT NULL COMMENT 'The generated voucher number',
  `sequence_used` int(11) NOT NULL COMMENT 'The sequence number used',
  `generated_at` datetime DEFAULT NULL COMMENT 'Timestamp when number was generated',
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `numbering_series`
--

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
  `sequence_length` int(11) DEFAULT 4 COMMENT 'Number of digits for sequence padding (e.g., 4 = 0001)',
  `current_sequence` int(11) DEFAULT 0 COMMENT 'Current sequence number',
  `start_number` int(11) DEFAULT 1 COMMENT 'Starting sequence number',
  `end_number` int(11) DEFAULT NULL COMMENT 'Optional ending sequence number',
  `reset_frequency` enum('never','monthly','yearly','financial_year') DEFAULT 'yearly' COMMENT 'When to reset the sequence',
  `last_reset_date` datetime DEFAULT NULL COMMENT 'Last date when sequence was reset',
  `is_default` tinyint(1) DEFAULT 0 COMMENT 'Whether this is the default series for the voucher type',
  `is_active` tinyint(1) DEFAULT 1 COMMENT 'Whether this series is active',
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `numbering_series`
--

INSERT INTO `numbering_series` (`id`, `tenant_id`, `company_id`, `branch_id`, `voucher_type`, `series_name`, `prefix`, `format`, `separator`, `sequence_length`, `current_sequence`, `start_number`, `end_number`, `reset_frequency`, `last_reset_date`, `is_default`, `is_active`, `createdAt`, `updatedAt`) VALUES
('0bb319ea-cd5a-4cbc-89d8-bc6253202c0a', '9894a8b8-4013-4a46-af08-fdba36329ea8', NULL, NULL, 'sales_order', 'Sales Order Series', 'SO', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 4, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:25', '2026-02-11 08:27:25'),
('7c49e169-0723-11f1-90a3-9c1aab0c3c09', 'finvera_trader_test', NULL, NULL, 'delivery_challan', 'Delivery Challan Default', 'DC', 'PREFIX-SEPARATOR-YEAR-SEPARATOR-SEQUENCE', '-', 4, 0, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('7c4af4e1-0723-11f1-90a3-9c1aab0c3c09', 'finvera_trader_test', NULL, NULL, 'proforma_invoice', 'Proforma Invoice Default', 'PI', 'PREFIX-SEPARATOR-YEAR-SEPARATOR-SEQUENCE', '-', 4, 0, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('7c5dfb62-0723-11f1-90a3-9c1aab0c3c09', '', NULL, NULL, 'sales_invoice', 'Sales Invoice Series', 'SI', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 3, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('7c5e58dd-0723-11f1-90a3-9c1aab0c3c09', '', NULL, NULL, 'tax_invoice', 'Tax Invoice Series', 'TI', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 3, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('7c5f0472-0723-11f1-90a3-9c1aab0c3c09', '', NULL, NULL, 'bill_of_supply', 'Bill of Supply Series', 'BS', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 3, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('7c5f7953-0723-11f1-90a3-9c1aab0c3c09', '', NULL, NULL, 'retail_invoice', 'Retail Invoice Series', 'RI', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 3, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('7c6038d5-0723-11f1-90a3-9c1aab0c3c09', '', NULL, NULL, 'export_invoice', 'Export Invoice Series', 'EI', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 3, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('7c60be51-0723-11f1-90a3-9c1aab0c3c09', '', NULL, NULL, 'purchase_invoice', 'Purchase Invoice Series', 'PI', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 3, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:21', '2026-02-11 08:27:21'),
('a946f0bd-3347-4b20-98bd-164b44a0d2d0', '9894a8b8-4013-4a46-af08-fdba36329ea8', NULL, NULL, 'purchase_order', 'Purchase Order Series', 'PO', 'PREFIXSEPARATORYEARSEPARATORSEQUENCE', '-', 4, 1, 1, NULL, 'yearly', NULL, 1, 1, '2026-02-11 08:27:25', '2026-02-11 08:27:25');

-- --------------------------------------------------------

--
-- Table structure for table `product_attributes`
--

CREATE TABLE `product_attributes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `product_attribute_values`
--

CREATE TABLE `product_attribute_values` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `product_attribute_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `value` varchar(255) NOT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `stock_movements`
--

CREATE TABLE `stock_movements` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `inventory_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `warehouse_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `movement_type` enum('IN','OUT','ADJUSTMENT','TRANSFER') NOT NULL,
  `quantity` decimal(15,3) NOT NULL,
  `rate` decimal(15,4) DEFAULT 0.0000,
  `amount` decimal(15,2) DEFAULT 0.00,
  `reference_number` varchar(255) DEFAULT NULL,
  `narration` text DEFAULT NULL,
  `movement_date` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `stock_movements`
--

INSERT INTO `stock_movements` (`id`, `inventory_item_id`, `warehouse_id`, `voucher_id`, `movement_type`, `quantity`, `rate`, `amount`, `reference_number`, `narration`, `movement_date`, `tenant_id`, `createdAt`, `updatedAt`) VALUES
('ebb896f0-0728-11f1-90a3-9c1aab0c3c09', '3b3f7213-0c44-4d82-800c-7b0a2838629e', NULL, '1f878cd9-9591-408c-a44e-abd85c48dafb', 'IN', 44580.000, 53.0000, 0.00, NULL, NULL, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 14:36:16', '2026-02-11 14:36:16'),
('ebb92972-0728-11f1-90a3-9c1aab0c3c09', '3b3f7213-0c44-4d82-800c-7b0a2838629e', NULL, '80e6f2b4-85c3-4126-b167-f5eeb2254d71', 'OUT', 20000.000, 57.0000, 0.00, NULL, NULL, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 14:36:16', '2026-02-11 14:36:16');

-- --------------------------------------------------------

--
-- Table structure for table `tds_details`
--

CREATE TABLE `tds_details` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tds_section` varchar(255) NOT NULL,
  `tds_rate` decimal(6,2) NOT NULL,
  `tds_amount` decimal(15,2) DEFAULT 0.00,
  `quarter` varchar(255) DEFAULT NULL,
  `financial_year` varchar(255) DEFAULT NULL,
  `deductee_pan` varchar(255) DEFAULT NULL,
  `certificate_number` varchar(255) DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL,
  `deductee_name` varchar(255) DEFAULT NULL COMMENT 'Name of the deductee',
  `certificate_date` datetime DEFAULT NULL COMMENT 'Date of TDS certificate issuance',
  `taxable_amount` decimal(15,2) DEFAULT 0.00 COMMENT 'Taxable amount on which TDS is calculated'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `first_name` varchar(255) NOT NULL,
  `last_name` varchar(255) NOT NULL,
  `role` enum('tenant_admin','user','accountant') DEFAULT 'user',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `email_verified` tinyint(1) DEFAULT 0,
  `email_verified_at` datetime DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`preferences`)),
  `tenant_id` varchar(255) NOT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `name`, `first_name`, `last_name`, `role`, `is_active`, `last_login`, `email_verified`, `email_verified_at`, `phone`, `profile_image`, `preferences`, `tenant_id`, `created_by`, `createdAt`, `updatedAt`) VALUES
('9abbfe03-3a77-45f1-904f-e991bc69ec83', 'info@abctrading.com', '$2b$10$TdaYXwRV4oYttw2.R44ljOGuEIFvdTBcem/x5Vk4V23bWpOer3n9O', NULL, 'Admin', 'User', 'tenant_admin', 1, NULL, 0, NULL, NULL, NULL, NULL, '77f19448-c378-46c5-9c11-0d00f85f06c2', NULL, '2026-02-11 08:27:21', '2026-02-11 08:27:21');

-- --------------------------------------------------------

--
-- Table structure for table `vouchers`
--

CREATE TABLE `vouchers` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_number` varchar(255) NOT NULL,
  `voucher_type` varchar(255) NOT NULL,
  `voucher_date` datetime NOT NULL,
  `party_ledger_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `narration` text DEFAULT NULL,
  `status` enum('draft','posted','cancelled') DEFAULT 'draft',
  `reference_number` varchar(255) DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `currency_code` varchar(3) DEFAULT 'INR' COMMENT 'Currency code for foreign currency invoices (ISO 4217 format: USD, EUR, GBP, etc.)',
  `exchange_rate` decimal(15,6) DEFAULT 1.000000 COMMENT 'Exchange rate to convert foreign currency to base currency (INR)',
  `shipping_bill_number` varchar(50) DEFAULT NULL COMMENT 'Shipping bill number for export invoices',
  `shipping_bill_date` datetime DEFAULT NULL COMMENT 'Date of shipping bill for export invoices',
  `port_of_loading` varchar(100) DEFAULT NULL COMMENT 'Port from which goods are shipped for export',
  `destination_country` varchar(100) DEFAULT NULL COMMENT 'Destination country for export invoices',
  `has_lut` tinyint(1) DEFAULT 0 COMMENT 'Whether LUT (Letter of Undertaking) is present for zero-rated GST on exports',
  `purpose` enum('job_work','stock_transfer','sample') DEFAULT NULL COMMENT 'Purpose of delivery challan (job_work, stock_transfer, sample)',
  `converted_to_invoice_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Reference to sales invoice if this voucher was converted',
  `validity_period` int(11) DEFAULT NULL COMMENT 'Number of days the proforma invoice is valid (e.g., 30, 60, 90 days)',
  `valid_until` datetime DEFAULT NULL COMMENT 'Calculated date when the proforma invoice expires (voucher_date + validity_period)',
  `supplier_invoice_number` varchar(100) DEFAULT NULL COMMENT 'Supplier invoice number for purchase invoices',
  `supplier_invoice_date` datetime DEFAULT NULL COMMENT 'Supplier invoice date for purchase invoices',
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Company ID for explicit company-level isolation',
  `branch_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Branch ID for explicit branch-level isolation',
  `tenant_id` varchar(255) NOT NULL,
  `created_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vouchers`
--

INSERT INTO `vouchers` (`id`, `voucher_number`, `voucher_type`, `voucher_date`, `party_ledger_id`, `total_amount`, `narration`, `status`, `reference_number`, `due_date`, `currency_code`, `exchange_rate`, `shipping_bill_number`, `shipping_bill_date`, `port_of_loading`, `destination_country`, `has_lut`, `purpose`, `converted_to_invoice_id`, `validity_period`, `valid_until`, `supplier_invoice_number`, `supplier_invoice_date`, `company_id`, `branch_id`, `tenant_id`, `created_by`, `createdAt`, `updatedAt`) VALUES
('1f878cd9-9591-408c-a44e-abd85c48dafb', 'PUR2026020001', 'purchase_invoice', '2026-02-11 00:00:00', '462bf187-e8dc-4d9d-9ecd-30d7edc61032', 2599014.00, NULL, 'posted', NULL, NULL, 'INR', 1.000000, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, '123', '2026-02-10 00:00:00', NULL, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', NULL, '2026-02-11 08:30:11', '2026-02-11 08:30:11'),
('6612ef4f-3925-4160-9004-f655bbdb420f', 'PAY2026020001', 'Payment', '2026-02-11 00:00:00', '462bf187-e8dc-4d9d-9ecd-30d7edc61032', 10000.00, '', 'posted', NULL, NULL, 'INR', 1.000000, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', NULL, '2026-02-11 13:54:20', '2026-02-11 13:54:20'),
('80e6f2b4-85c3-4126-b167-f5eeb2254d71', 'SI2026020001', 'sales_invoice', '2026-02-11 00:00:00', '630d181d-eba8-46cb-ab51-78b72806cfbc', 1197000.00, NULL, 'posted', NULL, NULL, 'INR', 1.000000, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', NULL, '2026-02-11 08:44:32', '2026-02-11 08:44:32');

-- --------------------------------------------------------

--
-- Table structure for table `voucher_items`
--

CREATE TABLE `voucher_items` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `inventory_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `item_code` varchar(100) DEFAULT NULL,
  `item_name` varchar(500) DEFAULT NULL,
  `item_description` varchar(255) NOT NULL,
  `quantity` decimal(15,3) DEFAULT 1.000,
  `uqc` varchar(20) DEFAULT NULL,
  `rate` decimal(15,4) NOT NULL,
  `discount_percentage` decimal(6,2) DEFAULT 0.00,
  `discount_amount` decimal(15,2) DEFAULT 0.00,
  `taxable_amount` decimal(15,2) DEFAULT 0.00,
  `amount` decimal(15,2) NOT NULL,
  `hsn_sac_code` varchar(255) DEFAULT NULL,
  `gst_rate` decimal(6,2) DEFAULT 0.00,
  `cgst_amount` decimal(15,2) DEFAULT 0.00,
  `sgst_amount` decimal(15,2) DEFAULT 0.00,
  `igst_amount` decimal(15,2) DEFAULT 0.00,
  `cess_amount` decimal(15,2) DEFAULT 0.00,
  `variant_attributes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Variant attributes for the item' CHECK (json_valid(`variant_attributes`)),
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_items`
--

INSERT INTO `voucher_items` (`id`, `voucher_id`, `inventory_item_id`, `barcode`, `item_code`, `item_name`, `item_description`, `quantity`, `uqc`, `rate`, `discount_percentage`, `discount_amount`, `taxable_amount`, `amount`, `hsn_sac_code`, `gst_rate`, `cgst_amount`, `sgst_amount`, `igst_amount`, `cess_amount`, `variant_attributes`, `tenant_id`, `createdAt`, `updatedAt`) VALUES
('59c3968f-0202-4990-a388-17f693fb3135', '80e6f2b4-85c3-4126-b167-f5eeb2254d71', '3b3f7213-0c44-4d82-800c-7b0a2838629e', NULL, 'Sul', 'Sulphur', 'Sulphur', 20000.000, NULL, 57.0000, 0.00, 0.00, 0.00, 1140000.00, '25030010', 5.00, 28500.00, 28500.00, 0.00, 0.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:44:32', '2026-02-11 08:44:32'),
('d0c2a8c8-2ba0-45da-9f7b-95721c4648eb', '1f878cd9-9591-408c-a44e-abd85c48dafb', '3b3f7213-0c44-4d82-800c-7b0a2838629e', NULL, 'Sul', NULL, 'Sulphur', 44580.000, NULL, 53.0000, 0.00, 0.00, 2362740.00, 2362740.00, '25030010', 5.00, 118137.00, 118137.00, 0.00, 0.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:30:11', '2026-02-11 08:30:11');

-- --------------------------------------------------------

--
-- Table structure for table `voucher_ledger_entries`
--

CREATE TABLE `voucher_ledger_entries` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `voucher_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ledger_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `debit_amount` decimal(15,2) DEFAULT 0.00,
  `credit_amount` decimal(15,2) DEFAULT 0.00,
  `narration` text DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_ledger_entries`
--

INSERT INTO `voucher_ledger_entries` (`id`, `voucher_id`, `ledger_id`, `debit_amount`, `credit_amount`, `narration`, `tenant_id`, `createdAt`, `updatedAt`) VALUES
('2aca4859-0728-11f1-90a3-9c1aab0c3c09', '80e6f2b4-85c3-4126-b167-f5eeb2254d71', '630d181d-eba8-46cb-ab51-78b72806cfbc', 1197000.00, 0.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 14:30:52', '2026-02-11 14:30:52'),
('2acbd2ba-0728-11f1-90a3-9c1aab0c3c09', '80e6f2b4-85c3-4126-b167-f5eeb2254d71', '7c594e18-0723-11f1-90a3-9c1aab0c3c09', 0.00, 1140000.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 14:30:52', '2026-02-11 14:30:52'),
('5aefe890-9d6f-4144-a4ac-bc5bc69fe71b', '1f878cd9-9591-408c-a44e-abd85c48dafb', '7c5b3b50-0723-11f1-90a3-9c1aab0c3c09', 2362740.00, 0.00, 'Inventory purchase', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:30:11', '2026-02-11 08:30:11'),
('5e749cba-0729-11f1-90a3-9c1aab0c3c09', '80e6f2b4-85c3-4126-b167-f5eeb2254d71', '7c5c03a8-0723-11f1-90a3-9c1aab0c3c09', 0.00, 28500.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 14:39:28', '2026-02-11 14:39:28'),
('5e75bffb-0729-11f1-90a3-9c1aab0c3c09', '80e6f2b4-85c3-4126-b167-f5eeb2254d71', '7c5c862c-0723-11f1-90a3-9c1aab0c3c09', 0.00, 28500.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 14:39:28', '2026-02-11 14:39:28'),
('6046d1b0-072a-11f1-90a3-9c1aab0c3c09', '80e6f2b4-85c3-4126-b167-f5eeb2254d71', '7c5b3b50-0723-11f1-90a3-9c1aab0c3c09', 0.00, 1060000.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 14:46:41', '2026-02-11 14:46:41'),
('88a362ad-f148-46f6-9ab2-d449cdb646ae', '1f878cd9-9591-408c-a44e-abd85c48dafb', 'de0d5df3-7c71-4f26-9dd0-a2283169ad7a', 0.20, 0.00, 'Round off', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:30:11', '2026-02-11 08:30:11'),
('94610bdb-e440-45a1-b6f2-131f72fea261', '6612ef4f-3925-4160-9004-f655bbdb420f', '462bf187-e8dc-4d9d-9ecd-30d7edc61032', 10000.00, 0.00, 'Payment made', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 13:54:20', '2026-02-11 13:54:20'),
('c392acb2-d770-4920-aa9b-69fd48884964', '1f878cd9-9591-408c-a44e-abd85c48dafb', '7c5c03a8-0723-11f1-90a3-9c1aab0c3c09', 118137.00, 0.00, 'CGST Input', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:30:11', '2026-02-11 08:30:11'),
('cb2dbb77-9d64-4290-bb87-ff9ff52d453f', '1f878cd9-9591-408c-a44e-abd85c48dafb', '462bf187-e8dc-4d9d-9ecd-30d7edc61032', 0.00, 2599014.00, 'Purchase invoice from Test purchase ', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:30:11', '2026-02-11 08:30:11'),
('ddaab1d0-c762-4356-be6c-9c9f30e7c177', '1f878cd9-9591-408c-a44e-abd85c48dafb', '7c5c862c-0723-11f1-90a3-9c1aab0c3c09', 118137.00, 0.00, 'SGST Input', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:30:11', '2026-02-11 08:30:11'),
('e6602f16-0738-11f1-90a3-9c1aab0c3c09', '1f878cd9-9591-408c-a44e-abd85c48dafb', '7c59c731-0723-11f1-90a3-9c1aab0c3c09', 2362740.00, 0.00, NULL, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 16:30:38', '2026-02-11 16:30:38'),
('f95f6301-c9d7-419e-9718-ff395354a7b0', '6612ef4f-3925-4160-9004-f655bbdb420f', '7c5842a2-0723-11f1-90a3-9c1aab0c3c09', 0.00, 10000.00, 'Payment via cash', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 13:54:20', '2026-02-11 13:54:20');

-- --------------------------------------------------------

--
-- Table structure for table `warehouses`
--

CREATE TABLE `warehouses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `warehouse_name` varchar(255) NOT NULL,
  `warehouse_code` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `pincode` varchar(255) DEFAULT NULL,
  `is_default` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warehouses`
--

INSERT INTO `warehouses` (`id`, `warehouse_name`, `warehouse_code`, `address`, `city`, `state`, `pincode`, `is_default`, `is_active`, `tenant_id`, `createdAt`, `updatedAt`) VALUES
('51050f69-7e26-42b4-8760-dfdbdce31802', 'Main Warehouse', 'WH-001', '123 Business Park, Andheri East', '', 'Maharashtra', '400069', 1, 1, '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:27:25', '2026-02-11 08:27:25');

-- --------------------------------------------------------

--
-- Table structure for table `warehouse_stocks`
--

CREATE TABLE `warehouse_stocks` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `warehouse_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `inventory_item_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `quantity` decimal(15,3) DEFAULT 0.000,
  `avg_cost` decimal(15,4) DEFAULT 0.0000,
  `last_updated` datetime DEFAULT NULL,
  `tenant_id` varchar(255) NOT NULL,
  `createdAt` datetime DEFAULT NULL,
  `updatedAt` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `warehouse_stocks`
--

INSERT INTO `warehouse_stocks` (`id`, `warehouse_id`, `inventory_item_id`, `quantity`, `avg_cost`, `last_updated`, `tenant_id`, `createdAt`, `updatedAt`) VALUES
('ba39ae70-021f-4af7-9eb7-36545d7f22c5', '51050f69-7e26-42b4-8760-dfdbdce31802', '3b3f7213-0c44-4d82-800c-7b0a2838629e', 0.000, 0.0000, '2026-02-11 08:28:51', '9894a8b8-4013-4a46-af08-fdba36329ea8', '2026-02-11 08:28:51', '2026-02-11 08:28:51');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `audit_logs`
--
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_table_record` (`table_name`,`record_id`),
  ADD KEY `idx_audit_logs_tenant_id` (`tenant_id`);

--
-- Indexes for table `billwise_details`
--
ALTER TABLE `billwise_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_billwise_details_voucher_id` (`voucher_id`),
  ADD KEY `idx_billwise_details_ledger_id` (`ledger_id`),
  ADD KEY `idx_billwise_details_tenant_id` (`tenant_id`);

--
-- Indexes for table `bill_allocations`
--
ALTER TABLE `bill_allocations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bill_allocations_payment_voucher_id` (`payment_voucher_id`),
  ADD KEY `idx_bill_allocations_bill_detail_id` (`bill_detail_id`),
  ADD KEY `idx_bill_allocations_tenant_id` (`tenant_id`);

--
-- Indexes for table `einvoices`
--
ALTER TABLE `einvoices`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_einvoices_voucher_id` (`voucher_id`),
  ADD KEY `idx_einvoices_irn` (`irn`),
  ADD KEY `idx_einvoices_tenant_id` (`tenant_id`);

--
-- Indexes for table `eway_bills`
--
ALTER TABLE `eway_bills`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_eway_bills_voucher_id` (`voucher_id`),
  ADD KEY `idx_eway_bills_ewb_number` (`ewb_number`),
  ADD KEY `idx_eway_bills_tenant_id` (`tenant_id`);

--
-- Indexes for table `finbox_consents`
--
ALTER TABLE `finbox_consents`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_finbox_consents_user_id` (`user_id`),
  ADD KEY `idx_finbox_consents_tenant_id` (`tenant_id`);

--
-- Indexes for table `gstins`
--
ALTER TABLE `gstins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `gstin` (`gstin`),
  ADD UNIQUE KEY `idx_gstins_gstin` (`gstin`),
  ADD KEY `idx_gstins_tenant_id` (`tenant_id`);

--
-- Indexes for table `gstr_returns`
--
ALTER TABLE `gstr_returns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_gstr_returns_unique` (`return_type`,`return_period`,`gstin`),
  ADD KEY `idx_gstr_returns_tenant_id` (`tenant_id`);

--
-- Indexes for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `item_key` (`item_key`),
  ADD UNIQUE KEY `barcode` (`barcode`),
  ADD KEY `parent_item_id` (`parent_item_id`);

--
-- Indexes for table `inventory_units`
--
ALTER TABLE `inventory_units`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unit_barcode` (`unit_barcode`),
  ADD KEY `idx_inventory_units_item_id` (`inventory_item_id`),
  ADD KEY `idx_inventory_units_status` (`status`),
  ADD KEY `idx_inventory_units_warehouse_id` (`warehouse_id`),
  ADD KEY `idx_inventory_units_purchase_voucher_id` (`purchase_voucher_id`),
  ADD KEY `idx_inventory_units_sales_voucher_id` (`sales_voucher_id`),
  ADD KEY `idx_inventory_units_tenant_id` (`tenant_id`);

--
-- Indexes for table `ledgers`
--
ALTER TABLE `ledgers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ledgers_tenant_id` (`tenant_id`),
  ADD KEY `idx_ledgers_account_group_id` (`account_group_id`);

--
-- Indexes for table `numbering_history`
--
ALTER TABLE `numbering_history`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_numbering_history_voucher_id` (`voucher_id`),
  ADD UNIQUE KEY `idx_numbering_history_number_tenant` (`generated_number`,`tenant_id`),
  ADD KEY `idx_numbering_history_series_id` (`series_id`),
  ADD KEY `idx_numbering_history_tenant_id` (`tenant_id`);

--
-- Indexes for table `numbering_series`
--
ALTER TABLE `numbering_series`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_numbering_series_tenant_id` (`tenant_id`),
  ADD KEY `idx_numbering_series_voucher_type` (`voucher_type`),
  ADD KEY `idx_numbering_series_tenant_voucher_type` (`tenant_id`,`voucher_type`),
  ADD KEY `idx_numbering_series_default` (`tenant_id`,`voucher_type`,`is_default`),
  ADD KEY `idx_numbering_tenant_company_type` (`tenant_id`,`company_id`,`voucher_type`),
  ADD KEY `idx_numbering_company_branch_type` (`company_id`,`branch_id`,`voucher_type`);

--
-- Indexes for table `product_attributes`
--
ALTER TABLE `product_attributes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_tenant_attribute_name_unique` (`tenant_id`,`name`);

--
-- Indexes for table `product_attribute_values`
--
ALTER TABLE `product_attribute_values`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_attribute_value_tenant_unique` (`product_attribute_id`,`value`,`tenant_id`);

--
-- Indexes for table `stock_movements`
--
ALTER TABLE `stock_movements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_stock_movements_item_id` (`inventory_item_id`),
  ADD KEY `idx_stock_movements_tenant_id` (`tenant_id`);

--
-- Indexes for table `tds_details`
--
ALTER TABLE `tds_details`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tds_details_voucher_id` (`voucher_id`),
  ADD KEY `idx_tds_details_tenant_id` (`tenant_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `idx_users_email` (`email`),
  ADD KEY `idx_users_tenant_id` (`tenant_id`);

--
-- Indexes for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_vouchers_number_tenant` (`voucher_number`,`tenant_id`),
  ADD KEY `idx_vouchers_tenant_id` (`tenant_id`),
  ADD KEY `idx_vouchers_converted_to_invoice_id` (`converted_to_invoice_id`),
  ADD KEY `idx_vouchers_purpose` (`purpose`),
  ADD KEY `idx_vouchers_valid_until` (`valid_until`),
  ADD KEY `idx_vouchers_tenant_company` (`tenant_id`,`company_id`),
  ADD KEY `idx_vouchers_tenant_company_branch` (`tenant_id`,`company_id`,`branch_id`),
  ADD KEY `idx_vouchers_company_date` (`company_id`,`voucher_date`),
  ADD KEY `idx_vouchers_branch_date` (`branch_id`,`voucher_date`);

--
-- Indexes for table `voucher_items`
--
ALTER TABLE `voucher_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_voucher_items_voucher_id` (`voucher_id`),
  ADD KEY `idx_voucher_items_tenant_id` (`tenant_id`);

--
-- Indexes for table `voucher_ledger_entries`
--
ALTER TABLE `voucher_ledger_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_voucher_ledger_entries_voucher_id` (`voucher_id`),
  ADD KEY `idx_voucher_ledger_entries_ledger_id` (`ledger_id`),
  ADD KEY `idx_voucher_ledger_entries_tenant_id` (`tenant_id`);

--
-- Indexes for table `warehouses`
--
ALTER TABLE `warehouses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_warehouses_tenant_id` (`tenant_id`);

--
-- Indexes for table `warehouse_stocks`
--
ALTER TABLE `warehouse_stocks`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_warehouse_stocks_unique` (`warehouse_id`,`inventory_item_id`),
  ADD KEY `idx_warehouse_stocks_tenant_id` (`tenant_id`);

--
-- Constraints for dumped tables
--

--
-- Constraints for table `billwise_details`
--
ALTER TABLE `billwise_details`
  ADD CONSTRAINT `billwise_details_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `bill_allocations`
--
ALTER TABLE `bill_allocations`
  ADD CONSTRAINT `bill_allocations_ibfk_1` FOREIGN KEY (`payment_voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `bill_allocations_ibfk_2` FOREIGN KEY (`bill_detail_id`) REFERENCES `billwise_details` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `einvoices`
--
ALTER TABLE `einvoices`
  ADD CONSTRAINT `einvoices_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `eway_bills`
--
ALTER TABLE `eway_bills`
  ADD CONSTRAINT `eway_bills_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `finbox_consents`
--
ALTER TABLE `finbox_consents`
  ADD CONSTRAINT `finbox_consents_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `inventory_items`
--
ALTER TABLE `inventory_items`
  ADD CONSTRAINT `inventory_items_ibfk_1` FOREIGN KEY (`parent_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `inventory_units`
--
ALTER TABLE `inventory_units`
  ADD CONSTRAINT `fk_inventory_units_warehouse` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `inventory_units_ibfk_1` FOREIGN KEY (`inventory_item_id`) REFERENCES `inventory_items` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_attribute_values`
--
ALTER TABLE `product_attribute_values`
  ADD CONSTRAINT `product_attribute_values_ibfk_1` FOREIGN KEY (`product_attribute_id`) REFERENCES `product_attributes` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `tds_details`
--
ALTER TABLE `tds_details`
  ADD CONSTRAINT `tds_details_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `vouchers`
--
ALTER TABLE `vouchers`
  ADD CONSTRAINT `vouchers_ibfk_1` FOREIGN KEY (`converted_to_invoice_id`) REFERENCES `vouchers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `voucher_items`
--
ALTER TABLE `voucher_items`
  ADD CONSTRAINT `voucher_items_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `voucher_ledger_entries`
--
ALTER TABLE `voucher_ledger_entries`
  ADD CONSTRAINT `voucher_ledger_entries_ibfk_1` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
