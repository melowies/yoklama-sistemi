//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\pages\CreateAdmin.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateAdmin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch('http://localhost:5000/api/admin/create-admin', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
            method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        setMessage("Kayıt başarılı! Girişe yönlendiriliyorsunuz...");
        setTimeout(() => navigate("/admin/login"), 1500);
      } else {
        setMessage(data.message);
      }
    } catch (err) {
      setMessage("Bir hata oluştu.");
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Admin Oluştur</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /><br />
        <input
          type="password"
          placeholder="Şifre"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        /><br />
        <button type="submit">Admin Oluştur</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
}

export default CreateAdmin;
