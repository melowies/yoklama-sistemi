//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\pages\CoursePage.jsx
import { useParams, Link, useLocation } from "react-router-dom";
import QRCode from "react-qr-code";
import { useState, useEffect } from "react";

function CoursePage() {
  const { code } = useParams();
  const locationState = useLocation();
  const [attendanceFiles, setAttendanceFiles] = useState([]);
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    const storedCourse = localStorage.getItem("courseName");

    if (locationState.state?.courseName) {
      setCourseName(locationState.state.courseName);
      localStorage.setItem("courseName", locationState.state.courseName);
    } else if (storedCourse) {
      setCourseName(storedCourse);
    } else {
      setCourseName(`Ders ${code}`);
    }
  }, [code, locationState]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/courses/${code}/files`)
      .then((res) => res.json())
      .then((data) => setAttendanceFiles(data.files || []))
      .catch(() => setAttendanceFiles([]));
  }, [code]);

  return (
    <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">{courseName}</h1>
      <p className="mb-4">Öğrenciler aşağıdaki QR kodu okutarak yoklama verebilir.</p>

      <div className="bg-white p-4 rounded shadow mb-6">
        <QRCode value={`http://localhost:5173/checkin/${code}?t=${Date.now()}`} />
      </div>

      <Link
        to={`/course/${code}/pending`}
        className="mb-6 text-blue-600 underline hover:text-blue-800"
      >
        👩‍🎓 Bekleyen Başvuruları Gör
      </Link>

      <div className="w-full max-w-md">
        <h2 className="text-lg font-semibold mb-2">📅 Geçmiş Yoklamalar</h2>
        <ul className="space-y-2">
          {attendanceFiles.length > 0 ? (
            attendanceFiles.map((file, index) => {
              const displayName = file.replace(".xlsx", "");

              return (
                <li key={index} className="flex items-center justify-between border p-2 rounded shadow-sm">
                  <span className="font-medium">{displayName}</span>
                  <a
                    href={`http://localhost:5000/uploads/${file}`}
                    className="text-blue-600 underline hover:text-blue-800 text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                  >
                    Excel dosyasını indir
                  </a>
                </li>
              );
            })
          ) : (
            <li className="text-gray-600">Hiç yoklama dosyası yok.</li>
          )}
        </ul>
      </div>

      <Link
        to="/dashboard"
        className="mt-8 text-blue-600 underline hover:text-blue-800"
      >
        Ana sayfaya dön
      </Link>
    </div>
  );
}

export default CoursePage;
