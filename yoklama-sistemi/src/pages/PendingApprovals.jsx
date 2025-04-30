//C:\Users\selin\OneDrive\Masaüstü\yoklama-sistemi\yoklama-sistemi\src\pages\PendingApprovals.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

function PendingApprovals() {
  const { courseCode } = useParams();
  const [students, setStudents] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/students/${courseCode}`)
      .then(res => res.json())
      .then(data => setStudents(data.pendingStudents || []));
  }, [courseCode]);

  const handleApprove = async (studentId, imageName) => {
    const res = await fetch(`http://localhost:5000/api/students/${studentId}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageName })
    });
    const data = await res.json();
    alert(data.message);
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const handleReject = async (studentId, imageName) => {
    const confirmed = window.confirm("Bu öğrenciyi silmek istediğinizden emin misiniz?");
    if (!confirmed) return;

    const res = await fetch(`http://localhost:5000/api/students/${studentId}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: imageName, courseCode: courseCode })
    });

    const data = await res.json();
    alert(data.message);
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{courseCode} - Bekleyen Başvurular</h1>
      {students.length === 0 ? (
        <p>Bekleyen başvuru yok ✅</p>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <div key={student.id} className="border p-4 rounded shadow text-center">
                <img
                    src={`http://localhost:5000/uploads/face_data/${courseCode}-pending/${student.face_image}`}                  
                    alt={student.name}
                    className="w-48 h-48 object-cover mx-auto rounded mb-2"
                 />

              <h2 className="font-semibold">{student.name}</h2>
              <p className="text-sm text-gray-600">{student.student_no}</p>
              <div className="flex justify-center gap-2 mt-2">
                <button
                  onClick={() => handleApprove(student.id, student.face_image)}
                  className="bg-green-500 text-white px-4 py-1 rounded hover:bg-green-600"
                >
                  Onayla
                </button>
                <button
                  onClick={() => handleReject(student.id, student.face_image)}
                  className="bg-red-500 text-white px-4 py-1 rounded hover:bg-red-600"
                >
                  Reddet
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PendingApprovals;
