import { useState, useEffect } from 'react';
import { AlertCircle, Settings, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../constants/colors';
import API from '../services/API';
import { useAuth } from '../contexts/AuthContext';

const AcademicSessionWarningModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Wait for user to be loaded, then check for admin/teacher users
    if (authLoading) {
      return; // Still loading, wait
    }
    
    if (!user) {
      setLoading(false);
      return; // No user logged in
    }

    const userRole = user?.role;
    console.log('AcademicSessionWarningModal - User:', user);
    console.log('AcademicSessionWarningModal - User Role:', userRole);
    
    // Only check for admin/teacher users
    if (userRole === 'admin' || userRole === 'teacher') {
      checkAcademicSession();
    } else {
      setLoading(false);
    }
  }, [user, authLoading]);

  const checkAcademicSession = async () => {
    try {
      setLoading(true);
      console.log('🔍 Checking academic session...');
      
      // Use the public endpoint that doesn't require authentication
      const response = await API.getCurrentAcademicSession();
      const data = response.data || response;
      
      console.log('✅ Academic session check response:', data);
      console.log('✅ has_session:', data.has_session);
      console.log('✅ has_term:', data.has_term);
      
      // Show modal if no session or no term is set
      if (!data.has_session || !data.has_term) {
        console.log('⚠️ No session or term found, showing modal');
        setSessionInfo(data);
        setShowModal(true);
      } else {
        console.log('✅ Session and term are set, not showing modal');
        setShowModal(false);
      }
    } catch (error) {
      console.error('❌ Error checking academic session:', error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Error details:', error.response);
      
      // Show modal if API call fails (likely means no session is set or route not found)
      // This handles cases where the endpoint returns 404 or other errors
      console.log('⚠️ API call failed, showing modal (assuming no session)');
      setSessionInfo({
        has_session: false,
        has_term: false,
      });
      setShowModal(true);
    } finally {
      setLoading(false);
    }
  };

  // Don't show modal if not admin/teacher or still loading
  const userRole = user?.role;
  if (authLoading || loading || !user || (userRole !== 'admin' && userRole !== 'teacher')) {
    return null;
  }

  const handleGoToSettings = () => {
    setShowModal(false);
    navigate('/admin/settings', { state: { tab: 'academic-sessions' } });
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-transparent overflow-y-auto h-full w-full z-50 flex items-center justify-center">
    <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              Academic Session Required
            </h3>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-700 mb-2">
              Before you can start using the platform, you need to set up an academic session and term.
            </p>
            
            {!sessionInfo?.has_session && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  <strong>Missing:</strong> No academic session is currently set.
                </p>
              </div>
            )}
            
            {!sessionInfo?.has_term && sessionInfo?.has_session && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-3">
                <p className="text-sm text-yellow-800">
                  <strong>Missing:</strong> No current term is set for the academic session.
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
            <p className="text-sm text-blue-800">
              <strong>What to do:</strong>
            </p>
            <ol className="text-sm text-blue-700 mt-2 ml-4 list-decimal space-y-1">
              <li>Go to Settings</li>
              <li>Open the "Academic Sessions" tab</li>
              <li>Create a new academic session (e.g., 2024/2025)</li>
              <li>Set it as the current session</li>
              <li>Set one of its terms as the current term</li>
            </ol>
          </div>
        </div>

        <div className="flex items-center justify-end p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 mr-3"
          >
            I'll do it later
          </button>
          <button
            onClick={handleGoToSettings}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white"
            style={{ backgroundColor: COLORS.primary.red }}
          >
            <Settings className="mr-2 h-4 w-4" />
            Go to Settings
          </button>
        </div>
      </div>
    </div>
  );
};

export default AcademicSessionWarningModal;

