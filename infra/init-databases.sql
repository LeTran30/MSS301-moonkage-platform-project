-- ============================================
-- Bake2B Platform — Database Initialization
-- Creates 4 logical databases for microservices
-- ============================================

CREATE DATABASE identity_db;
CREATE DATABASE catalog_db;
CREATE DATABASE tender_db;
CREATE DATABASE order_db;

-- Grant all privileges to the bake2b user
GRANT ALL PRIVILEGES ON DATABASE identity_db TO bake2b;
GRANT ALL PRIVILEGES ON DATABASE catalog_db TO bake2b;
GRANT ALL PRIVILEGES ON DATABASE tender_db TO bake2b;
GRANT ALL PRIVILEGES ON DATABASE order_db TO bake2b;
