//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\routes\students.js
import express from "express";
import pool from "../database/db.js";
import fs from "fs";
import path from "path";
import xlsx from "xlsx";

// Utility function for consistent file path creation
const getFilePath = (...parts) => path.join(process.cwd(), ...parts);

// Utility function for safe file operations
const safeFileOperation = (operation, errorMessage) => {
  try {
    return operation();
  } catch (error) {
    console.error(`❌ ${errorMessage}: ${error.message}`);
    return null;
  }
};

const router = express.Router();

// ✅ POST /api/students → Yeni başvuru al
router.post("/api/students", async (req, res) => {
  const { name, student_no, email, face_image, course_name, teacher_email } = req.body;

  if (!name || !student_no || !course_name || !teacher_email) {
    return res.status(400).json({ message: "Eksik bilgi gönderildi." });
  }

  try {
    // Öğretmen doğrulama
    const teacher = await pool.query("SELECT id FROM teachers WHERE email = $1", [teacher_email]);
    if (teacher.rows.length === 0) {
      console.log(`⚠️ Öğretmen bulunamadı: ${teacher_email}`);
      return res.status(404).json({ message: "Öğretmen bulunamadı." });
    }

    const teacherId = teacher.rows[0].id;

    // Ders doğrulama
    const course = await pool.query(
      "SELECT id, code FROM courses WHERE name = $1 AND teacher_id = $2",
      [course_name, teacherId]
    );
    if (course.rows.length === 0) {
      console.log(`⚠️ Ders bulunamadı: ${course_name}`);
      return res.status(404).json({ message: "Ders bulunamadı." });
    }

    const courseId = course.rows[0].id;
    const courseCode = course.rows[0].code;

    // Mevcut öğrenci kontrolü
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

    // Klasör oluşturma
    const pendingDir = getFilePath("uploads", "face_data", `${courseCode}-pending`);
    if (!fs.existsSync(pendingDir)) {
      safeFileOperation(
        () => fs.mkdirSync(pendingDir, { recursive: true }),
        `Klasör oluşturulamadı: ${pendingDir}`
      );
    }

    let fileName = null;
    let dbImagePath = null;

    // Fotoğraf kaydetme
    if (face_image?.startsWith("data:image")) {
      try {
        const base64Data = face_image.replace(/^data:image\/\w+;base64,/, "");
        fileName = `${student_no}_${Date.now()}.jpg`;
        const filePath = path.join(pendingDir, fileName);
        fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
        dbImagePath = `${courseCode}-pending/${fileName}`;
        console.log(`✅ Fotoğraf kaydedildi: ${fileName}`);
      } catch (fileErr) {
        console.error(`❌ Fotoğraf kaydedilemedi: ${fileErr.message}`);
        // Fotoğraf kaydedilemese bile devam et, sadece log tut
      }
    }

    // Veritabanına kaydet
    await pool.query(
      "INSERT INTO students (name, student_no, email, face_image, course_id, is_approved) VALUES ($1, $2, $3, $4, $5, false)",
      [name, student_no, email, dbImagePath, courseId]
    );

    res.json({ message: "Öğrenci eşleşmedi. Onay bekleyen listeye eklendi. ⏳", approved: false });
  } catch (err) {
    console.error("Öğrenci ekleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası: " + (err.message || "Bilinmeyen hata") });
  }
});

// ✅ POST /api/students/:id/approve → Onayla ve Excel'e yaz
router.post("/api/students/:id/approve", async (req, res) => {
  const studentId = req.params.id;
  const { image } = req.body;

  if (!studentId) {
    return res.status(400).json({ message: "Öğrenci ID'si gerekli." });
  }

  try {
    // Öğrenci bilgilerini al
    const result = await pool.query(
      "SELECT s.*, c.code FROM students s JOIN courses c ON s.course_id = c.id WHERE s.id = $1",
      [studentId]
    );
    
    if (result.rows.length === 0) {
      console.log(`⚠️ Onaylanacak öğrenci bulunamadı: ID=${studentId}`);
      return res.status(404).json({ message: "Öğrenci bulunamadı." });
    }

    const student = result.rows[0];
    const courseCode = student.code;

    // 📂 Onaylı klasörü oluştur
    const approvedDir = getFilePath("uploads", "face_data", `${courseCode}-approved`);
    if (!fs.existsSync(approvedDir)) {
      safeFileOperation(
        () => fs.mkdirSync(approvedDir, { recursive: true }),
        `Onaylı klasörü oluşturulamadı: ${approvedDir}`
      );
    }

    let newImagePath = student.face_image;

    // Fotoğrafı taşı
    if (student.face_image) {
      try {
        const fileName = path.basename(student.face_image);
        const oldPath = getFilePath("uploads", "face_data", `${courseCode}-pending`, fileName);
        const newPath = path.join(approvedDir, fileName);

        if (fs.existsSync(oldPath)) {
          fs.renameSync(oldPath, newPath);
          newImagePath = `${courseCode}-approved/${fileName}`;
          console.log(`✅ Fotoğraf taşındı: ${oldPath} -> ${newPath}`);
        } else {
          console.log(`⚠️ Taşınacak fotoğraf bulunamadı: ${oldPath}`);
        }
      } catch (fileErr) {
        console.error(`❌ Fotoğraf taşıma hatası: ${fileErr.message}`);
        // Fotoğraf taşınamazsa bile devam et
      }
    }

    // 📅 Excel klasörünü oluştur
    const now = new Date();
    const formattedDate = now.toISOString().split("T")[0];
    const fileName = `${courseCode} - ${formattedDate}.xlsx`;
    const courseDir = getFilePath("uploads", courseCode);
    
    if (!fs.existsSync(courseDir)) {
      safeFileOperation(
        () => fs.mkdirSync(courseDir, { recursive: true }),
        `Excel klasörü oluşturulamadı: ${courseDir}`
      );
    }
    
    const excelPath = path.join(courseDir, fileName);

    // Excel dosyasını oku veya oluştur
    let data = [];
    try {
      if (fs.existsSync(excelPath)) {
        const wb = xlsx.readFile(excelPath);
        const ws = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        data = ws;
      }

      // Yeni veriyi ekle
      data.push({
        AdSoyad: student.name,
        Numara: student.student_no,
        Tarih: formattedDate,
      });

      // Excel dosyasını yaz
      const wb = xlsx.utils.book_new();
      const ws = xlsx.utils.json_to_sheet(data);
      xlsx.utils.book_append_sheet(wb, ws, "Yoklama");
      xlsx.writeFile(wb, excelPath);
      console.log(`✅ Excel dosyası güncellendi: ${excelPath}`);
    } catch (excelErr) {
      console.error(`❌ Excel işlemi hatası: ${excelErr.message}`);
      // Excel hatası olsa bile veritabanı güncellemesine devam et
    }

    // ✅ Veritabanında güncelle
    await pool.query(
      "UPDATE students SET face_image = $1, is_approved = true WHERE id = $2",
      [newImagePath, studentId]
    );

    res.json({ message: "✅ Öğrenci onaylandı ve Excel'e eklendi." });
  } catch (err) {
    console.error("Onaylama hatası:", err);
    res.status(500).json({ message: "Onaylama sırasında hata oluştu: " + (err.message || "Bilinmeyen hata") });
  }
});

// ❌ POST /api/students/:id/reject → Reddet ve sil
router.post("/api/students/:id/reject", async (req, res) => {
  const studentId = req.params.id;
  const { image, courseCode } = req.body;

  if (!studentId || !courseCode) {
    return res.status(400).json({ message: "Eksik bilgi gönderildi." });
  }

  try {
    // Önce öğrenci bilgilerini al (silmeden önce)
    const studentInfo = await pool.query("SELECT face_image FROM students WHERE id = $1", [studentId]);
    
    if (studentInfo.rows.length === 0) {
      return res.status(404).json({ message: "Öğrenci bulunamadı" });
    }
    
    // Öğrenciyi veritabanından sil
    const result = await pool.query("DELETE FROM students WHERE id = $1", [studentId]);

    if (result.rowCount > 0) {
      // Dosya yolunu belirle (image parametresi veya veritabanındaki değer kullanılarak)
      let photoPath;
      
      if (image) {
        photoPath = getFilePath("uploads", "face_data", `${courseCode}-pending`, image);
      } else if (studentInfo.rows[0].face_image) {
        // Veritabanından gelen tam yolu kullan
        photoPath = getFilePath("uploads", "face_data", studentInfo.rows[0].face_image);
      }
      
      // Dosyayı sil (eğer varsa)
      if (photoPath) {
        try {
          if (fs.existsSync(photoPath)) {
            fs.unlinkSync(photoPath);
            console.log(`✅ Dosya silindi: ${photoPath}`);
          } else {
            console.log(`⚠️ Dosya bulunamadı: ${photoPath}`);
          }
        } catch (error) {
          console.error(`❌ Dosya silinirken hata oluştu: ${error.message}`);
        }
      }
      
      res.json({ message: "Öğrenci reddedildi ve silindi ❌" });
    } else {
      res.status(404).json({ message: "Öğrenci bulunamadı" });
    }
  } catch (err) {
    console.error("Silme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası: " + err.message });
  }
});


// ✅ GET /api/students/:courseCode → Tüm öğrencileri getir
router.get("/api/students/:courseCode", async (req, res) => {
  const courseCode = req.params.courseCode;

  if (!courseCode) {
    return res.status(400).json({ message: "Ders kodu gerekli." });
  }

  try {
    console.log(`📋 ${courseCode} dersinin öğrencileri getiriliyor...`);
    
    // Ders ID'sini bul
    const result = await pool.query("SELECT id FROM courses WHERE code = $1", [courseCode]);
    if (result.rows.length === 0) {
      console.log(`⚠️ Ders bulunamadı: ${courseCode}`);
      return res.status(404).json({ message: "Ders bulunamadı." });
    }

    const courseId = result.rows[0].id;

    // Onaylı ve bekleyen öğrencileri paralel olarak getir
    const [approved, pending] = await Promise.all([
      pool.query("SELECT * FROM students WHERE course_id = $1 AND is_approved = true", [courseId]),
      pool.query("SELECT * FROM students WHERE course_id = $1 AND is_approved = false", [courseId])
    ]);

    console.log(`✅ ${courseCode} dersi için ${approved.rows.length} onaylı, ${pending.rows.length} bekleyen öğrenci bulundu.`);

    res.json({
      approvedStudents: approved.rows,
      pendingStudents: pending.rows
    });
  } catch (err) {
    console.error(`❌ Öğrenci listesi getirme hatası (${courseCode}):`, err);
    res.status(500).json({ message: "Sunucu hatası: " + (err.message || "Bilinmeyen hata") });
  }
});

// Öğrenci arama endpoint'i
router.get("/api/students/search/:courseCode", async (req, res) => {
  const { courseCode } = req.params;
  const { query } = req.query;
  
  if (!courseCode || !query) {
    return res.status(400).json({ message: "Ders kodu ve arama terimi gerekli." });
  }
  
  try {
    // Ders ID'sini bul
    const courseResult = await pool.query("SELECT id FROM courses WHERE code = $1", [courseCode]);
    if (courseResult.rows.length === 0) {
      return res.status(404).json({ message: "Ders bulunamadı." });
    }
    
    const courseId = courseResult.rows[0].id;
    
    // İsim veya öğrenci numarasına göre arama yap
    const searchResult = await pool.query(
      "SELECT * FROM students WHERE course_id = $1 AND (name ILIKE $2 OR student_no ILIKE $2)",
      [courseId, `%${query}%`]
    );
    
    res.json({ students: searchResult.rows });
  } catch (err) {
    console.error(`❌ Öğrenci arama hatası:`, err);
    res.status(500).json({ message: "Arama sırasında hata oluştu" });
  }
});

export default router;
