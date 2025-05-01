//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\routes\files.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/api/courses/:id/files", (req, res) => {
  const courseId = req.params.id;
  const dirPath = path.join(process.cwd(), "uploads", courseId);

  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`⚠️ Klasör bulunamadı: ${dirPath}`);
      return res.json({ files: [] });
    }
    
    fs.readdir(dirPath, (err, files) => {
      if (err) {
        console.error(`❌ Klasör okuma hatası: ${err.message}`);
        return res.json({ files: [] });
      }
      const excelFiles = files.filter((f) => f.endsWith(".xlsx"));
      res.json({ files: excelFiles });
    });
  } catch (error) {
    console.error(`❌ Dosya işlemi hatası: ${error.message}`);
    res.status(500).json({ message: "Sunucu hatası", files: [] });
  }
});

export default router;