// C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\server.js
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

import checkinRouter from './src/routes/checkin.js';
import filesRouter from './src/routes/files.js';
import coursesRouter from './src/routes/courses.js';
import authRouter from './src/routes/auth.js';
import studentsRouter from './src/routes/students.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5000;

const corsOptions = {
  origin: "http://localhost:5173", // Frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"], 
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ Static upload dosyalarını sunmak için
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ✅ Routerları bağla
app.use(checkinRouter);
app.use(filesRouter);
app.use(coursesRouter);
app.use(authRouter);
app.use(studentsRouter);

// ✅ users.json dosyası
const USERS_PATH = path.join(__dirname, 'data', 'users.json');

const ensureUserDataFile = () => {
  const dir = path.dirname(USERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(USERS_PATH)) fs.writeFileSync(USERS_PATH, '[]', 'utf-8');
};
ensureUserDataFile();

const readUsers = () => {
  if (!fs.existsSync(USERS_PATH)) return [];
  const data = fs.readFileSync(USERS_PATH, 'utf-8');
  return JSON.parse(data);
};

const saveUsers = (users) => {
  const dir = path.dirname(USERS_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2), 'utf-8');
};

app.post('/api/register', (req, res) => {
  const { email, password, fullName } = req.body;

  if (!fullName || !email || !password) {
    return res.status(400).json({ message: "Tüm alanlar zorunludur." });
  }
  
  if (!email.endsWith('@tarsus.edu.tr')) {
    return res.status(400).json({ message: 'Sadece okul e-postası geçerlidir.' });
  }

  const users = readUsers();
  const userExists = users.find((u) => u.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'Bu e-posta zaten kayıtlı.' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  users.push({ email, password: hashedPassword , fullName});
  saveUsers(users);

  res.json({ message: 'Kayıt başarılı' });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const users = readUsers();
  const user = users.find((u) => u.email === email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: 'Geçersiz e-posta veya şifre.' });
  }

  const token = jwt.sign({ email }, 'selininSirri123', { expiresIn: '2h' });
  res.json({ message: 'Giriş başarılı', token, fullName: user.fullName });
  console.log("Giriş yapan kullanıcı:", user.fullName);
});

app.listen(port, () => {
  console.log(`✅ Sunucu ${port} portunda çalışıyor`);
});
