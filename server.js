const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./family-tasks.db');

// Create tables
const createTables = () => {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS User (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      email TEXT UNIQUE,
      family_id INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Family (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Task (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      description TEXT,
      due_date TEXT,
      status TEXT,
      family_id INTEGER,
      assigned_to INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS Notification (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      user_id INTEGER,
      message TEXT,
      sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
      read_at TEXT
    )`);
  });
};

createTables();

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// User registration
app.post('/register', async (req, res) => {
  const { username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  db.run(`INSERT INTO User (username, password, email) VALUES (?, ?, ?)`, [username, hashedPassword, email], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// User login
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.get(`SELECT * FROM User WHERE username = ?`, [username], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = jwt.sign({ id: user.id }, 'secret_key');
    res.status(200).json({ token });
  });
});

// Create family
app.post('/family', (req, res) => {
  const { name } = req.body;

  db.run(`INSERT INTO Family (name) VALUES (?)`, [name], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Join family
app.post('/family/join', (req, res) => {
  const { userId, familyId } = req.body;

  db.run(`UPDATE User SET family_id = ? WHERE id = ?`, [familyId, userId], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(200).json({ message: 'Joined family successfully' });
  });
});

// Create task
app.post('/task', (req, res) => {
  const { title, description, due_date, family_id, assigned_to } = req.body;

  db.run(`INSERT INTO Task (title, description, due_date, family_id, assigned_to, status) VALUES (?, ?, ?, ?, ?, ?)`, [title, description, due_date, family_id, assigned_to, 'pending'], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Mark task as completed
app.post('/task/complete', (req, res) => {
  const { taskId } = req.body;

  db.run(`UPDATE Task SET status = ? WHERE id = ?`, ['completed', taskId], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(200).json({ message: 'Task marked as completed' });
  });
});

// Get tasks for a family
app.get('/tasks/:familyId', (req, res) => {
  const { familyId } = req.params;

  db.all(`SELECT * FROM Task WHERE family_id = ?`, [familyId], (err, tasks) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(200).json(tasks);
  });
});

// Create notification
app.post('/notification', (req, res) => {
  const { task_id, user_id, message } = req.body;

  db.run(`INSERT INTO Notification (task_id, user_id, message) VALUES (?, ?, ?)`, [task_id, user_id, message], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID });
  });
});

// Get notifications for a user
app.get('/notifications/:userId', (req, res) => {
  const { userId } = req.params;

  db.all(`SELECT * FROM Notification WHERE user_id = ?`, [userId], (err, notifications) => {
    if (err) {
      return res.status(400).json({ error: err.message });n    }
    res.status(200).json(notifications);
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});