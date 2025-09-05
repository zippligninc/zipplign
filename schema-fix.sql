-- Schema Fix for Type Mismatch Issues
-- Run this BEFORE running the main updated-schema.sql

-- Drop existing tables with foreign key issues (in correct order)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS follows CASCADE;

-- Now run the updated-schema.sql file to recreate everything properly
