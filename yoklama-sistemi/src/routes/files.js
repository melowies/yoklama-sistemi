//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\routes\files.js
import express from "express";
import fs from "fs";
import path from "path";

const router = express.Router();

router.get("/api/courses/:id/files", (req, res) => {
  const courseId = req.params.id;
  const dirPath = path.join("uploads", courseId);

  fs.readdir(dirPath, (err, files) => {
    if (err) return res.json({ files: [] }); // klasör yoksa boş dön
    const excelFiles = files.filter((f) => f.endsWith(".xlsx"));
    res.json({ files: excelFiles });
  });
});

export default router;