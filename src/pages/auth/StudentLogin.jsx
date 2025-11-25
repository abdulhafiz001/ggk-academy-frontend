import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const StudentLogin = () => {
  const [formData, setFormData] = useState({
    admissionNumber: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { studentLogin } = useAuth();
  const { showError, showSuccess } = useNotification();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await studentLogin(formData.admissionNumber, formData.password);

      showSuccess(`Welcome back, ${response.student?.first_name || 'Student'}!`);
      setTimeout(() => {
        navigate('/student/dashboard');
      }, 1500);

    } catch (error) {
      // Check for rate limit error (429 status)
      if (error.response?.status === 429) {
        const rateLimitMessage = error.response?.data?.message || 
                                error.response?.data?.errors?.rate_limit?.[0] ||
                                'Too many login attempts. Please wait before trying again.';
        showError(rateLimitMessage);
      } else {
        showError(error.message || 'Invalid admission number or password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-start mb-2">
          <Link to="/" className="inline-flex items-center hover:underline text-sm font-medium"
                style={{ color: COLORS.primary.blue }}>
            <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </div>
        <Link to="/" className="flex justify-center">
          <img src="/images/ggk-academy.jpeg" alt="Gabs Glorious Kids Academy Logo" className="h-20 w-auto mx-auto" />
        </Link>
        <h2 className="text-center text-3xl font-extrabold text-gray-900 mt-4">
          Gabs Glorious Kids Academy Student Portal
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Access your academic results and progress
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-gray-200 sm:rounded-lg sm:px-10">


          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="admissionNumber" className="block text-sm font-medium text-gray-700">
                Admission Number
              </label>
              <div className="mt-1">
                <input
                  id="admissionNumber"
                  name="admissionNumber"
                  type="text"
                  autoComplete="username"
                  required
                  value={formData.admissionNumber}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
                  style={{ 
                    focusRingColor: COLORS.primary.red,
                    focusBorderColor: COLORS.primary.red 
                  }}
                  placeholder="Enter your admission number"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm"
                  style={{ 
                    focusRingColor: COLORS.primary.red,
                    focusBorderColor: COLORS.primary.red 
                  }}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 focus:ring-2 focus:ring-offset-2"
                  style={{ accentColor: COLORS.primary.red }}
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>

              <div className="text-sm">
                <Link
                  to="/student/forgot-password"
                  className="font-medium hover:underline"
                  style={{ color: COLORS.primary.blue }}
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  loading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:opacity-90'
                } transition-all duration-200`}
                style={{ 
                  backgroundColor: COLORS.primary.red,
                  focusRingColor: COLORS.primary.red 
                }}
              >
                <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                  <svg
                    className="h-5 w-5 text-red-300 group-hover:text-red-200"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </span>
                {loading ? 'Signing in...' : 'Access My Results'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              
            </div>

            
          </div>

          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your school administrator
            </p>
          </div>
        </div>
      </div>


    </div>
  );
};

export default StudentLogin;
