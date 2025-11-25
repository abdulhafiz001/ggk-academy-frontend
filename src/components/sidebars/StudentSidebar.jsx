import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  X,
  Home,
  FileText,
  BarChart3,
  BookOpen,
  GraduationCap,
  User,
  LogOut
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/student/dashboard', icon: Home },
  { name: 'My Results', href: '/student/results', icon: FileText },
  { name: 'Progress', href: '/student/progress', icon: BarChart3 },
  { name: 'Subjects', href: '/student/subjects', icon: BookOpen },
  { name: 'Analysis', href: '/student/analysis', icon: GraduationCap },
  { name: 'Profile', href: '/student/profile', icon: User },
];

const StudentSidebar = ({ isOpen, setIsOpen }) => {
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/auth/student/login');
  };

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Mobile sidebar overlay */}
      {!isDesktop && isOpen && (
        <div className="fixed inset-0 flex z-40">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setIsOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setIsOpen(false)}
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
                <span className="ml-2 text-lg font-bold text-gray-900">Gabs Glorious Kids Academy</span>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      isActive(item.href)
                        ? 'text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                    style={isActive(item.href) ? { backgroundColor: COLORS.primary.red } : {}}
                    onClick={() => setIsOpen(false)}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                  {user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'S'}
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {user ? `${user.first_name} ${user.last_name}` : 'Student'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user?.admission_number || 'Student'}
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
      <div className="desktop-sidebar-force bg-white border-r border-gray-200 shadow-lg" style={{ display: isDesktop ? 'flex' : 'none', width: '256px' }}>
        <div className="flex flex-col flex-1 min-h-0 border-r border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: COLORS.primary.red }}>
                <span className="text-white font-bold text-sm">G</span>
              </div>
              <span className="ml-2 text-lg font-bold text-gray-900">Gabs Glorious Kids Academy</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => (
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
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User section */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm">
                {user?.first_name ? user.first_name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-gray-700">
                  {user ? `${user.first_name} ${user.last_name}` : 'Student'}
                </p>
                <p className="text-xs text-gray-500">
                  {user?.admission_number || 'Student'}
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
    </>
  );
};

export default StudentSidebar; 