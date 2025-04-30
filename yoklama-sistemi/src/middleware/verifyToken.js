//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\middleware\verifyToken.js
import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Token bulunamadı." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, "selininSirri123");
    req.user = decoded; // { email: ... }
    next();
  } catch (error) {
    console.error("JWT doğrulama hatası:", error);
    return res.status(401).json({ message: "Geçersiz token." });
  }
};

export default verifyToken;