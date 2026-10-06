import { HashRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { AuthProvider, ToastProvider, useAuth } from './ctx';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { AdminCourses, Catalog } from './pages/Courses';
import Students from './pages/Students';
import Grades from './pages/Grades';
import MyCourses from './pages/MyCourses';

const ADMIN_NAV = [['/', '📊', 'Dashboard'], ['/courses', '📚', 'Courses'], ['/students', '🎓', 'Students'], ['/grades', '📝', 'Marks & Attendance']];
const STUDENT_NAV = [['/', '📊', 'Dashboard'], ['/catalog', '🔍', 'Browse Courses'], ['/my-courses', '📚', 'My Courses']];

function Shell() {
  const { user, logout } = useAuth();
  if (!user) return <Login />;
  const admin = user.role === 'ADMIN';
  return (
    <div className="app">
      <aside>
        <div className="brand">CampusCourse</div>
        <nav>
          {(admin ? ADMIN_NAV : STUDENT_NAV).map(([to, icon, label]) => (
            <NavLink key={to} to={to} end={to === '/'}><span>{icon}</span>{label}</NavLink>
          ))}
        </nav>
        <div className="me">
          <b>{user.name}</b>
          <small>{admin ? 'Administrator' : `${user.rollNo} · ${user.department}`}</small>
          <button onClick={logout}>Log out</button>
        </div>
      </aside>
      <main>
        {admin ? (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/courses" element={<AdminCourses />} />
            <Route path="/students" element={<Students />} />
            <Route path="/grades" element={<Grades />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalog" element={<Catalog />} />
            <Route path="/my-courses" element={<MyCourses />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ToastProvider>
        <AuthProvider>
          <Shell />
        </AuthProvider>
      </ToastProvider>
    </HashRouter>
  );
}
