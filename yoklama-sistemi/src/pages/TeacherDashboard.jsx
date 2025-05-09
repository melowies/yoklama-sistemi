//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\pages\TeacherDashboard.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import CourseCard from "../components/CourseCard";
import axios from "axios";
import Navbar from "../components/Navbars";

function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseName, setNewCourseName] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("email");
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState(localStorage.getItem("fullName") || "");

  useEffect(() => {
    const token = localStorage.getItem("token");
  
    axios.get("http://localhost:5000/api/profile", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
    .then(res => setProfile(res.data))
    .catch(err => {
      console.error("Token geçersiz ya da oturum yok", err);
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      localStorage.removeItem("fullName");
      navigate("/login");
    });
  }, []);
  

  useEffect(() => {
    fetch(`http://localhost:5000/api/courses/${email}`)
      .then((res) => res.json())
      .then((data) => setCourses(data.courses || []));
  }, [email]);

  const handleAddCourse = async (e) => {
    e.preventDefault();
    if (!newCourseCode.trim() || !newCourseName.trim()) return;

    try {
      const res = await fetch("http://localhost:5000/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          email, 
          courseCode: newCourseCode, 
          courseName: newCourseName, 
          fullName
        }),
      });

      const data = await res.json();
      setCourses(data.courses || []);
      setNewCourseCode("");
      setNewCourseName("");
    } catch (err) {
      console.error("Ders eklenirken hata:", err);
    }
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation(); // Tıklamanın CourseCard'a gitmesini engelle
    
    if (!window.confirm("Bu dersi silmek istediğinize emin misiniz? Tüm öğrenci kayıtları da silinecektir.")) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/api/courses/${courseId}?email=${email}`, {
        method: "DELETE",
      });

      const data = await res.json();
      
      if (res.ok) {
        setCourses(data.courses || []);
        alert("Ders başarıyla silindi.");
      } else {
        alert(data.message || "Ders silinirken bir hata oluştu.");
      }
    } catch (err) {
      console.error("Ders silme hatası:", err);
      alert("Ders silinirken bir hata oluştu.");
    }
  };

  const handleCourseClick = (course) => {
    localStorage.setItem("courseCode", course.code);
    localStorage.setItem("courseName", course.name);
    navigate(`/course/${course.code}`, { state: { course } });
  };

  return (
    <>
      <Navbar fullName={fullName} setFullName={setFullName} />
      <div className="min-h-screen bg-white text-black p-6">
        <div>
          {profile ? (
            <h1>Hoş geldin! {profile.message}</h1>
          ) : (
            <p>Yükleniyor...</p>
          )}
        </div>
        <h1 className="text-2xl font-bold mb-6">Derslerim</h1>
        <form onSubmit={handleAddCourse} className="mb-6 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Ders kodu (örn: BM201)"
              value={newCourseCode}
              onChange={(e) => setNewCourseCode(e.target.value)}
              className="p-2 border rounded w-1/3"
            />
            <input
              type="text"
              placeholder="Ders adı (örn: Yapay Zekaya Giriş)"
              value={newCourseName}
              onChange={(e) => setNewCourseName(e.target.value)}
              className="p-2 border rounded w-2/3"
            />
          </div>
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Ekle
          </button>
        </form>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {courses.map((course, index) => (
            <div key={index} className="relative">
              <div onClick={() => handleCourseClick(course)}>
                <CourseCard course={course} />
              </div>
              <button
                onClick={(e) => handleDeleteCourse(course.id, e)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-red-600"
                title="Dersi Sil"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
  
}
export default TeacherDashboard;