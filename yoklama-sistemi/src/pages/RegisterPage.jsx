//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\pages\RegisterPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Kayıt başarılı! Girişe yönlendiriliyorsunuz...");
        setTimeout(() => navigate("/"), 1500);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-black">
      <form onSubmit={handleRegister} className="bg-gray-100 p-6 rounded-xl shadow-md w-80 text-center">
        <h2 className="text-xl font-bold mb-4">Kayıt Ol</h2>
        <input type="text" placeholder="İsim Soyisim" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full mb-3 p-2 border rounded" />
        <input type="email" placeholder="E-posta (@tarsus.edu.tr)" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mb-3 p-2 border rounded" />
        <input type="password" placeholder="Şifre" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mb-4 p-2 border rounded" />
        <button type="submit" className="w-full bg-green-500 text-white py-2 rounded hover:bg-green-600">Kayıt Ol</button>
        {message && <p className="mt-2 text-sm text-red-500">{message}</p>}
      </form>
    </div>
  );
}

export default RegisterPage;