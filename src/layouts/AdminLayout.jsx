import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UserPlus,
  BookOpen,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  User,
  Calendar
} from 'lucide-react';
import { COLORS } from '../constants/colors';
import { useAuth } from '../contexts/AuthContext';
import AcademicSessionWarningModal from '../components/AcademicSessionWarningModal';


const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Don't render navigation until user is loaded
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  const navigation = [
    { name: 'Dashboard', href: user?.role === 'teacher' ? '/teacher/dashboard' : '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Add Student', href: '/admin/add-student', icon: UserPlus },
    { name: 'Manage Scores', href: '/admin/manage-scores', icon: FileText },
    // Only show Attendance for teachers
    ...(user?.role === 'teacher' ? [{ name: 'Attendance', href: '/teacher/attendance', icon: Calendar }] : []),
    // Only show Classes for admin users
    ...(user?.role === 'admin' ? [{ name: 'Classes', href: '/admin/classes', icon: BookOpen }] : []),
    { name: 'Results', href: '/admin/results', icon: FileText },
    // Only show Attendance Analysis and Settings for admin users
    ...(user?.role === 'admin' ? [
      { name: 'Attendance Analysis', href: '/admin/attendance-analysis', icon: Calendar },
      { name: 'Settings', href: '/admin/settings', icon: Settings }
    ] : []),
    { name: 'Profile', href: '/admin/profile', icon: User },
  ];

  const handleLogout = () => {
    logout();
    navigate('/auth/admin/login');
  };

  const isActive = (href) => location.pathname === href;

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar overlay */}
      {!isDesktop && sidebarOpen && (
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary.red }}>
                  <span className="text-white font-bold text-sm">G</span>
                </div>
                <span className="ml-2 text-lg font-bold text-gray-900">G-LOVE ACADEMY</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive(item.href)
                          ? 'text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                      style={isActive(item.href) ? { backgroundColor: COLORS.primary.red } : {}}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {user?.name || 'Staff Member'}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role || 'staff'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1 text-gray-400 hover:text-gray-600"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="desktop-sidebar-force bg-white border-r border-gray-200 shadow-lg w-60" style={{ display: isDesktop ? 'flex' : 'none' }}>
        <div className="flex flex-col flex-1 min-h-0 border-r border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary.red }}>
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">G-LOVE ACADEMY</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive(item.href)
                      ? 'text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  style={isActive(item.href) ? { backgroundColor: COLORS.primary.red } : {}}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user?.name || 'Staff Member'}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role || 'staff'}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          {!isDesktop && (
            <button
              className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset"
              style={{ '--tw-ring-color': COLORS.primary.red }}
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
          )}
          
          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex">
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  
                </div>
              </div>
            </div>
            
            <div className="ml-4 flex items-center">
              <button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500">
                <Bell className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
      
      {/* Academic Session Warning Modal - shows globally for admin/teacher */}
      <AcademicSessionWarningModal />
    </div>
  );
};

export default AdminLayout;
