const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Database setup
const dbPath = path.join(__dirname, 'data', 'family_tasks.db');
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Lỗi kết nối SQLite:', err.message);
  } else {
    console.log('Đã kết nối cơ sở dữ liệu SQLite.');
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS families (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT,
      family_id INTEGER,
      FOREIGN KEY(family_id) REFERENCES families(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      due_date TEXT,
      status TEXT DEFAULT 'pending',
      family_id INTEGER,
      assigned_to TEXT,
      FOREIGN KEY(family_id) REFERENCES families(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id INTEGER,
      user_id INTEGER,
      message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      read_at DATETIME,
      FOREIGN KEY(task_id) REFERENCES tasks(id),
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    // Thêm dữ liệu mẫu nếu chưa có
    db.get("SELECT COUNT(*) as count FROM families", (err, row) => {
      if (row.count === 0) {
        db.run("INSERT INTO families (name) VALUES ('Gia đình Hạnh Phúc')", function(err) {
          const famId = this.lastID;
          db.run(`INSERT INTO users (username, password, email, family_id) VALUES ('admin', '123456', 'admin@family.com', ${famId})`);
          db.run(`INSERT INTO users (username, password, email, family_id) VALUES ('con_trai', '123456', 'son@family.com', ${famId})`);
          db.run(`INSERT INTO tasks (title, description, due_date, status, family_id, assigned_to) VALUES ('Dọn dẹp phòng khách', 'Hút bụi và lau nhà sạch sẽ', '2025-12-31', 'pending', ${famId}, 'con_trai')`);
        });
      }
    });
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Endpoints
app.get('/api/families', (req, res) => {
  db.all("SELECT * FROM families", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/families', (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Tên gia đình không được để trống' });
  db.run("INSERT INTO families (name) VALUES (?)", [name], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, name });
  });
});

app.get('/api/users', (req, res) => {
  const { family_id } = req.query;
  let query = "SELECT id, username, email, family_id FROM users";
  let params = [];
  if (family_id) {
    query += " WHERE family_id = ?";
    params.push(family_id);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.get('/api/tasks', (req, res) => {
  const { family_id } = req.query;
  let query = "SELECT * FROM tasks";
  let params = [];
  if (family_id) {
    query += " WHERE family_id = ?";
    params.push(family_id);
  }
  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/tasks', (req, res) => {
  const { title, description, due_date, family_id, assigned_to } = req.body;
  if (!title || !family_id) return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
  const sql = `INSERT INTO tasks (title, description, due_date, status, family_id, assigned_to) VALUES (?, ?, ?, 'pending', ?, ?)`;
  db.run(sql, [title, description, due_date, family_id, assigned_to], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, title, description, due_date, status: 'pending', family_id, assigned_to });
  });
});

app.put('/api/tasks/:id/status', (req, res) => {
  const { status } = req.body;
  const { id } = req.params;
  db.run("UPDATE tasks SET status = ? WHERE id = ?", [status, id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ updated: this.changes });
  });
});

app.delete('/api/tasks/:id', (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM tasks WHERE id = ?", [id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
