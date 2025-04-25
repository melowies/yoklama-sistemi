//C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\components\CourseCard.jsx
function CourseCard({ course }) {
  return (
    <div className="bg-gray-100 border shadow rounded-xl p-4 text-center cursor-pointer hover:bg-gray-200 relative">
      <h3 className="text-lg font-semibold text-black">{course.code}</h3>
      <p className="text-gray-700">{course.name}</p>
    </div>
  );
}

export default CourseCard;
