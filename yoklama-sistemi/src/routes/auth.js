//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\routes\auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db.js';

const router = express.Router();
const SECRET_KEY = process.env.JWT_SECRET || 'selininSirri123';

// Öğretmen kaydı
router.post('/api/register', async (req, res) => {
  const { email, password, fullName } = req.body;

  if (!email || !password || !fullName || !email.endsWith('@tarsus.edu.tr')) {
    return res.status(400).json({ message: 'Geçerli bilgi giriniz.' });
  }

  try {
    const existing = await pool.query('SELECT * FROM teachers WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
    }

    const hashed = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO teachers (email, password, full_name) VALUES ($1, $2, $3)', [email, hashed, fullName]);
    res.json({ message: 'Kayıt başarılı' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Giriş
router.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM teachers WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }
    const token = jwt.sign({ email: user.email }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ message: 'Giriş başarılı', token, fullName: user.full_name });
  } catch (err) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

export default router;
