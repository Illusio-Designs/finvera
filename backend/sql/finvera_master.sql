-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 11, 2026 at 02:58 PM
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
-- Database: `finvera_master`
--

-- --------------------------------------------------------

--
-- Table structure for table `accounting_years`
--

CREATE TABLE `accounting_years` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `year_name` varchar(20) NOT NULL COMMENT 'E.g., 2023-24, 2024-25',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `is_current` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `account_groups`
--

CREATE TABLE `account_groups` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `parent_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'For hierarchical chart of accounts',
  `nature` enum('asset','liability','income','expense') NOT NULL,
  `affects_gross_profit` tinyint(1) DEFAULT 0,
  `is_system` tinyint(1) DEFAULT 0 COMMENT 'System groups cannot be deleted',
  `description` text DEFAULT NULL,
  `group_code` varchar(20) DEFAULT NULL COMMENT 'Unique code for the group',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `account_groups`
--

INSERT INTO `account_groups` (`id`, `name`, `parent_id`, `nature`, `affects_gross_profit`, `is_system`, `description`, `group_code`, `createdAt`, `updatedAt`) VALUES
('02f1c166-0f0f-4179-b854-c704b68e9ab4', 'Indirect Expenses', NULL, 'expense', 0, 1, NULL, 'IND_EXP', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('039dfc14-f34c-40ff-8e7a-6a887abc6a49', 'Sundry Creditors', NULL, 'liability', 0, 1, NULL, 'SC', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('03a69152-c743-49c2-b07e-9e8d9a9de349', 'Current Assets', NULL, 'asset', 0, 1, NULL, 'CA', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('17356155-10aa-4e7b-979d-f5b0d95b770e', 'Duties & Taxes', NULL, 'liability', 0, 1, NULL, 'DT', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('1ff56b9c-a0db-4b13-849c-a2aeb1d1adea', 'Stock-in-Hand', NULL, 'asset', 0, 1, NULL, 'INV', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('327f5e77-04c8-4650-b069-2c97aea98b08', 'Cash-in-Hand', NULL, 'asset', 0, 1, NULL, 'CASH', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('339f0a76-10ec-4400-b037-d067a5d6cb2e', 'Purchase Accounts', NULL, 'expense', 1, 1, NULL, 'PUR', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('3c5043a1-a2ed-4131-a2ca-30bc40630ede', 'Indirect Income', NULL, 'income', 0, 1, NULL, 'IND_INC', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('448a0bc3-8037-47e9-ab51-af4e4819aeec', 'Current Liabilities', NULL, 'liability', 0, 1, NULL, 'CL', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('744d269b-83e4-413d-93af-9dbaca6bb172', 'Bank Accounts', NULL, 'asset', 0, 1, NULL, 'BANK', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('8674f4ac-9904-4b9e-9ae4-340c4c04923c', 'Sundry Debtors', NULL, 'asset', 0, 1, NULL, 'SD', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('876e7802-7d0e-4e2c-945f-b0b180827a3d', 'Reserves & Surplus', NULL, 'liability', 0, 1, NULL, 'RES', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('909af34f-908f-4fd7-b553-bf3c04d24c23', 'Capital Account', NULL, 'liability', 0, 1, NULL, 'CAP', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('96d4cfb1-2e60-4997-a946-b3f848065b54', 'Direct Income', NULL, 'income', 1, 1, NULL, 'DIR_INC', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('a68655c3-e2dd-4e2d-9c8e-9e4447d22bde', 'Fixed Assets', NULL, 'asset', 0, 1, NULL, 'FA', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('b80995a0-4f76-4239-99f6-c179cacb8fd1', 'Loans (Liability)', NULL, 'liability', 0, 1, NULL, 'LOAN', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('c5250c23-6d47-4d26-af73-4702481f9647', 'Sales Accounts', NULL, 'income', 1, 1, NULL, 'SAL', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('ddcf409a-f699-4207-aa79-38342266b5e6', 'Loans & Advances (Asset)', NULL, 'asset', 0, 1, NULL, 'LA', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('fce255af-3289-4317-a59c-08c378016294', 'Direct Expenses', NULL, 'expense', 1, 1, NULL, 'DIR_EXP', '2026-02-11 08:23:50', '2026-02-11 08:23:50');

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `branch_name` varchar(255) NOT NULL,
  `branch_code` varchar(255) DEFAULT NULL,
  `gstin` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `state` varchar(255) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `business_type` enum('trader','retail') DEFAULT NULL COMMENT 'Branch-specific business type, inherits from company if null',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `company_id`, `branch_name`, `branch_code`, `gstin`, `address`, `city`, `state`, `pincode`, `phone`, `email`, `is_active`, `business_type`, `createdAt`, `updatedAt`) VALUES
('0db9249f-50c7-4483-8910-6f2107640e73', '77f19448-c378-46c5-9c11-0d00f85f06c2', 'Main Branch - Mumbai', 'MUM001', '27AABCT1234A1Z5', '123 Business Park, Andheri East', 'Mumbai', 'Maharashtra', '400069', '02226789012', 'mumbai@abctrading.com', 1, NULL, '2026-02-11 08:27:17', '2026-02-11 08:27:17'),
('4442d3aa-fe56-44c8-ae5b-e11feadac471', '8f39a9a1-e913-45ca-a0a9-b7d69b7d36e8', 'Main Store - Delhi', 'DEL001', '07AABCR5678B1Z1', '456 Shopping Complex, Connaught Place', 'Delhi', 'Delhi', '110001', '01143210987', 'delhi@xyzretail.com', 1, 'retail', '2026-02-11 08:27:17', '2026-02-11 08:27:17');

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'TenantMaster.id',
  `created_by_user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'users.id (main database) who created this company',
  `company_name` varchar(255) NOT NULL,
  `company_type` enum('sole_proprietorship','partnership_firm','llp','opc','private_limited','public_limited','section_8') NOT NULL,
  `registration_number` varchar(50) DEFAULT NULL COMMENT 'CIN / LLPIN / other registration number',
  `incorporation_date` date DEFAULT NULL,
  `pan` varchar(10) DEFAULT NULL,
  `tan` varchar(10) DEFAULT NULL,
  `gstin` varchar(15) DEFAULT NULL,
  `is_composition_dealer` tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Whether the company is registered as a composition dealer under GST',
  `registered_address` text DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `contact_number` varchar(15) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `logo_url` varchar(500) DEFAULT NULL COMMENT 'URL path to company logo image',
  `principals` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of directors/partners/proprietor objects (name, din, pan, contact, address, etc.)' CHECK (json_valid(`principals`)),
  `financial_year_start` date DEFAULT NULL,
  `financial_year_end` date DEFAULT NULL,
  `authorized_capital` decimal(18,2) DEFAULT NULL,
  `accounting_method` enum('cash','accrual') DEFAULT NULL,
  `currency` varchar(3) NOT NULL DEFAULT 'INR',
  `books_beginning_date` date DEFAULT NULL,
  `bank_details` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`bank_details`)),
  `compliance` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`compliance`)),
  `db_name` varchar(100) DEFAULT NULL,
  `db_host` varchar(255) DEFAULT NULL,
  `db_port` int(11) DEFAULT NULL,
  `db_user` varchar(100) DEFAULT NULL,
  `db_password` varchar(255) DEFAULT NULL COMMENT 'Encrypted password for company database',
  `db_provisioned` tinyint(1) DEFAULT 0,
  `db_provisioned_at` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `business_type` enum('trader','retail') NOT NULL DEFAULT 'trader' COMMENT 'Business type: trader (normal inventory) or retail (barcode-based inventory)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `tenant_id`, `created_by_user_id`, `company_name`, `company_type`, `registration_number`, `incorporation_date`, `pan`, `tan`, `gstin`, `is_composition_dealer`, `registered_address`, `state`, `pincode`, `contact_number`, `email`, `logo_url`, `principals`, `financial_year_start`, `financial_year_end`, `authorized_capital`, `accounting_method`, `currency`, `books_beginning_date`, `bank_details`, `compliance`, `db_name`, `db_host`, `db_port`, `db_user`, `db_password`, `db_provisioned`, `db_provisioned_at`, `is_active`, `createdAt`, `updatedAt`, `business_type`) VALUES
('77f19448-c378-46c5-9c11-0d00f85f06c2', '9894a8b8-4013-4a46-af08-fdba36329ea8', '9894a8b8-4013-4a46-af08-fdba36329ea8', 'ABC Trading Company', 'private_limited', 'U51909MH2020PTC123456', '2020-01-15', 'AABCT1234A', 'MUMT12345A', '27AABCT1234A1Z5', 0, '123 Business Park, Andheri East', 'Maharashtra', '400069', '02226789012', 'info@abctrading.com', NULL, NULL, '2024-04-01', '2025-03-31', NULL, NULL, 'INR', '2024-04-01', NULL, NULL, 'finvera_trader_test', 'localhost', 3306, 'root', '25de3b04d3eecbc275e29a3db112b20a:913112a31f628dfe6e1d9b7c47e432c7', 1, '2026-02-11 08:27:21', 1, '2026-02-11 08:27:17', '2026-02-11 08:27:21', 'trader'),
('8f39a9a1-e913-45ca-a0a9-b7d69b7d36e8', 'c0cd24c4-441f-45d5-a351-91cd37c28352', 'c0cd24c4-441f-45d5-a351-91cd37c28352', 'XYZ Retail Store', 'private_limited', 'U52100DL2021PTC234567', '2021-03-20', 'AABCR5678B', 'DELT23456B', '07AABCR5678B1Z1', 0, '456 Shopping Complex, Connaught Place', 'Delhi', '110001', '01143210987', 'info@xyzretail.com', NULL, NULL, '2024-04-01', '2025-03-31', NULL, NULL, 'INR', '2024-04-01', NULL, NULL, 'finvera_retail_test', 'localhost', 3306, 'root', '044eaa1d508806c4f54f303e4b9701e6:46cab9cef2ec581c53077562f9a5b4ba', 1, '2026-02-11 08:27:25', 1, '2026-02-11 08:27:17', '2026-02-11 08:27:25', 'retail');

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `subscription_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `razorpay_payment_id` varchar(255) NOT NULL,
  `razorpay_order_id` varchar(255) DEFAULT NULL,
  `razorpay_invoice_id` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `status` enum('created','authorized','captured','refunded','failed') DEFAULT 'created',
  `method` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `notes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`notes`)),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `paid_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seeder_meta`
--

CREATE TABLE `seeder_meta` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `executed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `seeder_meta`
--

INSERT INTO `seeder_meta` (`id`, `name`, `executed_at`) VALUES
(1, '001-admin-master-seeder', '2026-02-11 13:53:50');

-- --------------------------------------------------------

--
-- Table structure for table `subscriptions`
--

CREATE TABLE `subscriptions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `subscription_plan_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `razorpay_subscription_id` varchar(255) NOT NULL,
  `razorpay_plan_id` varchar(255) DEFAULT NULL,
  `status` enum('created','authenticated','active','pending','halted','cancelled','completed','expired') DEFAULT 'created',
  `plan_code` varchar(50) NOT NULL,
  `plan_name` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `billing_cycle` varchar(20) NOT NULL,
  `base_price` decimal(15,2) DEFAULT NULL,
  `discounted_price` decimal(15,2) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `trial_days` int(11) DEFAULT 0,
  `max_users` int(11) DEFAULT NULL,
  `max_invoices_per_month` int(11) DEFAULT NULL,
  `max_companies` int(11) DEFAULT 1,
  `storage_limit_gb` int(11) DEFAULT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `salesman_commission_rate` decimal(5,2) DEFAULT NULL,
  `distributor_commission_rate` decimal(5,2) DEFAULT NULL,
  `renewal_commission_rate` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_visible` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime DEFAULT NULL,
  `current_period_start` datetime DEFAULT NULL,
  `current_period_end` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `plan_type` enum('multi-company','multi-branch') DEFAULT 'multi-company' COMMENT 'Consumer selected plan type: multi-company or multi-branch',
  `max_branches` int(11) DEFAULT 0 COMMENT 'Maximum branches allowed for this subscription'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `plan_code` varchar(50) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `plan_type` enum('multi-company','multi-branch') DEFAULT 'multi-company',
  `billing_cycle` varchar(50) DEFAULT NULL,
  `base_price` decimal(15,2) NOT NULL,
  `discounted_price` decimal(15,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `trial_days` int(11) DEFAULT 0,
  `max_users` int(11) DEFAULT NULL,
  `max_invoices_per_month` int(11) DEFAULT NULL,
  `max_companies` int(11) DEFAULT 1,
  `max_branches` int(11) DEFAULT 0,
  `storage_limit_gb` int(11) DEFAULT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `salesman_commission_rate` decimal(5,2) DEFAULT NULL,
  `distributor_commission_rate` decimal(5,2) DEFAULT NULL,
  `renewal_commission_rate` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `is_visible` tinyint(1) DEFAULT 1,
  `is_featured` tinyint(1) DEFAULT 0,
  `display_order` int(11) DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `tenant_master`
--

CREATE TABLE `tenant_master` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `company_name` text NOT NULL COMMENT 'Changed to TEXT to reduce row size',
  `subdomain` varchar(50) NOT NULL COMMENT 'Unique subdomain for tenant (e.g., acme.finvera.com)',
  `db_name` varchar(100) DEFAULT NULL COMMENT 'Legacy: previously used as tenant database name. Now databases are provisioned per company.',
  `db_host` text DEFAULT NULL COMMENT 'Changed to TEXT to reduce row size',
  `db_port` int(11) DEFAULT 3306,
  `db_user` varchar(100) DEFAULT NULL,
  `db_password` text DEFAULT NULL COMMENT 'Legacy: previously used for tenant database. Changed to TEXT to reduce row size.',
  `gstin` varchar(15) DEFAULT NULL COMMENT 'Primary GSTIN for the company',
  `pan` varchar(10) DEFAULT NULL,
  `tan` varchar(10) DEFAULT NULL COMMENT 'TAN for TDS',
  `subscription_plan` varchar(50) DEFAULT NULL,
  `subscription_start` datetime DEFAULT NULL,
  `subscription_end` datetime DEFAULT NULL,
  `is_trial` tinyint(1) DEFAULT 0,
  `trial_ends_at` datetime DEFAULT NULL,
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ID of salesman who acquired this tenant',
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'ID of distributor who acquired this tenant',
  `referral_code` varchar(20) DEFAULT NULL,
  `referred_by` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tenant ID who referred this tenant',
  `referral_type` enum('salesman','distributor','tenant') DEFAULT NULL,
  `acquisition_category` enum('distributor','salesman','referral','organic') DEFAULT 'organic' COMMENT 'How the tenant was acquired: distributor (from distributor), salesman (from salesman), referral (from referral code), organic (direct from website)',
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `pincode` varchar(10) DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `email` varchar(255) NOT NULL COMMENT 'Email address (VARCHAR for index compatibility)',
  `is_active` tinyint(1) DEFAULT 1,
  `is_suspended` tinyint(1) DEFAULT 0,
  `suspended_reason` text DEFAULT NULL,
  `db_provisioned` tinyint(1) DEFAULT 0 COMMENT 'Whether database has been created and initialized',
  `db_provisioned_at` datetime DEFAULT NULL,
  `storage_limit_mb` int(11) DEFAULT 1024,
  `storage_used_mb` int(11) DEFAULT 0,
  `razorpay_customer_id` text DEFAULT NULL COMMENT 'Razorpay customer ID for payment processing',
  `razorpay_subscription_id` text DEFAULT NULL COMMENT 'Razorpay subscription ID for recurring payments',
  `settings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional tenant-specific settings' CHECK (json_valid(`settings`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `tenant_master`
--

INSERT INTO `tenant_master` (`id`, `company_name`, `subdomain`, `db_name`, `db_host`, `db_port`, `db_user`, `db_password`, `gstin`, `pan`, `tan`, `subscription_plan`, `subscription_start`, `subscription_end`, `is_trial`, `trial_ends_at`, `salesman_id`, `distributor_id`, `referral_code`, `referred_by`, `referral_type`, `acquisition_category`, `address`, `city`, `state`, `pincode`, `phone`, `email`, `is_active`, `is_suspended`, `suspended_reason`, `db_provisioned`, `db_provisioned_at`, `storage_limit_mb`, `storage_used_mb`, `razorpay_customer_id`, `razorpay_subscription_id`, `settings`, `createdAt`, `updatedAt`) VALUES
('9894a8b8-4013-4a46-af08-fdba36329ea8', 'Trader Test Company', 'trader-test', 'finvera_trader_test', 'localhost', 3306, 'root', '72d0323c0f1ef5d137325a04f43c37c6:9120dfef311cc8cf75d4b3d786f3efed', '27AABCT1234A1Z5', 'AABCT1234A', NULL, 'basic', '2026-02-11 08:27:17', '2027-02-11 08:27:17', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'organic', '123 Trader Street', 'Mumbai', 'Maharashtra', '400001', '9876543210', 'trader@test.com', 1, 0, NULL, 0, NULL, 1024, 0, NULL, NULL, '{\"barcode_enabled\":false}', '2026-02-11 08:27:17', '2026-02-11 08:27:17'),
('c0cd24c4-441f-45d5-a351-91cd37c28352', 'Retail Test Store', 'retail-test', 'finvera_retail_test', 'localhost', 3306, 'root', '4098c5b35be52919b0cbf4f00e7cc4a6:5b8ee29314090323d3626838a85ea398', '07AABCR5678B1Z1', 'AABCR5678B', NULL, 'basic', '2026-02-11 08:27:17', '2027-02-11 08:27:17', 0, NULL, NULL, NULL, NULL, NULL, NULL, 'organic', '456 Retail Avenue', 'Delhi', 'Delhi', '110001', '9876543211', 'retail@test.com', 1, 0, NULL, 0, NULL, 1024, 0, NULL, NULL, '{\"barcode_enabled\":true}', '2026-02-11 08:27:17', '2026-02-11 08:27:17');

-- --------------------------------------------------------

--
-- Table structure for table `tenant_reviews`
--

CREATE TABLE `tenant_reviews` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'User ID who submitted the review (optional)',
  `rating` int(11) NOT NULL COMMENT 'Rating from 1 to 5 stars',
  `title` varchar(200) DEFAULT NULL COMMENT 'Review title/headline',
  `comment` text DEFAULT NULL COMMENT 'Review comment/feedback',
  `reviewer_name` varchar(100) NOT NULL COMMENT 'Name of the reviewer (can be different from tenant name)',
  `reviewer_designation` varchar(100) DEFAULT NULL COMMENT 'Designation/role of reviewer (e.g., CEO, Finance Manager)',
  `reviewer_company` varchar(200) DEFAULT NULL COMMENT 'Company name (if different from tenant company_name)',
  `is_approved` tinyint(1) DEFAULT 0 COMMENT 'Whether the review is approved for public display',
  `is_featured` tinyint(1) DEFAULT 0 COMMENT 'Whether to feature this review prominently',
  `helpful_count` int(11) DEFAULT 0 COMMENT 'Number of people who found this review helpful',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `voucher_types`
--

CREATE TABLE `voucher_types` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `type_category` enum('sales','purchase','payment','receipt','journal','contra','debit_note','credit_note') NOT NULL,
  `affects_stock` tinyint(1) DEFAULT 0,
  `is_system` tinyint(1) DEFAULT 0,
  `numbering_prefix` varchar(10) DEFAULT NULL COMMENT 'Prefix for voucher numbers (e.g., INV, RCPT)',
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `voucher_types`
--

INSERT INTO `voucher_types` (`id`, `name`, `type_category`, `affects_stock`, `is_system`, `numbering_prefix`, `description`, `createdAt`, `updatedAt`) VALUES
('10822ded-7a94-45f9-8f86-3f5e7a7f6930', 'Credit Note', 'credit_note', 0, 1, 'CN', 'Credit note', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('3bed0e84-d797-4965-adee-aedd12b3c901', 'Journal', 'journal', 0, 1, 'JV', 'Journal voucher', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('5f70c69b-2f0e-43ad-a77a-34840346cb2c', 'Contra', 'contra', 0, 1, 'CNT', 'Contra voucher', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('8ffb0f3a-be8b-4a72-8965-ca7892663af3', 'Sales', 'sales', 0, 1, 'INV', 'Sales invoice', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('9af014e5-ded1-4986-ae51-ab04df2953d6', 'Purchase', 'purchase', 0, 1, 'PUR', 'Purchase invoice', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('ace5768b-6898-4ad5-8078-d62d572e0ce8', 'Payment', 'payment', 0, 1, 'PAY', 'Payment voucher', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('c3a33376-6a31-49cb-9d24-1cd73bd73f71', 'Receipt', 'receipt', 0, 1, 'REC', 'Receipt voucher', '2026-02-11 08:23:50', '2026-02-11 08:23:50'),
('f343a058-6ffc-48da-98d4-35aa99f9665e', 'Debit Note', 'debit_note', 0, 1, 'DN', 'Debit note', '2026-02-11 08:23:50', '2026-02-11 08:23:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `accounting_years`
--
ALTER TABLE `accounting_years`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `account_groups`
--
ALTER TABLE `account_groups`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `group_code` (`group_code`),
  ADD KEY `parent_id` (`parent_id`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `branch_code_unique` (`branch_code`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_companies_tenant_id` (`tenant_id`),
  ADD KEY `idx_companies_created_by` (`created_by_user_id`),
  ADD KEY `idx_companies_name` (`company_name`),
  ADD KEY `idx_companies_db_name` (`db_name`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `razorpay_payment_id` (`razorpay_payment_id`),
  ADD UNIQUE KEY `idx_payments_razorpay_id` (`razorpay_payment_id`),
  ADD UNIQUE KEY `razorpay_payment_id_unique` (`razorpay_payment_id`),
  ADD KEY `idx_payments_tenant_id` (`tenant_id`),
  ADD KEY `idx_payments_subscription_id` (`subscription_id`),
  ADD KEY `idx_payments_status` (`status`);

--
-- Indexes for table `seeder_meta`
--
ALTER TABLE `seeder_meta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- Indexes for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_subscriptions_razorpay_id` (`razorpay_subscription_id`),
  ADD KEY `idx_subscriptions_tenant_id` (`tenant_id`),
  ADD KEY `idx_subscriptions_status` (`status`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plan_code` (`plan_code`);

--
-- Indexes for table `tenant_master`
--
ALTER TABLE `tenant_master`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_tenant_master_subdomain_unique` (`subdomain`),
  ADD UNIQUE KEY `idx_tenant_master_db_name_unique` (`db_name`),
  ADD KEY `idx_tenant_master_email` (`email`),
  ADD KEY `idx_tenant_master_is_active` (`is_active`);

--
-- Indexes for table `tenant_reviews`
--
ALTER TABLE `tenant_reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_reviews_tenant_id` (`tenant_id`),
  ADD KEY `idx_tenant_reviews_approved_featured_created` (`is_approved`,`is_featured`,`created_at`),
  ADD KEY `idx_tenant_reviews_rating` (`rating`);

--
-- Indexes for table `voucher_types`
--
ALTER TABLE `voucher_types`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `seeder_meta`
--
ALTER TABLE `seeder_meta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=168;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `account_groups`
--
ALTER TABLE `account_groups`
  ADD CONSTRAINT `account_groups_ibfk_1` FOREIGN KEY (`parent_id`) REFERENCES `account_groups` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `branches`
--
ALTER TABLE `branches`
  ADD CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_343` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `payments_ibfk_344` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `subscriptions`
--
ALTER TABLE `subscriptions`
  ADD CONSTRAINT `subscriptions_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `tenant_reviews`
--
ALTER TABLE `tenant_reviews`
  ADD CONSTRAINT `tenant_reviews_ibfk_1` FOREIGN KEY (`tenant_id`) REFERENCES `tenant_master` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
