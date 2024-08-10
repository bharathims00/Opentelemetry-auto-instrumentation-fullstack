require('./trace.js');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');


const app = express();
const port = 3080;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// A simple route to demonstrate tracing
app.get('/', (req, res) => {
    // Start a new span
    const span = trace.getTracer('default').startSpan('handle_request');
    res.send('Hello, world!');
    span.end(); // End the span after the response is sent
  });
  


// Route for serving the login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle login requests
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.query("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, results) => {
        if (err) {
            return res.status(500).send('Error occurred during login.');
        }
        if (results.length > 0) {
            res.send(`Welcome, ${username}!`);
        } else {
            res.send('Invalid credentials. Please try again.');
        }
    });
});

// Handle user registration
app.post('/register', (req, res) => {
    const { username, password } = req.body;

    // Check if the username already exists
    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) {
            return res.status(500).send('Error occurred during registration.');
        }
        if (results.length > 0) {
            res.send('Username already exists. Please choose a different username.');
        } else {
            // Insert the new user into the database
            db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, password], (err, results) => {
                if (err) {
                    return res.status(500).send('Error occurred during registration.');
                }
                res.send('Registration successful. You can now log in.');
            });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
