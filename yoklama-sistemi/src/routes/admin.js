//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\routes\admin.js
import express from 'express';
import pool from '../database/db.js';
import authenticateToken from '../middleware/verifyToken.js'; 
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET || 'selininSirri123';

const router = express.Router();

// 📌 Admin ekleme (sadece bir kere kullanılacak, sonra yoruma alırız)
router.post('/api/admin/create-admin', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password || !email.endsWith('@tarsus.edu.tr')) {
    return res.status(400).json({ message: 'Geçerli bir admin bilgisi giriniz.' });
  }

  try {
    const existing = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Bu admin zaten var.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    await pool.query('INSERT INTO admins (email, password) VALUES ($1, $2)', [email, hashedPassword]);
    res.json({ message: 'Admin başarıyla oluşturuldu.' });
  } catch (err) {
    console.error('Admin oluşturma hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 🛡️ Admin giriş
router.post('/api/admin/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM admins WHERE email = $1', [email]);
    const admin = result.rows[0];

    if (!admin || !bcrypt.compareSync(password, admin.password)) {
      return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
    }

    const token = jwt.sign({ email: admin.email }, SECRET_KEY, { expiresIn: '2h' });
    res.json({ message: 'Giriş başarılı', token });
  } catch (err) {
    console.error('Admin login hatası:', err);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// 📋 Admin onayı için öğretmenleri listeleme
router.get('/api/admin/teachers', authenticateToken, async (req, res) => {
  try {
    const teachers = await pool.query('SELECT id, full_name, email, is_approved FROM teachers WHERE is_approved = false');
    res.json(teachers.rows); 
  } catch (err) {
    console.error('Öğretmen listesi alma hatası:', err);
    res.status(500).json({ message: 'Veriler alınamadı.' });
  }
});

// ✅ Admin onayıyla öğretmeni aktif hale getirme
router.put('/api/admin/approve-teacher/:id', authenticateToken, async (req, res) => {
  const teacherId = req.params.id;

  try {
    await pool.query('UPDATE teachers SET is_approved = true WHERE id = $1', [teacherId]);
    res.json({ message: 'Öğretmen başarıyla onaylandı.' });
  } catch (err) {
    console.error('Öğretmen onaylama hatası:', err);
    res.status(500).json({ message: 'Öğretmen onayı yapılamadı.' });
  }
});

// ❌ Admin reddiyle öğretmen kaydını silme
router.delete('/api/admin/reject-teacher/:id', authenticateToken, async (req, res) => {
  const teacherId = req.params.id;

  try {
    await pool.query('DELETE FROM teachers WHERE id = $1', [teacherId]);
    res.json({ message: 'Öğretmen başarıyla reddedildi.' });
  } catch (err) {
    console.error('Öğretmen reddetme hatası:', err);
    res.status(500).json({ message: 'Öğretmen reddi yapılamadı.' });
  }
});

export default router;
