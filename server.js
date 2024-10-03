require('./trace.js');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database');
const { setTenantId } = require('./trace'); // Import the setTenantId function

const app = express();
const port = 3080;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// Middleware to set the tenant ID in the context
app.use((req, res, next) => {
  const tenantId = req.headers['x-tenant-id']; // Adjust based on how you receive the tenant ID
  if (tenantId) {
    // Set tenant ID in context
    setTenantId(tenantId);
  }
  next();
});

// A simple route to demonstrate tracing
app.get('/', (req, res) => {
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
            const user = results[0]; // Get the first result (the user)
            res.send(`Welcome, ${user.username}! Your tenant ID is ${user.tenant_id}.`);
        } else {
            res.send('Invalid credentials. Please try again.');
        }
    });
});

// Handle user registration
app.post('/register', (req, res) => {
    const { username, password, tenant_id } = req.body; // Added tenant_id to the destructured request body

    db.query("SELECT * FROM users WHERE username = ?", [username], (err, results) => {
        if (err) {
            return res.status(500).send('Error occurred during registration.');
        }
        if (results.length > 0) {
            res.send('Username already exists. Please choose a different username.');
        } else {
            db.query("INSERT INTO users (username, password, tenant_id) VALUES (?, ?, ?)", [username, password, tenant_id], (err, results) => {
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
