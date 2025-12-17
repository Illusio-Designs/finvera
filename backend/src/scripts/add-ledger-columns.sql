-- SQL script to add missing columns to ledgers table
-- Run this on each tenant/company database
-- Note: If a column already exists, the statement will fail - that's okay, just continue

-- Add currency column (ignore error if exists)
ALTER TABLE `ledgers` 
ADD COLUMN `currency` VARCHAR(3) NULL DEFAULT 'INR' AFTER `email`;

-- Add opening_balance_date column
ALTER TABLE `ledgers` 
ADD COLUMN `opening_balance_date` DATE NULL AFTER `opening_balance_type`;

-- Add description column
ALTER TABLE `ledgers` 
ADD COLUMN `description` TEXT NULL AFTER `email`;

-- Add additional_fields JSON column
ALTER TABLE `ledgers` 
ADD COLUMN `additional_fields` JSON NULL COMMENT 'Stores dynamic fields based on account group type' AFTER `description`;

-- Add country column
ALTER TABLE `ledgers` 
ADD COLUMN `country` VARCHAR(100) NULL AFTER `pincode`;

-- Add bank detail columns
ALTER TABLE `ledgers` 
ADD COLUMN `bank_name` VARCHAR(255) NULL AFTER `email`,
ADD COLUMN `bank_account_number` VARCHAR(50) NULL AFTER `bank_name`,
ADD COLUMN `bank_ifsc_code` VARCHAR(11) NULL AFTER `bank_account_number`,
ADD COLUMN `bank_branch` VARCHAR(255) NULL AFTER `bank_ifsc_code`,
ADD COLUMN `bank_account_type` VARCHAR(50) NULL AFTER `bank_branch`;

-- Add shipping location columns
ALTER TABLE `ledgers` 
ADD COLUMN `shipping_location_name` VARCHAR(255) NULL AFTER `bank_account_type`,
ADD COLUMN `shipping_address` TEXT NULL AFTER `shipping_location_name`,
ADD COLUMN `shipping_city` VARCHAR(100) NULL AFTER `shipping_address`,
ADD COLUMN `shipping_state` VARCHAR(100) NULL AFTER `shipping_city`,
ADD COLUMN `shipping_pincode` VARCHAR(10) NULL AFTER `shipping_state`,
ADD COLUMN `shipping_country` VARCHAR(100) NULL AFTER `shipping_pincode`;
