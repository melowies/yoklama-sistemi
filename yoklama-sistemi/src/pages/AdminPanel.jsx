//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\pages\AdminPanel.jsx
import { useState, useEffect } from "react";

function AdminPanel() {
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const res = await fetch("http://localhost:5000/api/admin/teachers", {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
          },
        });

        const data = await res.json();
        if (Array.isArray(data)) {
          setTeachers(data);
        } else if (data.rows && Array.isArray(data.rows)) {
          setTeachers(data.rows);
        } else {
          console.error('API beklenmeyen bir veri formatı döndürdü:', data);
          setTeachers([]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchTeachers();
  }, []);

  const handleApprove = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/approve-teacher/${id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (res.ok) {
        alert("Öğretmen başarıyla onaylandı.");
        setTeachers(teachers.filter((teacher) => teacher.id !== id));
      } else {
        alert("Onaylama başarısız.");
      }
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu.");
    }
  };

  const handleReject = async (id) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/reject-teacher/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("adminToken")}`,
        },
      });

      if (res.ok) {
        alert("Öğretmen başarıyla reddedildi.");
        setTeachers(teachers.filter((teacher) => teacher.id !== id));
      } else {
        alert("Reddetme işlemi başarısız.");
      }
    } catch (err) {
      console.error(err);
      alert("Bir hata oluştu.");
    }
  };

  return (
    <div className="min-h-screen bg-white text-black">
      <h2 className="text-xl font-bold mb-4">Öğretmen Onayları</h2>
      {teachers.length === 0 ? (
        <p>Onay bekleyen öğretmen yok.</p>
      ) : (
        <ul>
          {teachers.map((teacher) => (
            <li key={teacher.id} className="mb-3">
              <div className="flex justify-between">
                <span>{teacher.full_name} ({teacher.email})</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(teacher.id)}
                    className="bg-green-500 text-white py-1 px-3 rounded hover:bg-green-600"
                  >
                    Onayla
                  </button>
                  <button
                    onClick={() => handleReject(teacher.id)}
                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600"
                  >
                    Reddet
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminPanel;
