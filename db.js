require('dotenv').config();

const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: process.env.DB_SSL === 'true'
        ? { rejectUnauthorized: true }
        : undefined
});

connection.connect((error) => {
    if (error) {
        console.error('Database connection failed:', error.message);
        return;
    }

    console.log('Connected to MySQL database');
});

module.exports = connection;
