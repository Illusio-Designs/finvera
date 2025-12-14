-- Fix Database Schema
-- Run this to remove old constraints and recreate tables

USE finvera_db;

-- Drop the commissions table to recreate it without the old FK constraint
DROP TABLE IF EXISTS `commissions`;

-- Optional: If you want to completely reset the database
-- Uncomment the following lines:
-- DROP DATABASE IF EXISTS finvera_db;
-- DROP DATABASE IF EXISTS finvera_master;
-- CREATE DATABASE finvera_db;
-- CREATE DATABASE finvera_master;

-- After running this, restart your Node.js server
-- It will automatically recreate all tables with the correct schema
