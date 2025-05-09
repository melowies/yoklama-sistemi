// C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\server.js
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import verifyToken from './src/middleware/verifyToken.js';
import adminRoutes from './src/routes/admin.js';
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
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/api/profile', verifyToken, (req, res) => {
  const email = req.user.email;
  res.json({ message: `Merhaba ${email}, profilin burası.` });
});

// ✅ Routerları bağla
app.use(checkinRouter);
app.use(filesRouter);
app.use(coursesRouter);
app.use(authRouter);
app.use(studentsRouter);
app.use(adminRoutes);

app.listen(port, () => {
  console.log(`✅ Sunucu ${port} portunda çalışıyor`);
});
