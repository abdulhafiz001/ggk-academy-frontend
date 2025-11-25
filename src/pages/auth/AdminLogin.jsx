import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, Mail, Lock, BookOpen, BarChart3, Shield } from 'lucide-react';
import { COLORS, GRADIENTS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { showError, showSuccess } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await login(formData.username, formData.password);

      // Show success message
      showSuccess(`Welcome back, ${response.user?.name || 'User'}!`);

      // Navigate based on user role
      if (response.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      // Check for rate limit error (429 status)
      if (error.response?.status === 429) {
        const rateLimitMessage = error.response?.data?.message || 
                                error.response?.data?.errors?.rate_limit?.[0] ||
                                'Too many login attempts. Please wait before trying again.';
        showError(rateLimitMessage);
      } else {
        showError(error.message || 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Back Button */}
          <div className="flex justify-start">
            <Link 
              to="/" 
              className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              <span className="text-sm font-medium">Back to Home</span>
            </Link>
          </div>

          <div className="text-center">
            <div className="mb-6">
              <img 
                src="/images/ggk-academy.jpeg" 
                alt="Gabs Glorious Kids Academy Logo" 
                className="h-20 w-20 mx-auto mb-4"
              />
              <span className="text-2xl font-bold text-gray-900 block">
                Gabs Glorious Kids Academy
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Staff Login
            </h2>
            <p className="text-gray-600">
              Sign in to manage school results and student records
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    value={formData.username}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                    placeholder="Enter your username"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg text-white font-semibold text-lg transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: COLORS.primary.red }}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Are you a student?{' '}
                <Link 
                  to="/auth/student/login" 
                  className="font-medium hover:underline"
                  style={{ color: COLORS.primary.blue }}
                >
                  Student Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Image/Branding */}
      
      {/* Right Side - Modern School Portal Welcome */}
<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
  {/* Background with subtle school theme */}
  <div className="absolute inset-0" style={{ background: `linear-gradient(to bottom right, ${COLORS.primary.blue}, #9333ea, ${COLORS.primary.red})` }}>
    {/* Abstract educational pattern */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-lg rotate-45"></div>
      <div className="absolute top-40 right-20 w-16 h-16 border-2 border-white rounded-full"></div>
      <div className="absolute bottom-20 left-20 w-24 h-24 border-2 border-white rounded-lg"></div>
      <div className="absolute bottom-40 right-10 w-12 h-12 border-2 border-white rounded-full"></div>
    </div>
    
    {/* Floating academic icons */}
    <div className="absolute top-1/4 left-1/4 opacity-20">
      <BookOpen className="w-16 h-16 text-white" />
    </div>
    <div className="absolute bottom-1/3 right-1/4 opacity-20">
      <BarChart3 className="w-12 h-12 text-white" />
    </div>
  </div>

  {/* Content */}
  <div className="relative z-10 h-full flex items-center justify-center p-12">
    <div className="max-w-md text-center text-white">
      {/* School Logo & Name */}
      <div className="mb-8">
        <div className="w-20 h-20 mx-auto mb-4 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 flex items-center justify-center">
          <img 
            src="/images/ggk-academy.jpeg" 
            alt="Gabs Glorious Kids Academy Logo" 
            className="w-16 h-16 rounded-xl"
          />
        </div>
        <h2 className="text-3xl font-bold mb-2">Gabs Glorious Kids Academy</h2>
        <p className="text-blue-100 text-lg">Staff Portal</p>
      </div>

      {/* Welcome Message */}
      <div className="mb-8">
        <h3 className="text-4xl font-bold mb-4 leading-tight">
          Welcome Back,
          <span className="block text-yellow-300">Educator</span>
        </h3>
        <p className="text-xl text-blue-100 leading-relaxed">
          Access your academic management tools and continue shaping tomorrow's leaders.
        </p>
      </div>

    

      {/* Features List */}
      <div className="space-y-3 text-left">
        <div className="flex items-center text-blue-100">
          <div className="w-2 h-2 bg-yellow-300 rounded-full mr-3"></div>
          <span>Manage student results & records</span>
        </div>
        <div className="flex items-center text-blue-100">
          <div className="w-2 h-2 bg-yellow-300 rounded-full mr-3"></div>
          <span>Track academic progress</span>
        </div>
        <div className="flex items-center text-blue-100">
          <div className="w-2 h-2 bg-yellow-300 rounded-full mr-3"></div>
          <span>Generate performance reports</span>
        </div>
      </div>
    </div>
  </div>

  {/* Security Badge */}
  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
    <div className="flex items-center space-x-2 text-blue-200 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
      <Shield className="w-4 h-4" />
      <span>Secure & Encrypted Portal</span>
    </div>
  </div>
</div>
    </div>
  );
};

export default AdminLogin;
