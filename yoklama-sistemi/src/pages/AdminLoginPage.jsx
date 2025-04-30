//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\pages\AdminLoginPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("adminToken", data.token);
        setMessage("Giriş başarılı! Admin paneline yönlendiriliyorsunuz...");
        setTimeout(() => navigate("/admin"), 1500);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <form onSubmit={handleLogin} className="bg-gray-100 p-6 rounded-xl shadow-md w-80 text-center">
        <h2 className="text-xl font-bold mb-4">Admin Girişi</h2>
        <input
          type="email"
          placeholder="E-posta"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-2 border rounded"
        />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-4 p-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
        >
          Giriş Yap
        </button>
        {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
      </form>
    </div>
  );
}

export default AdminLoginPage;
