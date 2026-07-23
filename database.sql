-- Run this file inside the Azure MySQL database
-- selected in your .env file.
-- The shared Azure database already exists,
-- so this file does not create another database.

-- =========================================
-- Users
-- Stores Customer, Staff and Admin accounts
-- =========================================
CREATE TABLE IF NOT EXISTS users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Customer', 'Staff', 'Admin') NOT NULL
);

-- =========================================
-- Dogs
-- Stores dogs created by Staff
-- =========================================
CREATE TABLE IF NOT EXISTS dogs (
    dogId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    breed VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
    status ENUM('Available', 'Adopted')
        NOT NULL DEFAULT 'Available'
);

-- =========================================
-- Adoption Requests
-- Stores Customer adoption requests
-- =========================================
CREATE TABLE IF NOT EXISTS adoption_requests (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    dogId INT NOT NULL,
    requestStatus ENUM(
        'Pending',
        'Accepted',
        'Denied',
        'Closed'
    ) NOT NULL DEFAULT 'Pending',
    requestDate DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_customer_dog_request
        UNIQUE (userId, dogId),

    FOREIGN KEY (userId)
        REFERENCES users(userId)
        ON DELETE CASCADE,

    FOREIGN KEY (dogId)
        REFERENCES dogs(dogId)
        ON DELETE CASCADE
);

-- =========================================
-- Reviews
-- Stores reviews submitted by Customers
-- =========================================
CREATE TABLE IF NOT EXISTS reviews (
    reviewId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    title VARCHAR(120) NOT NULL,
    rating TINYINT NOT NULL,
    comment TEXT NOT NULL,
    createdAt DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME
        NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (userId)
        REFERENCES users(userId)
        ON DELETE CASCADE
);

-- =========================================
-- Default Admin Account
-- Email: admin@petadopt.com
-- Password: Admin123
-- =========================================
INSERT INTO users (
    name,
    email,
    phone,
    password,
    role
)
SELECT
    'System Admin',
    'admin@petadopt.com',
    '00000000',
    SHA1('Admin123'),
    'Admin'
WHERE NOT EXISTS (
    SELECT 1
    FROM users
    WHERE email = 'admin@petadopt.com'
);