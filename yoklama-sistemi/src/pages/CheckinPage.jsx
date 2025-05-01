//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\pages\CheckinPage.jsx
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

function CheckinPage() {
  const { courseCode } = useParams(); 
  const locationState = useLocation();
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState("");
  const [courseCodeState] = useState(courseCode);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [photoURL, setPhotoURL] = useState("");
  const [location, setLocation] = useState(null);
  const [message, setMessage] = useState("");
  const [studentName, setStudentName] = useState("");
  const [studentNo, setStudentNo] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [expiryTime, setExpiryTime] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const timerRef = useRef(null);

  const TARSUS_UNI_COORDS = {
    lat: 36.917870,
    lng: 34.890320,
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (val) => (val * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000;
  };

  // URL'den session ve expiry parametrelerini al
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const session = searchParams.get("session");
    const expiry = searchParams.get("expiry");
    
    if (session && expiry) {
      setSessionId(session);
      setExpiryTime(Number(expiry));
      
      // Süre kontrolü yap
      const checkExpiry = () => {
        const now = Date.now();
        if (now > Number(expiry)) {
          setSessionExpired(true);
          setMessage("❌ Bu QR kodunun süresi dolmuş. Lütfen öğretmeninizden yeni bir QR kodu oluşturmasını isteyin.");
          clearInterval(timerRef.current);
        }
      };
      
      // İlk kontrol
      checkExpiry();
      
      // Periyodik kontrol
      timerRef.current = setInterval(checkExpiry, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    } else {
      setMessage("❌ Geçersiz QR kod. Lütfen öğretmeninizden yeni bir QR kodu oluşturmasını isteyin.");
      setSessionExpired(true);
    }
  }, []);
  
  useEffect(() => {
    if (!sessionExpired) {
      startCamera();
    }
  }, [sessionExpired]);

  const startCamera = () => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user" } })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch(() => {
        setMessage("Kamera açılamadı. Lütfen izin verin.");
      });
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setLocation(coords);

          const distance = calculateDistance(
            coords.lat,
            coords.lng,
            TARSUS_UNI_COORDS.lat,
            TARSUS_UNI_COORDS.lng
          );

          if (distance > 300000000) {
            setMessage(`❌ Kampüs dışında görünüyorsunuz. (${Math.round(distance)} m uzakta)`);
          } else {
            setMessage("📍 Konum onaylandı ✅");
          }
        },
        () => setMessage("Konum alınamadı. Lütfen izin verin."),
        { enableHighAccuracy: true }
      );
    } else {
      setMessage("Tarayıcınız konum desteği sunmuyor.");
    }
  }, []);

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

  const handleTakePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setPhotoBlob(blob);
        setPhotoURL(URL.createObjectURL(blob));
        setMessage("📸 Fotoğraf çekildi ✅");
      } else {
        setMessage("❌ Fotoğraf alınamadı.");
      }
    }, "image/jpeg");
  };

  const handleRetakePhoto = () => {
    setPhotoBlob(null);
    setPhotoURL("");
    setMessage("📷 Lütfen tekrar fotoğraf çekin.");
    startCamera();
  };

  const handleSubmit = async () => {
    if (sessionExpired) {
      alert("Bu QR kodunun süresi dolmuş. Lütfen öğretmeninizden yeni bir QR kodu oluşturmasını isteyin.");
      return;
    }
    
    if (!photoBlob || !location || !studentName || !studentNo) {
      alert("Lütfen tüm alanları doldurun ve fotoğraf çekin.");
      return;
    }

    const distance = calculateDistance(
      location.lat,
      location.lng,
      TARSUS_UNI_COORDS.lat,
      TARSUS_UNI_COORDS.lng
    );

    if (distance > 300000000) {
      alert("Kampüs dışında yoklama alınamaz.");
      return;
    }

    // Süre kontrolü yap
    if (expiryTime && Date.now() > expiryTime) {
      setSessionExpired(true);
      setMessage("❌ Bu QR kodunun süresi dolmuş. Lütfen öğretmeninizden yeni bir QR kodu oluşturmasını isteyin.");
      return;
    }

    const formData = new FormData();
    formData.append("courseCode", courseCodeState);
    formData.append("lat", location.lat.toString());
    formData.append("lng", location.lng.toString());
    formData.append("photo", photoBlob, "checkin.jpg");
    formData.append("name", studentName);
    formData.append("student_no", studentNo);
    formData.append("sessionId", sessionId);
    formData.append("expiryTime", expiryTime ? expiryTime.toString() : "");

    try {
      const response = await fetch("http://localhost:5000/api/checkin", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (response.ok) {
        setMessage("✅ Yoklama başarıyla gönderildi 🎉");
        setSubmitted(true);
      } else {
        setMessage(`❌ Hata: ${result.message}`);
      }
    } catch (error) {
      console.error("Gönderme hatası:", error);
      setMessage("Bir hata oluştu.");
    }
  };

  const isFormValid = photoBlob && location && studentName && studentNo && !submitted && !sessionExpired;

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6">
      <h1 className="text-2xl font-bold mb-4">Yoklama - {courseName}</h1>
      <p className="mb-2">Kamera aç, konum ver ve bilgileri doldur.</p>
      
      {sessionExpired && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>Bu QR kodunun süresi dolmuş.</p>
          <button 
            onClick={() => navigate(-1)} 
            className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Geri Dön
          </button>
        </div>
      )}

      {photoURL ? (
        <img
          src={photoURL}
          alt="Çekilen fotoğraf"
          className="mb-4 rounded shadow-md w-full max-w-md"
        />
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="mb-4 rounded shadow-md w-full max-w-md"
        />
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      <input
        type="text"
        placeholder="Ad Soyad"
        value={studentName}
        onChange={(e) => setStudentName(e.target.value)}
        className="mb-2 p-2 border rounded w-full max-w-md"
      />
      <input
        type="text"
        placeholder="Öğrenci Numarası"
        value={studentNo}
        onChange={(e) => setStudentNo(e.target.value)}
        className="mb-4 p-2 border rounded w-full max-w-md"
      />

      {photoBlob ? (
        <button
          onClick={handleRetakePhoto}
          className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 mb-2"
        >
          🔄 Tekrar Çek
        </button>
      ) : (
        <button
          onClick={handleTakePhoto}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mb-2"
        >
          📸 Fotoğraf Çek
        </button>
      )}

      <button
        onClick={handleSubmit}
        className={`px-6 py-2 rounded text-white transition-all ${
          isFormValid
            ? "bg-blue-500 hover:bg-blue-600"
            : "bg-gray-400 cursor-not-allowed"
        }`}
        disabled={!isFormValid}
      >
        Gönder
      </button>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  );
}

export default CheckinPage;