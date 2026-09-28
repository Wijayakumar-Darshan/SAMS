import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./state/AuthContext.jsx";

import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Subscription from "./pages/Subscription.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import StudentDashboard from "./pages/student/Dashboard.jsx";
import StudentActivities from "./pages/student/Activities.jsx";
import StudentLeaderboard from "./pages/student/Leaderboard.jsx";
import StudentReport from "./pages/student/Report.jsx";
import StudentMapTeacher from "./pages/student/MapTeacher.jsx";
import StudentCalendar from "./pages/student/Calendar.jsx";

import TeacherDashboard from "./pages/teacher/Dashboard.jsx";
import TeacherStudents from "./pages/teacher/Students.jsx";
import TeacherLeaderboard from "./pages/teacher/Leaderboard.jsx";

import ParentDashboard from "./pages/parent/Dashboard.jsx";

import AdminDashboard from "./pages/admin/Dashboard.jsx";
import AdminTeachers from "./pages/admin/Teachers.jsx";
import AdminStudents from "./pages/admin/Students.jsx";
import AdminPayments from "./pages/admin/Payments.jsx";
import Home from "./pages/Home.jsx";
import Profile from "./pages/Profile.jsx";


function RequireRole({ role, children }) {
  const auth = useAuth();
  if (!auth.role) return <Navigate to="/login" replace />;
  if (auth.role !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const auth = useAuth();

  return (
    <Routes>
      {/* <Route path="/" element={<Navigate to={auth.role ? "/login" : "/login"} replace />} /> */}

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/subscription" element={<Subscription />} />
      <Route
        path="/profile"
        element={
          auth.role ? <Profile /> : <Navigate to="/login" replace />
        }
      />

      <Route path="/admin-login" element={<AdminLogin />} />
      <Route path="/" element={<Home />} />

      <Route
        path="/student/dashboard"
        element={
          <RequireRole role="STUDENT">
            <StudentDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/student/activities"
        element={
          <RequireRole role="STUDENT">
            <StudentActivities />
          </RequireRole>
        }
      />
      <Route
        path="/student/leaderboard"
        element={
          <RequireRole role="STUDENT">
            <StudentLeaderboard />
          </RequireRole>
        }
      />
      <Route
        path="/student/report"
        element={
          <RequireRole role="STUDENT">
            <StudentReport />
          </RequireRole>
        }
      />
      <Route
  path="/student/calendar"
  element={
    <RequireRole role="STUDENT">
      <StudentCalendar />
    </RequireRole>
  }
/>
      <Route
        path="/student/map-teacher"
        element={
          <RequireRole role="STUDENT">
            <StudentMapTeacher />
          </RequireRole>
        }
      />

      <Route
        path="/teacher/dashboard"
        element={
          <RequireRole role="TEACHER">
            <TeacherDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/students"
        element={
          <RequireRole role="TEACHER">
            <TeacherStudents />
          </RequireRole>
        }
      />
      <Route
        path="/teacher/leaderboard"
        element={
          <RequireRole role="TEACHER">
            <TeacherLeaderboard />
          </RequireRole>
        }
      />

      <Route
        path="/parent/dashboard"
        element={
          <RequireRole role="PARENT">
            <ParentDashboard />
          </RequireRole>
        }
      />

      <Route
        path="/admin/dashboard"
        element={
          <RequireRole role="ADMIN">
            <AdminDashboard />
          </RequireRole>
        }
      />
      <Route
        path="/admin/students"
        element={
          <RequireRole role="ADMIN">
            <AdminStudents />
          </RequireRole>
        }
      />
      <Route
        path="/admin/teachers"
        element={
          <RequireRole role="ADMIN">
            <AdminTeachers />
          </RequireRole>
        }
      />
      <Route
        path="/admin/payments"
        element={
          <RequireRole role="ADMIN">
            <AdminPayments />
          </RequireRole>
        }
      />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}