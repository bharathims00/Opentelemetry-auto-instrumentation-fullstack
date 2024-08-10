const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'Admin_user',     // Replace with your MySQL username
    password: 'Admin@123', // Replace with your MySQL password
    database: 'demoProject'   // Replace with your MySQL database name
});

connection.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err.stack);
        return;
    }
    console.log('Connected to MySQL as id ' + connection.threadId);

    // Create users table if it doesn't exist
    connection.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `, (err, results) => {
        if (err) throw err;

        // Insert a sample user (username: user, password: pass)
        const query = 'INSERT IGNORE INTO users (username, password) VALUES (?, ?)';
        connection.query(query, ['user', 'pass'], (err, results) => {
            if (err) throw err;
        });
    });
});

module.exports = connection;
