import { useNavigate } from "react-router-dom";
import { useState } from "react";

function Navbar({ fullName, setFullName }) {
  const navigate = useNavigate();
  const [showSettings, setShowSettings] = useState(false);
  

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/teachers/logout", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
    } catch (err) {
      console.error("Logout isteği başarısız:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("fullName");
      navigate("/login");
    }
  };
  
  const handleChangeName = async () => {
    const newName = prompt("Yeni isminizi giriniz:");
    if (!newName) return;
  
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/teachers/update-name", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName: newName }),
      });
  
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("fullName", data.fullName);
        if (typeof setFullName === "function") {
          setFullName(data.fullName);
        }
      } else {
        alert(data.message);
      }
    } catch (err) {
      alert("İsim güncellenemedi.");
    }
  };
  
  

  const handleChangePassword = async () => {
    const newPassword = prompt("Yeni şifrenizi giriniz:");
    if (newPassword) {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch("http://localhost:5000/api/teachers/update-password", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({ password: newPassword }),
        });
        if (res.ok) {
          alert("Şifreniz başarıyla değiştirildi.");
        } else {
          alert("Şifre güncellenemedi.");
        }
      } catch (err) {
        console.error(err);
        alert("Hata oluştu.");
      }
    }
  };
  

  return (
    <div className="flex justify-between items-center bg-black text-white px-6 py-3 shadow-md">
      <div className="text-lg font-semibold">{fullName}</div>
      <div className="relative">
        <button onClick={() => setShowSettings(!showSettings)} className="bg-gray-800 px-4 py-2 rounded hover:bg-gray-700">
          Ayarlar
        </button>
        {showSettings && (
          <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded shadow-lg z-50">
            <button onClick={handleChangeName} className="w-full px-4 py-2 hover:bg-gray-100 text-left">İsmi Değiştir</button>
            <button onClick={handleChangePassword} className="w-full px-4 py-2 hover:bg-gray-100 text-left">Şifreyi Değiştir</button>
            <button onClick={handleLogout} className="w-full px-4 py-2 hover:bg-gray-100 text-left text-red-600">Çıkış Yap</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Navbar;
