//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\pages\CoursePage.jsx
import { useParams, Link, useLocation } from "react-router-dom";
import QRCode from "react-qr-code";
import { useState, useEffect, useRef } from "react";

function CoursePage() {
  const { courseCode } = useParams();
  const locationState = useLocation();
  const [attendanceFiles, setAttendanceFiles] = useState([]);
  const [courseName, setCourseName] = useState("");
  const [qrValue, setQrValue] = useState("");
  const [qrUrl, setQrUrl] = useState("");
  const [sessionDuration, setSessionDuration] = useState(15); // Varsayılan 15 dakika
  const [expiryTime, setExpiryTime] = useState(null);
  const [remainingTime, setRemainingTime] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    const storedCourse = localStorage.getItem("courseName");

    if (locationState.state?.courseName) {
      setCourseName(locationState.state.courseName);
      localStorage.setItem("courseName", locationState.state.courseName);
    } else if (storedCourse) {
      setCourseName(storedCourse);
    } else {
      setCourseName(`Ders ${courseCode}`);
    }
  }, [courseCode, locationState]);

  useEffect(() => {
    fetch(`http://localhost:5000/api/courses/${courseCode}/files`)
      .then((res) => res.json())
      .then((data) => setAttendanceFiles(data.files || []))
      .catch(() => setAttendanceFiles([]));
  }, [courseCode]);

  // QR kodunu oluştur ve süreyi başlat
  const generateQR = () => {
    // Önceki zamanlayıcıyı temizle
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Benzersiz bir session ID oluştur
    const sessionId = Math.random().toString(36).substring(2, 15);
    
    // Bitiş zamanını hesapla
    const expiry = Date.now() + sessionDuration * 60 * 1000;
    setExpiryTime(expiry);
    
    // QR değerini oluştur (courseCode, sessionId ve expiry time içerir)
    const qrData = `${courseCode}:${sessionId}:${expiry}`;
    const url = `http://localhost:5173/checkin/${courseCode}?session=${sessionId}&expiry=${expiry}`;
    
    setQrValue(qrData);
    setQrUrl(url);
    
    // Kalan süreyi gösteren zamanlayıcıyı başlat
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, expiry - Date.now());
      setRemainingTime(remaining);
      
      // Süre dolduğunda QR kodunu yenile
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setRemainingTime(0);
      }
    }, 1000);
  };
  
  // Component yüklendiğinde ilk QR kodunu oluştur
  useEffect(() => {
    generateQR();
    
    // Component unmount olduğunda zamanlayıcıyı temizle
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [courseCode, sessionDuration]);
  
  // Kalan süreyi formatlı göster
  const formatRemainingTime = () => {
    if (!remainingTime) return "Süre doldu";
    
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div className="min-h-screen bg-white text-black p-6 flex flex-col items-center">
      <h1 className="text-2xl font-bold mb-4">{courseName}</h1>
      <p className="mb-4">Öğrenciler aşağıdaki QR kodu okutarak yoklama verebilir.</p>

      <div className="bg-white p-4 rounded shadow mb-6 flex flex-col items-center">
        {qrValue && <QRCode value={qrValue} />}
        <p className="mt-2 text-sm text-gray-500">{qrUrl}</p>
        <div className="mt-2 flex items-center">
          <span className="text-sm mr-2">Kalan Süre: <strong>{formatRemainingTime()}</strong></span>
          <button 
            onClick={generateQR} 
            className="bg-blue-500 text-white text-sm px-2 py-1 rounded hover:bg-blue-600"
          >
            Yenile
          </button>
        </div>
        <div className="mt-4">
          <label className="text-sm mr-2">QR Süresi (dakika):</label>
          <select 
            value={sessionDuration} 
            onChange={(e) => setSessionDuration(Number(e.target.value))}
            className="border rounded p-1"
          >
            <option value="1">1</option>
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="30">30</option>
            <option value="60">60</option>
          </select>
        </div>
      </div>

      <Link
        to={`/course/${courseCode}/pending`}
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
