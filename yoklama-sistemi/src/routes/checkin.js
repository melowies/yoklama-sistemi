// C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\routes\checkin.js
import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import pool from "../database/db.js";

const router = express.Router();

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const { courseCode } = req.body;
    const folder = path.join("uploads", "face_data", `${courseCode}-pending`);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder, { recursive: true });
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const upload = multer({ storage });

router.post("/api/checkin", upload.single("photo"), async (req, res) => {
  const { name, student_no, lat, lng, courseCode } = req.body;
  const photoPath = req.file?.path;

  console.log("🧾 Gelen veri:", {
    name,
    student_no,
    lat,
    lng,
    courseCode,
    file: req.file,
  });

  if (!name || !student_no || !lat || !lng || !courseCode || !photoPath) {
    return res.status(400).json({ message: "Eksik bilgi gönderildi." });
  }

  try {
    const course = await pool.query(
      "SELECT id, teacher_id FROM courses WHERE code = $1",
      [courseCode]
    );

    if (course.rows.length === 0) {
      return res.status(404).json({ message: "Ders bulunamadı." });
    }

    const courseId = course.rows[0].id;

    const exists = await pool.query(
      "SELECT * FROM students WHERE student_no = $1 AND course_id = $2",
      [student_no, courseId]
    );

    if (exists.rows.length > 0) {
      if (exists.rows[0].is_approved) {
        return res.status(400).json({ message: "Bu öğrenci zaten onaylanmış." });
      } else {
        return res.status(400).json({ message: "Bu öğrenci zaten beklemede." });
      }
    }

    await pool.query(
      "INSERT INTO students (name, student_no, course_id, face_image, is_approved) VALUES ($1, $2, $3, $4, false)",
      [name, student_no, courseId, req.file.filename]
    );

    res.json({ success: true, message: "Başvuru başarıyla alındı. Onay bekliyor." });
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

export default router;
