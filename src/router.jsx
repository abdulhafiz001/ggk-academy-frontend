import { createBrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';

// Layouts
import GuestLayout from './layouts/GuestLayout';
import AppLayout from './layouts/AppLayout';
import AdminLayout from './layouts/AdminLayout';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import GuestRoute from './components/GuestRoute';

// Context wrapper component
const ContextWrapper = ({ children }) => (
  <AuthProvider>
    <NotificationProvider>
      {children}
    </NotificationProvider>
  </AuthProvider>
);

// Pages
import Home from './pages/Home';
import StudentLogin from './pages/auth/StudentLogin';
import AdminLogin from './pages/auth/AdminLogin';
import ForgotPassword from './pages/auth/ForgotPassword';

// Student pages
import StudentDashboard from './pages/student/StudentDashboard';
import StudentResults from './pages/student/StudentResults';
import StudentProgress from './pages/student/StudentProgress';
import StudentSubjects from './pages/student/StudentSubjects';
import StudentAnalysis from './pages/student/StudentAnalysis';
import StudentProfile from './pages/student/StudentProfile';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import Students from './pages/admin/Students';
import AdminStudentResults from './pages/admin/StudentResults';
import StudentDetails from './pages/admin/StudentDetails';
import AddStudent from './pages/admin/AddStudent';
import ManageScores from './pages/admin/ManageScores';
import Classes from './pages/admin/Classes';
import Results from './pages/admin/Results';
import Settings from './pages/admin/Settings';
import AdminProfile from './pages/admin/AdminProfile';
import AttendanceAnalysis from './pages/admin/AttendanceAnalysis';

// Teacher pages
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import TeacherStudentResults from './pages/teacher/TeacherStudentResults';
import TeacherProfile from './pages/teacher/Profile';
import Attendance from './pages/teacher/Attendance';

const router = createBrowserRouter([
  // Guest routes (public - but redirect authenticated users)
  {
    path: "/",
    element: (
      <ContextWrapper>
        <GuestRoute>
          <GuestLayout />
        </GuestRoute>
      </ContextWrapper>
    ),
    children: [
      {
        path: '/',
        element: <Home />,
      },
    ],
  },

  // Auth routes (guests only - authenticated users redirected)
  {
    path: "/auth",
    element: (
      <ContextWrapper>
        <GuestRoute>
          <GuestLayout />
        </GuestRoute>
      </ContextWrapper>
    ),
    children: [
      {
        path: '/auth/admin/login',
        element: <AdminLogin />,
      },
      {
        path: '/auth/student/login',
        element: <StudentLogin />,
      },
    ],
  },

  // Student forgot password route (guest access)
  {
    path: "/student/forgot-password",
    element: (
      <ContextWrapper>
        <GuestRoute>
          <GuestLayout />
        </GuestRoute>
      </ContextWrapper>
    ),
    children: [
      {
        index: true,
        element: <ForgotPassword />,
      },
    ],
  },

  // Student routes (protected)
  {
    path: "/student",
    element: (
      <ContextWrapper>
        <ProtectedRoute allowedRoles={['student']}>
          <AppLayout />
        </ProtectedRoute>
      </ContextWrapper>
    ),
    children: [
      {
        path: 'dashboard',
        element: <StudentDashboard />,
      },
      {
        path: 'results',
        element: <StudentResults />,
      },
      {
        path: 'progress',
        element: <StudentProgress />,
      },
      {
        path: 'subjects',
        element: <StudentSubjects />,
      },
      {
        path: 'analysis',
        element: <StudentAnalysis />,
      },
      {
        path: 'timetable',
        element: <div>Student Timetable Page (Coming Soon)</div>,
      },
      {
        path: 'profile',
        element: <StudentProfile />,
      },
    ],
  },

  // Admin routes (protected) - includes teachers and principals
  {
    path: "/admin",
    element: (
      <ContextWrapper>
        <ProtectedRoute allowedRoles={['admin', 'teacher']}>
          <AdminLayout />
        </ProtectedRoute>
      </ContextWrapper>
    ),
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'students',
        element: <Students />,
      },
      {
        path: 'students/:studentId/details',
        element: <StudentDetails />,
      },
      {
        path: 'students/:studentId/results',
        element: <AdminStudentResults />,
      },
      {
        path: 'add-student',
        element: <AddStudent />,
      },
      {
        path: 'manage-scores',
        element: <ManageScores />,
      },
      {
        path: 'classes',
        element: <Classes />,
      },
      {
        path: 'results',
        element: <Results />,
      },
      {
        path: 'attendance-analysis',
        element: <AttendanceAnalysis />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
      {
        path: 'profile',
        element: <AdminProfile />,
      },
    ],
  },

  // Teacher routes - redirect to admin routes since they share the same layout
  {
    path: "/teacher",
    element: (
      <ContextWrapper>
        <ProtectedRoute allowedRoles={['teacher']}>
          <AdminLayout />
        </ProtectedRoute>
      </ContextWrapper>
    ),
    children: [
      {
        path: 'dashboard',
        element: <TeacherDashboard />,
      },
      {
        path: 'students',
        element: <Students />,
      },
      {
        path: 'manage-scores',
        element: <ManageScores />,
      },
      {
        path: 'attendance',
        element: <Attendance />,
      },
      {
        path: 'results',
        element: <Results />,
      },
      {
        path: 'students/:studentId/details',
        element: <StudentDetails />,
      },
      {
        path: 'student-results/:studentId',
        element: <TeacherStudentResults />,
      },
      {
        path: 'profile',
        element: <TeacherProfile />,
      },
      {
        path: '*',
        element: <TeacherDashboard />,
      },
    ],
  },
]);

export default router;
