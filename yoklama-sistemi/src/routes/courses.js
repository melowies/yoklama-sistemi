//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\routes\courses.js
import express from "express";
import pool from "../database/db.js"; 
import fs from 'fs';
import path from 'path';
import xlsx from "xlsx";

const router = express.Router();

// ✅ GET /api/courses/:email → Öğretmenin derslerini getir
router.get("/api/courses/:email", async (req, res) => {
  const email = req.params.email;

  try {
    const teacherResult = await pool.query(
      "SELECT id FROM teachers WHERE email = $1",
      [email]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ message: "Öğretmen bulunamadı." });
    }

    const teacherId = teacherResult.rows[0].id;

    const coursesResult = await pool.query(
      "SELECT id, code, name FROM courses WHERE teacher_id = $1",
      [teacherId]
    );

    const courses = coursesResult.rows;
    res.json({ courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

// ✅ POST /api/courses → Yeni ders ekle
router.post("/api/courses", async (req, res) => {
  const { email, courseCode, courseName } = req.body;

  if (!email || !courseCode || !courseName) {
    return res.status(400).json({ message: "Eksik bilgi gönderildi." });
  }

  try {
    const teacherResult = await pool.query(
      "SELECT id FROM teachers WHERE email = $1",
      [email]
    );

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ message: "Öğretmen bulunamadı." });
    }

    const teacherId = teacherResult.rows[0].id;

    // Aynı dersi tekrar eklememek için kontrol et
    const existing = await pool.query(
      "SELECT * FROM courses WHERE code = $1 AND teacher_id = $2",
      [courseCode, teacherId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Bu ders kodu zaten var." });
    }

    // Yeni ders ekle
    await pool.query(
      "INSERT INTO courses (code, name, teacher_id) VALUES ($1, $2, $3)",
      [courseCode, courseName, teacherId]
    );

    // Tüm dersleri geri döndür
    const updatedCourses = await pool.query(
      "SELECT id, code, name FROM courses WHERE teacher_id = $1",
      [teacherId]
    );

    const courses = updatedCourses.rows;
    res.json({ message: "Ders eklendi", courses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// DELETE /api/courses/:id → Ders silme
// DELETE /api/courses/:id → Ders silme
router.delete("/api/courses/:id", async (req, res) => {
  const courseId = req.params.id;
  const teacherEmail = req.query.email;

  console.log("Ders silme isteği:", { courseId, teacherEmail });

  if (!courseId || !teacherEmail) {
    return res.status(400).json({ message: "Eksik bilgi gönderildi." });
  }

  try {
    // Öğretmeni doğrula
    const teacherResult = await pool.query(
      "SELECT id FROM teachers WHERE email = $1",
      [teacherEmail]
    );

    console.log("Öğretmen sorgusu sonucu:", teacherResult.rows);

    if (teacherResult.rows.length === 0) {
      return res.status(404).json({ message: "Öğretmen bulunamadı." });
    }

    const teacherId = teacherResult.rows[0].id;

    // Dersin bu öğretmene ait olduğunu doğrula
    const courseResult = await pool.query(
      "SELECT code FROM courses WHERE id = $1 AND teacher_id = $2",
      [courseId, teacherId]
    );

    console.log("Ders sorgusu sonucu:", courseResult.rows);

    if (courseResult.rows.length === 0) {
      return res.status(403).json({ message: "Bu dersi silme yetkiniz yok." });
    }

    const courseCode = courseResult.rows[0].code;

    // Ders klasörlerini sil
    const pendingDir = path.join("uploads", "face_data", `${courseCode}-pending`);
    const approvedDir = path.join("uploads", "face_data", `${courseCode}-approved`);

    console.log("Silinecek klasörler:", { pendingDir, approvedDir });

    // Klasörleri sil (varsa)
    try {
      if (fs.existsSync(pendingDir)) {
        fs.rmSync(pendingDir, { recursive: true, force: true });
        console.log("Pending klasörü silindi");
      }
    } catch (folderErr) {
      console.error("Pending klasörü silinirken hata:", folderErr);
    }

    try {
      if (fs.existsSync(approvedDir)) {
        fs.rmSync(approvedDir, { recursive: true, force: true });
        console.log("Approved klasörü silindi");
      }
    } catch (folderErr) {
      console.error("Approved klasörü silinirken hata:", folderErr);
    }

    // Dersi veritabanından sil (cascade ile öğrenciler de silinecek)
    const deleteResult = await pool.query("DELETE FROM courses WHERE id = $1", [courseId]);
    console.log("Ders silme sonucu:", deleteResult);

    // Güncel ders listesini döndür
    const updatedCourses = await pool.query(
      "SELECT id, code, name FROM courses WHERE teacher_id = $1",
      [teacherId]
    );

    res.json({ 
      message: "Ders ve ilgili tüm öğrenci kayıtları silindi.", 
      courses: updatedCourses.rows 
    });
  } catch (err) {
    console.error("Ders silme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası: " + err.message });
  }
});

// GET /api/courses/:code/files → Get course attendance files
router.get("/api/courses/:code/files", async (req, res) => {
  const courseCode = req.params.code;
  
  try {
    // Validate course code
    const courseResult = await pool.query(
      "SELECT id FROM courses WHERE code = $1",
      [courseCode]
    );
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Find attendance files
    const folder = path.join("uploads", courseCode);
    let files = [];
    
    if (fs.existsSync(folder)) {
      files = fs.readdirSync(folder)
        .filter(file => file.endsWith('.xlsx'))
        .map(file => `${courseCode}/${file}`);
    }
    
    res.json({ files });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/courses/:code/pending-students → Get pending students
router.get("/api/courses/:code/pending-students", async (req, res) => {
  const courseCode = req.params.code;
  
  try {
    // Get course ID
    const courseResult = await pool.query(
      "SELECT id FROM courses WHERE code = $1",
      [courseCode]
    );
    
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    const courseId = courseResult.rows[0].id;
    
    // Get pending students
    const pendingStudents = await pool.query(
      "SELECT * FROM students WHERE course_id = $1 AND is_approved = false",
      [courseId]
    );
    
    res.json({ students: pendingStudents.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/api/courses/:code/export", async (req, res) => {
  const courseCode = req.params.code;

  try {
    const courseResult = await pool.query("SELECT id FROM courses WHERE code = $1", [courseCode]);
    if (courseResult.rows.length === 0) return res.status(404).json({ message: "Ders bulunamadı" });

    const courseId = courseResult.rows[0].id;

    const students = await pool.query(
      "SELECT name, student_no, email FROM students WHERE course_id = $1 AND is_approved = true",
      [courseId]
    );

    const data = students.rows.map((s) => ({
      "Ad Soyad": s.name,
      "Öğrenci No": s.student_no,
      "E-posta": s.email,
    }));

    const ws = xlsx.utils.json_to_sheet(data);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Onaylı Öğrenciler");

    const buffer = xlsx.write(wb, { type: "buffer", bookType: "xlsx" });

    res.setHeader("Content-Disposition", `attachment; filename=${courseCode}-ogrenciler.xlsx`);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.send(buffer);
  } catch (err) {
    console.error("Excel export hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});


export default router;