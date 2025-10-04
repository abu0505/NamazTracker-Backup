-- Manual PostgreSQL setup for Namaz Tracker
-- Run these commands in pgAdmin or psql terminal

-- Create database user (if not exists)
CREATE USER namaz_user WITH PASSWORD 'namaz_password';

-- Create database owned by the user
CREATE DATABASE namaz_tracker OWNER namaz_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE namaz_tracker TO namaz_user;

-- Connect to the new database
\c namaz_tracker

-- Create necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Exit
\q
