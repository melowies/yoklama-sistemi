//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\routes\auth.js
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../database/db.js';
import authenticateToken from '../../middleware/verifyToken.js';

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

router.put('/api/teachers/update-name', authenticateToken, async (req, res) => {
  const { fullName } = req.body;

  try {
    const teacher = await pool.query(
      'UPDATE teachers SET full_name = $1 WHERE email = $2 RETURNING full_name',
      [fullName, req.user.email]
    );

    res.json({ fullName: teacher.rows[0].full_name });
  } catch (err) {
    console.error("İsim güncelleme hatası:", err);
    res.status(500).json({ message: 'İsim güncellenemedi.' });
  }

  router.put('/api/teachers/update-password', authenticateToken, async (req, res) => {
    const { password } = req.body;
  
    try {
      const hashed = bcrypt.hashSync(password, 10);
      await pool.query('UPDATE teachers SET password = $1 WHERE email = $2', [hashed, req.user.email]);
      res.json({ message: 'Şifre başarıyla güncellendi.' });
    } catch (err) {
      console.error("Şifre güncelleme hatası:", err);
      res.status(500).json({ message: 'Şifre güncellenemedi.' });
    }
  });  
});


export default router;
