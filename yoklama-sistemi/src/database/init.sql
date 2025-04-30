-- C:\Users\selin\OneDrive\Masaüstü\trae\yoklama-sistemi\src\database\init.sql
CREATE TABLE IF NOT EXISTS teachers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password TEXT NOT NULL,
  full_name VARCHAR(255),
  is_approved BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS courses (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  teacher_id INTEGER REFERENCES teachers(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  student_no VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  face_image TEXT,
  is_approved BOOLEAN DEFAULT false,
  course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL
);

-- Veritabanını sıfırlamak için kullanılabilir
-- TRUNCATE TABLE teachers CASCADE;
-- TRUNCATE TABLE courses CASCADE; 
-- TRUNCATE TABLE students CASCADE;
-- TRUNCATE TABLE admins CASCADE;