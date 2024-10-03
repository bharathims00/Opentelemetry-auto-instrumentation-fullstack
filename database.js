const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'Admin_user',     // Replace with your MySQL username
    password: 'Admin@123',  // Replace with your MySQL password
    database: 'demoproject1' // Make sure this database exists
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
            password VARCHAR(255) NOT NULL,
            tenant_id INT NOT NULL
        )
    `, (err, results) => {
        if (err) throw err;

        // Insert a sample user (username: user, password: pass, tenant_id: 1)
        const query = 'INSERT IGNORE INTO users (username, password, tenant_id) VALUES (?, ?, ?)';
        connection.query(query, ['user', 'pass', 1], (err, results) => {
            if (err) throw err;
        });
    });
});

module.exports = connection;
