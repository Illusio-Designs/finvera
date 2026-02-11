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
-- Database: `finvera_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `blogs`
--

DROP TABLE IF EXISTS `blogs`;
CREATE TABLE `blogs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `title` varchar(255) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `excerpt` text DEFAULT NULL COMMENT 'Short description/summary',
  `content` longtext NOT NULL,
  `featured_image` varchar(500) DEFAULT NULL COMMENT 'URL or path to featured image',
  `author_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'User ID of author (website_manager)',
  `category_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Blog category',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of tags' CHECK (json_valid(`tags`)),
  `status` enum('draft','published','archived') DEFAULT 'draft',
  `is_featured` tinyint(1) DEFAULT 0 COMMENT 'Show on homepage/featured section',
  `views_count` int(11) DEFAULT 0,
  `published_at` datetime DEFAULT NULL,
  `meta_title` varchar(255) DEFAULT NULL,
  `meta_description` text DEFAULT NULL,
  `meta_keywords` varchar(500) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `blog_categories`
--

DROP TABLE IF EXISTS `blog_categories`;
CREATE TABLE `blog_categories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(100) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `commissions`
--

DROP TABLE IF EXISTS `commissions`;
CREATE TABLE `commissions` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Logical reference to master.tenant_master.id (no FK constraint)',
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `commission_type` varchar(255) DEFAULT NULL,
  `subscription_plan` varchar(255) DEFAULT NULL,
  `amount` decimal(15,2) NOT NULL,
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `payout_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `commission_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `distributors`
--

DROP TABLE IF EXISTS `distributors`;
CREATE TABLE `distributors` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `distributor_code` varchar(255) NOT NULL,
  `company_name` varchar(255) DEFAULT NULL,
  `territory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`territory`)),
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `payment_terms` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `gstin` varchar(15) DEFAULT NULL COMMENT 'GSTIN for invoicing'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
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
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_activities`
--

DROP TABLE IF EXISTS `lead_activities`;
CREATE TABLE `lead_activities` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `lead_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `activity_type` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `activity_date` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
CREATE TABLE `notifications` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `type` varchar(255) NOT NULL COMMENT 'Notification type (e.g., target_achieved, commission_approved)',
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `priority` enum('critical','high','medium','low') DEFAULT 'medium',
  `is_read` tinyint(1) DEFAULT 0,
  `read_at` datetime DEFAULT NULL,
  `action_url` varchar(500) DEFAULT NULL COMMENT 'URL to navigate when notification is clicked',
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Additional data related to the notification' CHECK (json_valid(`metadata`)),
  `sent_email` tinyint(1) DEFAULT 0 COMMENT 'Whether email notification was sent',
  `sent_at` datetime DEFAULT NULL COMMENT 'When notification was sent',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_preferences`
--

CREATE TABLE `notification_preferences` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `in_app_enabled` tinyint(1) DEFAULT 1 COMMENT 'Enable in-app notifications',
  `email_enabled` tinyint(1) DEFAULT 1 COMMENT 'Enable email notifications',
  `desktop_enabled` tinyint(1) DEFAULT 1 COMMENT 'Enable desktop notifications',
  `sound_enabled` tinyint(1) DEFAULT 1 COMMENT 'Enable sound notifications',
  `type_preferences` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Type-specific preferences { type: { in_app: bool, email: bool, desktop: bool, sound: bool } }' CHECK (json_valid(`type_preferences`)),
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payouts`
--

CREATE TABLE `payouts` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `payout_type` varchar(255) NOT NULL,
  `total_amount` decimal(15,2) NOT NULL,
  `status` varchar(255) DEFAULT 'pending',
  `payment_method` varchar(255) DEFAULT NULL,
  `payment_reference` varchar(255) DEFAULT NULL,
  `paid_date` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral_codes`
--

CREATE TABLE `referral_codes` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `code` varchar(255) NOT NULL,
  `owner_type` varchar(255) DEFAULT NULL,
  `owner_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `discount_type` varchar(255) DEFAULT NULL,
  `discount_value` decimal(10,2) DEFAULT NULL,
  `free_trial_days` int(11) DEFAULT NULL,
  `max_uses` int(11) DEFAULT NULL,
  `current_uses` int(11) DEFAULT 0,
  `valid_from` datetime DEFAULT NULL,
  `valid_until` datetime DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral_discount_configs`
--

CREATE TABLE `referral_discount_configs` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `discount_percentage` decimal(5,2) NOT NULL DEFAULT 10.00 COMMENT 'Discount percentage for referral code users',
  `effective_from` datetime NOT NULL COMMENT 'Date from which this discount percentage is effective',
  `effective_until` datetime DEFAULT NULL COMMENT 'Date until which this discount percentage is effective (null = indefinite)',
  `is_active` tinyint(1) DEFAULT 1,
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral_rewards`
--

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
  `notes` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `salesmen`
--

CREATE TABLE `salesmen` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `user_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_code` varchar(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `territory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`territory`)),
  `commission_rate` decimal(5,2) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `gstin` varchar(15) DEFAULT NULL COMMENT 'GSTIN for invoicing'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `seeder_meta`
--

CREATE TABLE `seeder_meta` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `executed_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `seeder_meta`
--

INSERT INTO `seeder_meta` (`id`, `name`, `executed_at`) VALUES
(1, '001-admin-master-seeder', '2026-02-11 13:53:55');

-- --------------------------------------------------------

--
-- Table structure for table `seo_settings`
--

CREATE TABLE `seo_settings` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `page_type` enum('home','about','contact','pricing','features','blog','custom') NOT NULL,
  `page_path` varchar(255) NOT NULL COMMENT 'URL path (e.g., /, /about, /pricing)',
  `title` varchar(255) NOT NULL COMMENT 'Page title (for <title> tag)',
  `meta_description` text DEFAULT NULL COMMENT 'Meta description for search engines',
  `meta_keywords` varchar(500) DEFAULT NULL COMMENT 'Comma-separated keywords',
  `og_title` varchar(255) DEFAULT NULL COMMENT 'Open Graph title for social media',
  `og_description` text DEFAULT NULL COMMENT 'Open Graph description',
  `og_image` varchar(500) DEFAULT NULL COMMENT 'Open Graph image URL',
  `twitter_card` enum('summary','summary_large_image','app','player') DEFAULT 'summary_large_image',
  `canonical_url` varchar(500) DEFAULT NULL COMMENT 'Canonical URL to avoid duplicate content',
  `robots` varchar(100) DEFAULT 'index, follow' COMMENT 'Robots meta tag (index, follow, noindex, nofollow)',
  `structured_data` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'JSON-LD structured data for rich snippets' CHECK (json_valid(`structured_data`)),
  `is_active` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `subscription_plans`
--

CREATE TABLE `subscription_plans` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `plan_code` varchar(255) NOT NULL,
  `plan_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `billing_cycle` varchar(255) DEFAULT NULL,
  `base_price` decimal(15,2) NOT NULL,
  `discounted_price` decimal(15,2) DEFAULT NULL,
  `currency` varchar(3) DEFAULT 'INR',
  `trial_days` int(11) DEFAULT 0,
  `max_users` int(11) DEFAULT NULL,
  `max_invoices_per_month` int(11) DEFAULT NULL,
  `max_companies` int(11) DEFAULT 1 COMMENT 'Maximum number of companies allowed',
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
  `updatedAt` datetime NOT NULL,
  `max_branches` int(11) DEFAULT 0 COMMENT 'Maximum number of branches allowed (0 = no branches)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `subscription_plans`
--

INSERT INTO `subscription_plans` (`id`, `plan_code`, `plan_name`, `description`, `billing_cycle`, `base_price`, `discounted_price`, `currency`, `trial_days`, `max_users`, `max_invoices_per_month`, `max_companies`, `storage_limit_gb`, `features`, `salesman_commission_rate`, `distributor_commission_rate`, `renewal_commission_rate`, `is_active`, `is_visible`, `is_featured`, `display_order`, `valid_from`, `valid_until`, `createdAt`, `updatedAt`, `max_branches`) VALUES
('053cefff-0a01-4e6c-b418-5b2acf5d359c', 'STARTER', 'Starter', 'Starter plan', 'monthly', 999.00, NULL, 'INR', 30, 3, 200, 2, NULL, '{\"gst_filing\":true,\"e_invoicing\":false}', 15.00, 5.00, NULL, 1, 1, NULL, NULL, NULL, NULL, '2026-02-11 08:23:55', '2026-02-11 08:23:55', 2),
('7f3edd3f-146e-4478-a06c-576ffc62ad66', 'FREE', 'Free', 'Free tier', 'monthly', 0.00, NULL, 'INR', 0, 1, 50, 1, NULL, '{\"gst_filing\":false,\"e_invoicing\":false}', NULL, NULL, NULL, 1, 1, NULL, NULL, NULL, NULL, '2026-02-11 08:23:55', '2026-02-11 08:23:55', 0),
('a1978881-e138-4af5-8a5e-c348ddd2f4af', 'PROFESSIONAL', 'Professional', 'Most popular for growing businesses', 'monthly', 1999.00, 1660.00, 'INR', 30, 15, 2000, 5, 50, '{\"gst_filing\":true,\"e_invoicing\":true,\"advanced_reports\":true,\"multi_branch\":true,\"priority_support\":true}', 20.00, 8.00, 5.00, 1, 1, 1, 2, NULL, NULL, '2026-02-11 08:23:55', '2026-02-11 08:23:55', 10),
('c7152720-8f01-4142-a096-9026edc99c3a', 'ENTERPRISE', 'Enterprise', 'For large businesses with advanced needs', 'monthly', 3999.00, 3320.00, 'INR', 30, -1, -1, -1, 500, '{\"gst_filing\":true,\"e_invoicing\":true,\"advanced_reports\":true,\"multi_branch\":true,\"priority_support\":true,\"api_access\":true,\"custom_integrations\":true,\"dedicated_support\":true,\"white_label\":true,\"advanced_analytics\":true}', 25.00, 10.00, 8.00, 1, 1, 0, 3, NULL, NULL, '2026-02-11 08:23:55', '2026-02-11 08:23:55', -1);

-- --------------------------------------------------------

--
-- Table structure for table `support_agent_reviews`
--

CREATE TABLE `support_agent_reviews` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ticket_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `agent_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT 'Support agent being reviewed',
  `client_name` varchar(100) DEFAULT NULL,
  `client_email` varchar(255) DEFAULT NULL,
  `rating` int(11) NOT NULL COMMENT 'Rating from 1 to 5 stars',
  `would_recommend` tinyint(1) DEFAULT 1,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tenant who gave the review',
  `comment` text DEFAULT NULL COMMENT 'Review comment',
  `resolution_speed` enum('very_slow','slow','average','fast','very_fast') DEFAULT NULL COMMENT 'How quickly was the issue resolved',
  `communication` int(11) DEFAULT NULL COMMENT 'Communication quality rating',
  `knowledge` int(11) DEFAULT NULL COMMENT 'Technical knowledge rating',
  `friendliness` int(11) DEFAULT NULL COMMENT 'Friendliness rating'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `support_tickets`
--

CREATE TABLE `support_tickets` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ticket_number` varchar(20) NOT NULL COMMENT 'Auto-generated ticket number (e.g., TKT-2024-0001)',
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tenant who raised the ticket',
  `client_name` varchar(100) NOT NULL,
  `client_email` varchar(255) NOT NULL,
  `client_phone` varchar(15) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text NOT NULL,
  `category` enum('technical','billing','feature_request','bug_report','general','other') DEFAULT 'general',
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('open','assigned','in_progress','waiting_client','resolved','closed') DEFAULT 'open',
  `assigned_to` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Support agent assigned to this ticket',
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of file URLs/paths' CHECK (json_valid(`attachments`)),
  `resolved_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `resolution_note` text DEFAULT NULL COMMENT 'Final resolution note by support agent',
  `tags` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tags for categorization' CHECK (json_valid(`tags`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `targets`
--

CREATE TABLE `targets` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `distributor_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `salesman_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `target_type` varchar(255) DEFAULT NULL,
  `target_period` varchar(255) DEFAULT NULL,
  `target_value` decimal(15,2) NOT NULL,
  `achieved_value` decimal(15,2) DEFAULT 0.00,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ticket_messages`
--

CREATE TABLE `ticket_messages` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ticket_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `sender_type` enum('client','agent','system') NOT NULL,
  `sender_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'User ID if sender is agent, null for client/system',
  `sender_name` varchar(100) NOT NULL,
  `message` text NOT NULL,
  `attachments` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Array of file URLs/paths' CHECK (json_valid(`attachments`)),
  `is_internal` tinyint(1) DEFAULT 0 COMMENT 'Internal notes not visible to client',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL DEFAULT (uuid()),
  `tenant_id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT 'Tenant ID for tenant_admin users, null for admin portal users',
  `email` varchar(255) NOT NULL,
  `password` varchar(255) DEFAULT NULL,
  `google_id` varchar(255) DEFAULT NULL COMMENT 'Google OAuth user ID',
  `name` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL DEFAULT 'admin',
  `phone` varchar(15) DEFAULT NULL,
  `profile_image` varchar(500) DEFAULT NULL COMMENT 'Path to user profile image',
  `is_active` tinyint(1) DEFAULT 1,
  `last_login` datetime DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `tenant_id`, `email`, `password`, `google_id`, `name`, `role`, `phone`, `profile_image`, `is_active`, `last_login`, `createdAt`, `updatedAt`) VALUES
('7a0980c3-0723-11f1-90a3-9c1aab0c3c09', '9894a8b8-4013-4a46-af08-fdba36329ea8', 'admin@trader-test.com', '$2b$10$7OMZx4kd/olyBHVXIx3z9.mJ7mb2QK0NEg9c6GJ/ilfXXNIXU5lhi', NULL, 'Trader Admin', 'tenant_admin', '9876543210', NULL, 1, NULL, '2026-02-11 08:27:17', '2026-02-11 08:27:17'),
('7a17778b-0723-11f1-90a3-9c1aab0c3c09', 'c0cd24c4-441f-45d5-a351-91cd37c28352', 'admin@retail-test.com', '$2b$10$hEPCq6.9Feis59LdaFplsO4fuCymS4HvwH4c5tT0FbB5uO8KYH62u', NULL, 'Retail Admin', 'tenant_admin', '9876543211', NULL, 1, NULL, '2026-02-11 08:27:17', '2026-02-11 08:27:17'),
('c024fb8a-63a0-40fe-898a-5e29cf63f709', NULL, 'rishi@finvera.com', '$2b$10$OVUYYcttv0Fkz.rkthCHnef1MVD2T2Wkjqmol01Ct0nETV6mC6FZW', NULL, 'Rishi Kumar', 'super_admin', NULL, NULL, 1, NULL, '2026-02-11 08:23:55', '2026-02-11 19:27:49');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `blogs`
--
ALTER TABLE `blogs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD UNIQUE KEY `slug_2` (`slug`),
  ADD UNIQUE KEY `slug_3` (`slug`),
  ADD UNIQUE KEY `slug_4` (`slug`),
  ADD UNIQUE KEY `slug_5` (`slug`),
  ADD UNIQUE KEY `slug_6` (`slug`),
  ADD UNIQUE KEY `slug_7` (`slug`),
  ADD UNIQUE KEY `slug_8` (`slug`),
  ADD UNIQUE KEY `slug_9` (`slug`),
  ADD UNIQUE KEY `slug_10` (`slug`),
  ADD UNIQUE KEY `slug_11` (`slug`),
  ADD UNIQUE KEY `slug_12` (`slug`),
  ADD UNIQUE KEY `slug_13` (`slug`),
  ADD UNIQUE KEY `slug_14` (`slug`),
  ADD UNIQUE KEY `slug_15` (`slug`),
  ADD UNIQUE KEY `slug_16` (`slug`),
  ADD UNIQUE KEY `slug_17` (`slug`),
  ADD UNIQUE KEY `slug_18` (`slug`),
  ADD UNIQUE KEY `slug_19` (`slug`),
  ADD UNIQUE KEY `slug_20` (`slug`),
  ADD UNIQUE KEY `slug_21` (`slug`),
  ADD UNIQUE KEY `slug_22` (`slug`),
  ADD UNIQUE KEY `slug_23` (`slug`),
  ADD UNIQUE KEY `slug_24` (`slug`),
  ADD UNIQUE KEY `slug_25` (`slug`),
  ADD UNIQUE KEY `slug_26` (`slug`),
  ADD UNIQUE KEY `slug_27` (`slug`),
  ADD UNIQUE KEY `slug_28` (`slug`),
  ADD UNIQUE KEY `slug_29` (`slug`),
  ADD KEY `blogs_slug` (`slug`),
  ADD KEY `blogs_status` (`status`),
  ADD KEY `blogs_author_id` (`author_id`),
  ADD KEY `blogs_category_id` (`category_id`),
  ADD KEY `blogs_published_at` (`published_at`);

--
-- Indexes for table `blog_categories`
--
ALTER TABLE `blog_categories`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `commissions`
--
ALTER TABLE `commissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_commissions_tenant_status` (`tenant_id`,`status`),
  ADD KEY `idx_commissions_distributor` (`distributor_id`),
  ADD KEY `idx_commissions_salesman` (`salesman_id`),
  ADD KEY `payout_id` (`payout_id`);

--
-- Indexes for table `distributors`
--
ALTER TABLE `distributors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `distributor_code` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_2` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_3` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_4` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_5` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_6` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_7` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_8` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_9` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_10` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_11` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_12` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_13` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_14` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_15` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_16` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_17` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_18` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_19` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_20` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_21` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_22` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_23` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_24` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_25` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_26` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_27` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_28` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_29` (`distributor_code`),
  ADD UNIQUE KEY `distributor_code_30` (`distributor_code`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD KEY `salesman_id` (`salesman_id`),
  ADD KEY `distributor_id` (`distributor_id`);

--
-- Indexes for table `lead_activities`
--
ALTER TABLE `lead_activities`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lead_id` (`lead_id`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `notifications_user_id` (`user_id`),
  ADD KEY `notifications_is_read` (`is_read`),
  ADD KEY `notifications_type` (`type`),
  ADD KEY `notifications_created_at` (`createdAt`);

--
-- Indexes for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `user_id` (`user_id`),
  ADD UNIQUE KEY `idx_notification_preferences_user_id_unique` (`user_id`),
  ADD UNIQUE KEY `notification_preferences_user_id` (`user_id`);

--
-- Indexes for table `payouts`
--
ALTER TABLE `payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `distributor_id` (`distributor_id`),
  ADD KEY `salesman_id` (`salesman_id`);

--
-- Indexes for table `referral_codes`
--
ALTER TABLE `referral_codes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `code` (`code`),
  ADD UNIQUE KEY `code_2` (`code`),
  ADD UNIQUE KEY `code_3` (`code`),
  ADD UNIQUE KEY `code_4` (`code`),
  ADD UNIQUE KEY `code_5` (`code`),
  ADD UNIQUE KEY `code_6` (`code`),
  ADD UNIQUE KEY `code_7` (`code`),
  ADD UNIQUE KEY `code_8` (`code`),
  ADD UNIQUE KEY `code_9` (`code`),
  ADD UNIQUE KEY `code_10` (`code`),
  ADD UNIQUE KEY `code_11` (`code`),
  ADD UNIQUE KEY `code_12` (`code`),
  ADD UNIQUE KEY `code_13` (`code`),
  ADD UNIQUE KEY `code_14` (`code`),
  ADD UNIQUE KEY `code_15` (`code`),
  ADD UNIQUE KEY `code_16` (`code`),
  ADD UNIQUE KEY `code_17` (`code`),
  ADD UNIQUE KEY `code_18` (`code`),
  ADD UNIQUE KEY `code_19` (`code`),
  ADD UNIQUE KEY `code_20` (`code`),
  ADD UNIQUE KEY `code_21` (`code`),
  ADD UNIQUE KEY `code_22` (`code`),
  ADD UNIQUE KEY `code_23` (`code`),
  ADD UNIQUE KEY `code_24` (`code`),
  ADD UNIQUE KEY `code_25` (`code`),
  ADD UNIQUE KEY `code_26` (`code`),
  ADD UNIQUE KEY `code_27` (`code`),
  ADD UNIQUE KEY `code_28` (`code`),
  ADD UNIQUE KEY `code_29` (`code`),
  ADD UNIQUE KEY `code_30` (`code`);

--
-- Indexes for table `referral_discount_configs`
--
ALTER TABLE `referral_discount_configs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `referral_rewards`
--
ALTER TABLE `referral_rewards`
  ADD PRIMARY KEY (`id`),
  ADD KEY `referral_rewards_referrer_id` (`referrer_id`),
  ADD KEY `referral_code_id` (`referral_code_id`);

--
-- Indexes for table `salesmen`
--
ALTER TABLE `salesmen`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `salesman_code` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_2` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_3` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_4` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_5` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_6` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_7` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_8` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_9` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_10` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_11` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_12` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_13` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_14` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_15` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_16` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_17` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_18` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_19` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_20` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_21` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_22` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_23` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_24` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_25` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_26` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_27` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_28` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_29` (`salesman_code`),
  ADD UNIQUE KEY `salesman_code_30` (`salesman_code`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `distributor_id` (`distributor_id`);

--
-- Indexes for table `seeder_meta`
--
ALTER TABLE `seeder_meta`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`),
  ADD KEY `idx_name` (`name`);

--
-- Indexes for table `seo_settings`
--
ALTER TABLE `seo_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `seo_settings_page_path` (`page_path`),
  ADD KEY `seo_settings_page_type` (`page_type`);

--
-- Indexes for table `subscription_plans`
--
ALTER TABLE `subscription_plans`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `plan_code` (`plan_code`),
  ADD UNIQUE KEY `plan_code_2` (`plan_code`),
  ADD UNIQUE KEY `plan_code_3` (`plan_code`),
  ADD UNIQUE KEY `plan_code_4` (`plan_code`),
  ADD UNIQUE KEY `plan_code_5` (`plan_code`),
  ADD UNIQUE KEY `plan_code_6` (`plan_code`),
  ADD UNIQUE KEY `plan_code_7` (`plan_code`),
  ADD UNIQUE KEY `plan_code_8` (`plan_code`),
  ADD UNIQUE KEY `plan_code_9` (`plan_code`),
  ADD UNIQUE KEY `plan_code_10` (`plan_code`),
  ADD UNIQUE KEY `plan_code_11` (`plan_code`),
  ADD UNIQUE KEY `plan_code_12` (`plan_code`),
  ADD UNIQUE KEY `plan_code_13` (`plan_code`),
  ADD UNIQUE KEY `plan_code_14` (`plan_code`),
  ADD UNIQUE KEY `plan_code_15` (`plan_code`),
  ADD UNIQUE KEY `plan_code_16` (`plan_code`),
  ADD UNIQUE KEY `plan_code_17` (`plan_code`),
  ADD UNIQUE KEY `plan_code_18` (`plan_code`),
  ADD UNIQUE KEY `plan_code_19` (`plan_code`),
  ADD UNIQUE KEY `plan_code_20` (`plan_code`),
  ADD UNIQUE KEY `plan_code_21` (`plan_code`),
  ADD UNIQUE KEY `plan_code_22` (`plan_code`),
  ADD UNIQUE KEY `plan_code_23` (`plan_code`),
  ADD UNIQUE KEY `plan_code_24` (`plan_code`),
  ADD UNIQUE KEY `plan_code_25` (`plan_code`),
  ADD UNIQUE KEY `plan_code_26` (`plan_code`),
  ADD UNIQUE KEY `plan_code_27` (`plan_code`),
  ADD UNIQUE KEY `plan_code_28` (`plan_code`),
  ADD UNIQUE KEY `plan_code_29` (`plan_code`),
  ADD UNIQUE KEY `plan_code_30` (`plan_code`);

--
-- Indexes for table `support_agent_reviews`
--
ALTER TABLE `support_agent_reviews`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_id` (`ticket_id`),
  ADD UNIQUE KEY `idx_support_agent_reviews_ticket_id` (`ticket_id`),
  ADD UNIQUE KEY `support_agent_reviews_ticket_id` (`ticket_id`),
  ADD KEY `idx_support_agent_reviews_agent_id` (`agent_id`),
  ADD KEY `idx_support_agent_reviews_rating` (`rating`),
  ADD KEY `support_agent_reviews_agent_id` (`agent_id`),
  ADD KEY `support_agent_reviews_rating` (`rating`);

--
-- Indexes for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ticket_number` (`ticket_number`),
  ADD UNIQUE KEY `idx_support_tickets_number` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_2` (`ticket_number`),
  ADD UNIQUE KEY `support_tickets_ticket_number` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_3` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_4` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_5` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_6` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_7` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_8` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_9` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_10` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_11` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_12` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_13` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_14` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_15` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_16` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_17` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_18` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_19` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_20` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_21` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_22` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_23` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_24` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_25` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_26` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_27` (`ticket_number`),
  ADD UNIQUE KEY `ticket_number_28` (`ticket_number`),
  ADD KEY `idx_support_tickets_tenant_id` (`tenant_id`),
  ADD KEY `idx_support_tickets_status` (`status`),
  ADD KEY `idx_support_tickets_assigned_to` (`assigned_to`),
  ADD KEY `idx_support_tickets_client_email` (`client_email`),
  ADD KEY `support_tickets_status` (`status`),
  ADD KEY `support_tickets_assigned_to` (`assigned_to`),
  ADD KEY `support_tickets_tenant_id` (`tenant_id`),
  ADD KEY `support_tickets_priority` (`priority`);

--
-- Indexes for table `targets`
--
ALTER TABLE `targets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `distributor_id` (`distributor_id`),
  ADD KEY `salesman_id` (`salesman_id`);

--
-- Indexes for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ticket_messages_ticket_id` (`ticket_id`),
  ADD KEY `idx_ticket_messages_sender_id` (`sender_id`),
  ADD KEY `ticket_messages_ticket_id` (`ticket_id`),
  ADD KEY `ticket_messages_sender_type` (`sender_type`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `email_2` (`email`),
  ADD UNIQUE KEY `email_3` (`email`),
  ADD UNIQUE KEY `email_4` (`email`),
  ADD UNIQUE KEY `email_5` (`email`),
  ADD UNIQUE KEY `email_6` (`email`),
  ADD UNIQUE KEY `email_7` (`email`),
  ADD UNIQUE KEY `email_8` (`email`),
  ADD UNIQUE KEY `email_9` (`email`),
  ADD UNIQUE KEY `email_10` (`email`),
  ADD UNIQUE KEY `email_11` (`email`),
  ADD UNIQUE KEY `email_12` (`email`),
  ADD UNIQUE KEY `email_13` (`email`),
  ADD UNIQUE KEY `email_14` (`email`),
  ADD UNIQUE KEY `email_15` (`email`),
  ADD UNIQUE KEY `email_16` (`email`),
  ADD UNIQUE KEY `email_17` (`email`),
  ADD UNIQUE KEY `email_18` (`email`),
  ADD UNIQUE KEY `email_19` (`email`),
  ADD UNIQUE KEY `email_20` (`email`),
  ADD UNIQUE KEY `email_21` (`email`),
  ADD UNIQUE KEY `email_22` (`email`),
  ADD UNIQUE KEY `email_23` (`email`),
  ADD UNIQUE KEY `email_24` (`email`),
  ADD UNIQUE KEY `email_25` (`email`),
  ADD UNIQUE KEY `email_26` (`email`),
  ADD UNIQUE KEY `email_27` (`email`),
  ADD UNIQUE KEY `email_28` (`email`),
  ADD UNIQUE KEY `email_29` (`email`),
  ADD UNIQUE KEY `email_30` (`email`),
  ADD UNIQUE KEY `email_31` (`email`),
  ADD UNIQUE KEY `google_id` (`google_id`),
  ADD UNIQUE KEY `idx_users_google_id` (`google_id`),
  ADD UNIQUE KEY `google_id_2` (`google_id`),
  ADD UNIQUE KEY `google_id_3` (`google_id`),
  ADD UNIQUE KEY `google_id_4` (`google_id`),
  ADD UNIQUE KEY `google_id_5` (`google_id`),
  ADD UNIQUE KEY `google_id_6` (`google_id`),
  ADD UNIQUE KEY `google_id_7` (`google_id`),
  ADD UNIQUE KEY `google_id_8` (`google_id`),
  ADD UNIQUE KEY `google_id_9` (`google_id`),
  ADD UNIQUE KEY `google_id_10` (`google_id`),
  ADD UNIQUE KEY `google_id_11` (`google_id`),
  ADD UNIQUE KEY `google_id_12` (`google_id`),
  ADD UNIQUE KEY `google_id_13` (`google_id`),
  ADD UNIQUE KEY `google_id_14` (`google_id`),
  ADD UNIQUE KEY `google_id_15` (`google_id`),
  ADD UNIQUE KEY `google_id_16` (`google_id`),
  ADD UNIQUE KEY `google_id_17` (`google_id`),
  ADD UNIQUE KEY `google_id_18` (`google_id`),
  ADD UNIQUE KEY `google_id_19` (`google_id`),
  ADD UNIQUE KEY `google_id_20` (`google_id`),
  ADD UNIQUE KEY `google_id_21` (`google_id`),
  ADD UNIQUE KEY `google_id_22` (`google_id`),
  ADD UNIQUE KEY `google_id_23` (`google_id`),
  ADD UNIQUE KEY `google_id_24` (`google_id`),
  ADD UNIQUE KEY `google_id_25` (`google_id`),
  ADD UNIQUE KEY `google_id_26` (`google_id`),
  ADD UNIQUE KEY `google_id_27` (`google_id`),
  ADD UNIQUE KEY `google_id_28` (`google_id`),
  ADD UNIQUE KEY `google_id_29` (`google_id`),
  ADD UNIQUE KEY `google_id_30` (`google_id`),
  ADD KEY `users_tenant_id` (`tenant_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `seeder_meta`
--
ALTER TABLE `seeder_meta`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=157;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `blogs`
--
ALTER TABLE `blogs`
  ADD CONSTRAINT `blogs_ibfk_57` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `blogs_ibfk_58` FOREIGN KEY (`category_id`) REFERENCES `blog_categories` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `commissions`
--
ALTER TABLE `commissions`
  ADD CONSTRAINT `commissions_ibfk_85` FOREIGN KEY (`distributor_id`) REFERENCES `distributors` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `commissions_ibfk_86` FOREIGN KEY (`salesman_id`) REFERENCES `salesmen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `commissions_ibfk_87` FOREIGN KEY (`payout_id`) REFERENCES `payouts` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `distributors`
--
ALTER TABLE `distributors`
  ADD CONSTRAINT `distributors_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_ibfk_57` FOREIGN KEY (`salesman_id`) REFERENCES `salesmen` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `leads_ibfk_58` FOREIGN KEY (`distributor_id`) REFERENCES `distributors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `lead_activities`
--
ALTER TABLE `lead_activities`
  ADD CONSTRAINT `lead_activities_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `notification_preferences`
--
ALTER TABLE `notification_preferences`
  ADD CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `payouts`
--
ALTER TABLE `payouts`
  ADD CONSTRAINT `payouts_ibfk_57` FOREIGN KEY (`distributor_id`) REFERENCES `distributors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `payouts_ibfk_58` FOREIGN KEY (`salesman_id`) REFERENCES `salesmen` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `referral_rewards`
--
ALTER TABLE `referral_rewards`
  ADD CONSTRAINT `referral_rewards_ibfk_1` FOREIGN KEY (`referral_code_id`) REFERENCES `referral_codes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `salesmen`
--
ALTER TABLE `salesmen`
  ADD CONSTRAINT `salesmen_ibfk_57` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE,
  ADD CONSTRAINT `salesmen_ibfk_58` FOREIGN KEY (`distributor_id`) REFERENCES `distributors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `support_agent_reviews`
--
ALTER TABLE `support_agent_reviews`
  ADD CONSTRAINT `support_agent_reviews_ibfk_53` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `support_agent_reviews_ibfk_54` FOREIGN KEY (`agent_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `support_tickets`
--
ALTER TABLE `support_tickets`
  ADD CONSTRAINT `support_tickets_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;

--
-- Constraints for table `targets`
--
ALTER TABLE `targets`
  ADD CONSTRAINT `targets_ibfk_57` FOREIGN KEY (`distributor_id`) REFERENCES `distributors` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `targets_ibfk_58` FOREIGN KEY (`salesman_id`) REFERENCES `salesmen` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `ticket_messages`
--
ALTER TABLE `ticket_messages`
  ADD CONSTRAINT `ticket_messages_ibfk_53` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `ticket_messages_ibfk_54` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE NO ACTION ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
