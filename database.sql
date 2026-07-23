-- Run this file inside the Azure MySQL database selected in your .env file.
-- It does not create a new database because the shared Azure database already exists.

CREATE TABLE IF NOT EXISTS users (
    userId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('Customer', 'Staff', 'Admin') NOT NULL
);

CREATE TABLE IF NOT EXISTS dogs (
    dogId INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL,
    gender ENUM('Male', 'Female') NOT NULL,
    breed VARCHAR(100) NOT NULL,
    summary TEXT NOT NULL,
    image VARCHAR(255) NOT NULL,
    status ENUM('Available', 'Adopted') NOT NULL DEFAULT 'Available'
);

CREATE TABLE IF NOT EXISTS adoption_requests (
    requestId INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    dogId INT NOT NULL,
    requestStatus ENUM('Pending', 'Accepted', 'Denied', 'Closed')
        NOT NULL DEFAULT 'Pending',
    requestDate DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT unique_customer_dog_request UNIQUE (userId, dogId),

    FOREIGN KEY (userId)
        REFERENCES users(userId)
        ON DELETE CASCADE,

    FOREIGN KEY (dogId)
        REFERENCES dogs(dogId)
        ON DELETE CASCADE
);

-- Default Admin account
-- Email: admin@petadopt.com
-- Password: Admin123
INSERT INTO users (name, email, phone, password, role)
SELECT 'System Admin', 'admin@petadopt.com', '00000000', SHA1('Admin123'), 'Admin'
WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'admin@petadopt.com'
);
