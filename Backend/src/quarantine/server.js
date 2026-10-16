import express from 'express';
import mysql from 'mysql2/promise';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5001;

// Koneksi ke Database MySQL
const db = await mysql.createConnection({
  host: process.env.MYSQL_HOST || 'localhost',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'rootpassword',
  database: process.env.MYSQL_DATABASE || 'auth_db'
});

// Setup tabel users jika belum ada
await db.query(`
  CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`);

// Endpoint Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const [result] = await db.query(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password]
    );

    res.status(201).json({ 
      message: 'User registered successfully', 
      userId: result.insertId 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const [rows] = await db.query(
      'SELECT id, username, email FROM users WHERE email = ? AND password = ?',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    res.json({ message: 'Login successful', user: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => console.log(`[Auth-Service] Running on port ${PORT}`));