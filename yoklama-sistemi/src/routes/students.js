//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\routes\students.js
import express from "express";
import pool from "../database/db.js";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";

const router = express.Router();

// ✅ POST /api/students → Yeni başvuru al
router.post("/api/students", async (req, res) => {
  const { name, student_no, email, face_image, course_name, teacher_email } = req.body;

  if (!name || !student_no || !course_name || !teacher_email) {
    return res.status(400).json({ message: "Eksik bilgi gönderildi." });
  }

  try {
    const teacher = await pool.query("SELECT id FROM teachers WHERE email = $1", [teacher_email]);
    if (teacher.rows.length === 0) return res.status(404).json({ message: "Öğretmen bulunamadı." });

    const teacherId = teacher.rows[0].id;

    const course = await pool.query(
      "SELECT id, code FROM courses WHERE name = $1 AND teacher_id = $2",
      [course_name, teacherId]
    );
    if (course.rows.length === 0) return res.status(404).json({ message: "Ders bulunamadı." });

    const courseId = course.rows[0].id;
    const courseCode = course.rows[0].code;

    const existing = await pool.query(
      "SELECT * FROM students WHERE student_no = $1 AND course_id = $2",
      [student_no, courseId]
    );

    if (existing.rows.length > 0) {
      const msg = existing.rows[0].is_approved
        ? "Bu öğrenci zaten kayıtlı ve onaylı."
        : "Bu öğrenci zaten beklemede.";
      return res.status(400).json({ message: msg });
    }

    const pendingDir = path.join("uploads", "face_data", `${courseCode}-pending`);
    if (!fs.existsSync(pendingDir)) fs.mkdirSync(pendingDir, { recursive: true });

    let fileName = null;
    let dbImagePath = null;

    if (face_image?.startsWith("data:image")) {
      const base64Data = face_image.replace(/^data:image\/\w+;base64,/, "");
      fileName = `${student_no}_${Date.now()}.jpg`;
      const filePath = path.join(pendingDir, fileName);
      fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      dbImagePath = `${courseCode}-pending/${fileName}`;
    }

    await pool.query(
      "INSERT INTO students (name, student_no, email, face_image, course_id, is_approved) VALUES ($1, $2, $3, $4, $5, false)",
      [name, student_no, email, dbImagePath, courseId]
    );

    res.json({ message: "Öğrenci eşleşmedi. Onay bekleyen listeye eklendi. ⏳", approved: false });
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

// ✅ POST /api/students/:id/approve → Onayla ve Excel'e yaz
router.post("/api/students/:id/approve", async (req, res) => {
  const studentId = req.params.id;
  const { image } = req.body;

  try {
    const result = await pool.query(
      "SELECT s.*, c.code FROM students s JOIN courses c ON s.course_id = c.id WHERE s.id = $1",
      [studentId]
    );
    if (result.rows.length === 0) return res.status(404).json({ message: "Öğrenci bulunamadı." });

    const student = result.rows[0];
    const courseCode = student.code;

    // 📂 Fotoğrafı taşı
    const approvedDir = path.join("uploads", "face_data", `${courseCode}-approved`);
    if (!fs.existsSync(approvedDir)) fs.mkdirSync(approvedDir, { recursive: true });

    let newImagePath = student.face_image;

    if (student.face_image) {
      const oldPath = path.join("uploads", "face_data", `${courseCode}-pending`, image);
      const fileName = path.basename(student.face_image);
      const newPath = path.join(approvedDir, fileName);

      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        newImagePath = `${courseCode}-approved/${fileName}`;
      }
    }

    // 📅 Excel dosyasına yaz
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const fileName = `${courseCode} - ${formattedDate}.xlsx`;
    const courseDir = path.join("uploads", `${courseCode}`);
    if (!fs.existsSync(courseDir)) fs.mkdirSync(courseDir, { recursive: true });
    const excelPath = path.join(courseDir, fileName);

    let data = [];
    if (fs.existsSync(excelPath)) {
      const wb = xlsx.readFile(excelPath);
      const ws = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
      data = ws;
    }

    data.push({
      AdSoyad: student.name,
      Numara: student.student_no,
      Tarih: formattedDate,
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(data);
    xlsx.utils.book_append_sheet(wb, ws, "Yoklama");
    xlsx.writeFile(wb, excelPath);

    // ✅ Veritabanında güncelle
    await pool.query(
      "UPDATE students SET face_image = $1, is_approved = true WHERE id = $2",
      [newImagePath, studentId]
    );

    res.json({ message: "✅ Öğrenci onaylandı ve Excel'e eklendi." });
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).json({ message: "Onaylama sırasında hata oluştu" });
  }
});

// ❌ POST /api/students/:id/reject → Reddet ve sil
router.post("/api/students/:id/reject", async (req, res) => {
  const studentId = req.params.id;
  const { image, courseCode } = req.body;

  try {
    const result = await pool.query("DELETE FROM students WHERE id = $1", [studentId]);

    if (result.rowCount > 0) {
      const photoPath = path.join("uploads", "face_data", `${courseCode}-pending`, image);
      if (fs.existsSync(photoPath)) {
        fs.unlinkSync(photoPath);
      }
      res.json({ message: "Öğrenci reddedildi ve silindi ❌" });
    } else {
      res.status(404).json({ message: "Öğrenci bulunamadı" });
    }
  } catch (err) {
    console.error("Silme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});


// ✅ GET /api/students/:courseCode → Tüm öğrencileri getir
router.get("/api/students/:courseCode", async (req, res) => {
  const courseCode = req.params.courseCode;

  try {
    const result = await pool.query("SELECT id FROM courses WHERE code = $1", [courseCode]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Ders bulunamadı." });

    const courseId = result.rows[0].id;

    const [approved, pending] = await Promise.all([
      pool.query("SELECT * FROM students WHERE course_id = $1 AND is_approved = true", [courseId]),
      pool.query("SELECT * FROM students WHERE course_id = $1 AND is_approved = false", [courseId])
    ]);

    res.json({
      approvedStudents: approved.rows,
      pendingStudents: pending.rows
    });
  } catch (err) {
    console.error("Hata:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
});

export default router;
