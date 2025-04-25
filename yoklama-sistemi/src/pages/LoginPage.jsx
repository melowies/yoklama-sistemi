//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\pages\LoginPage.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("email", email);
        localStorage.setItem("fullName", data.fullName);
        navigate("/dashboard");
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage("Sunucuya bağlanılamadı.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <form onSubmit={handleLogin} className="bg-gray-100 p-6 rounded-xl shadow-md w-80 text-center">
        <h2 className="text-xl font-bold mb-4">Öğretmen Giriş</h2>
        <input type="email" placeholder="E-posta" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 p-2 border rounded" />
        <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600">Giriş Yap</button>
        {message && <p className="text-sm text-red-500 mt-2">{message}</p>}
        <p className="text-sm mt-4">Hesabınız yok mu? <Link to="/register" className="text-blue-600 hover:underline">Kayıt olun</Link></p>
      </form>
    </div>
  );
}

export default LoginPage;