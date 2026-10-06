# Student Course Management System (CampusCourse)

Full-stack college project: **Kotlin + Spring Boot** REST API, **React** (JSX, Hooks, Context) UI, **JWT** security, embedded **H2** database, **Docker/Render** deployment.

## Features
**Admin:** dashboard (stat cards, seat bars, department and grade charts, latest enrolments) · course add/search/edit/delete · student add/search/edit/delete · enter marks and attendance (grade is calculated) 
**Student:** sign up and log in · dashboard (courses, credits, GPA, attendance, low-attendance warning) · browse and search courses · enrol (blocked when full or already enrolled) · drop a course · see marks and grades

## Tables
`users` (role ADMIN/STUDENT) · `courses` · `enrollments` (student, course, status, marks, grade, attendance)

## Run (JDK 21, Maven 3.9+, Node 20+)
```
cd frontend && npm install && npm run build
cd ../backend && mvn clean package -DskipTests
java -jar target/scms.jar
```
Open http://localhost:8080 (health check: /api/health). Port busy? Windows: `$env:PORT=9090; java -jar target\scms.jar`

Dev mode: `mvn spring-boot:run` in backend, `npm run dev` in frontend, open http://localhost:5173

## Demo logins
Admin `admin@college.edu` / `admin123` · Student `rahul@student.edu` / `student123` (also sai, priya, ananya, karan @student.edu)
Reset data: stop the app, delete `backend/data`, start again.

## Quick test plan
1. Student: log in, open Browse Courses, enrol in a course, check My Courses and Dashboard.
2. Try to enrol in **AI330 Robotics Workshop** (2 seats, already full) → "No seats left" message.
3. Admin: add a course, edit its seats, delete it. Add a student, then enter marks 85 for a student → grade A.
4. Enter attendance below 75 → the student dashboard shows a warning.
5. Student tries an admin URL/API → 403.

## Deploy on Render
Push to GitHub → Render → New → Blueprint → select repo (uses `render.yaml` + `Dockerfile`). Free plan sleeps when idle and resets data on restart.

## REST API
`POST /api/auth/login|register` · `GET/POST /api/courses`, `PUT/DELETE /api/courses/{id}` (admin writes) · `GET/POST /api/students`, `PUT/DELETE /api/students/{id}` (admin) · `GET /api/enrollments/my`, `POST/DELETE /api/enrollments/{id}` (student enrol/drop) · `GET /api/enrollments`, `PUT /api/enrollments/{id}` (admin marks) · `GET /api/dashboard/admin|student`
