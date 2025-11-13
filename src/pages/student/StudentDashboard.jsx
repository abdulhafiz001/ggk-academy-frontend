import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentSession, setCurrentSession] = useState(null);
  const [admissionSession, setAdmissionSession] = useState(null);
  const { showError } = useNotification();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchSessionInfo();
    }
  }, [user]);

  const fetchSessionInfo = async () => {
    try {
      const response = await API.getCurrentAcademicSession();
      const data = response.data || response;
      if (data.session) setCurrentSession(data.session);
      if (data.admission_session) setAdmissionSession(data.admission_session);
    } catch (error) {
      console.error('Error fetching session info:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await API.getStudentDashboard();
      setDashboardData(response.data);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const studentInfo = {
    name: user ? `${user.first_name} ${user.last_name}` : '',
    admissionNumber: user?.admission_number || '',
    class: user?.school_class?.name || 'No Class Assigned',
    session: currentSession?.name || 'Not Set',
    formTeacher: user?.school_class?.form_teacher?.name || 'Not Assigned'
  };

  // Calculate additional stats
  const totalSubjects = user?.student_subjects?.length || 0;
  const completedAssessments = dashboardData?.recent_scores?.length || 0;
  
  // Calculate average score the same way as in StudentResults page
  const calculateAverageScore = () => {
    if (!dashboardData?.recent_scores || dashboardData.recent_scores.length === 0) return 0;
    
    let totalScore = 0;
    let validScores = 0;
    
    dashboardData.recent_scores.forEach(score => {
      const firstCA = parseFloat(score.first_ca) || 0;
      const secondCA = parseFloat(score.second_ca) || 0;
      const exam = parseFloat(score.exam_score) || 0;
      
      if (firstCA > 0 || secondCA > 0 || exam > 0) {
        totalScore += (firstCA + secondCA + exam);
        validScores++;
      }
    });
    
    return validScores > 0 ? Math.round(totalScore / validScores) : 0;
  };
  
  const averageScore = calculateAverageScore();

  const recentResults = dashboardData?.recent_scores?.slice(0, 4).map(score => ({
    subject: score.subject?.name || 'Unknown Subject',
    score: score.total_score || 0,
    grade: score.grade || 'N/A',
    total: score.total_score || 0,
    date: score.created_at ? new Date(score.created_at).toLocaleDateString() : 'N/A'
  })) || [];

  const quickActions = [
    {
      name: 'View Results',
      href: '/student/results',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      color: COLORS.primary.red,
      description: 'Check your latest exam results'
    },
    {
      name: 'My Profile',
      href: '/student/profile',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      color: COLORS.status.success,
      description: 'Update your personal information'
    },
    {
      name: 'My Subjects',
      href: '/student/subjects',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      color: COLORS.primary.blue,
      description: 'View your academic subjects'
    },
    {
      name: 'Sign Out',
      href: '/',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      color: COLORS.status.error,
      description: 'Sign out of your account'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  return (
    <div>

      {/* School Logo Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-4 py-8 sm:px-6 text-center">
          <img 
            src="/images/G-LOVE ACADEMY.jpeg" 
            alt="G-LOVE ACADEMY Logo" 
            className="h-32 w-auto mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900">G-LOVE ACADEMY</h2>
          <p className="text-lg text-gray-600 mt-2">Student Portal Dashboard</p>
        </div>
      </div>

      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg mb-8">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-16 w-16 rounded-full flex items-center justify-center text-white text-2xl font-bold" style={{ backgroundColor: COLORS.primary.red }}>
                {studentInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
            </div>
            <div className="ml-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {studentInfo.name}!
              </h1>
              <p className="text-sm text-gray-500">
                {studentInfo.class} • {studentInfo.admissionNumber} • {studentInfo.session}
              </p>
              <p className="text-sm font-medium mt-1" style={{ color: COLORS.primary.blue }}>
                Form Teacher: {studentInfo.formTeacher}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Subjects</p>
              <p className="text-3xl font-bold">{totalSubjects}</p>
            </div>
            <div className="w-12 h-12 bg-blue-400 bg-opacity-30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Completed Assessments</p>
              <p className="text-3xl font-bold">{completedAssessments}</p>
            </div>
            <div className="w-12 h-12 bg-green-400 bg-opacity-30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Average Score</p>
              <p className="text-3xl font-bold">{averageScore}%</p>
            </div>
            <div className="w-12 h-12 bg-purple-400 bg-opacity-30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Academic Status</p>
              <p className="text-3xl font-bold">
                {averageScore >= 80 ? 'Excellent' : 
                 averageScore >= 70 ? 'Very Good' : 
                 averageScore >= 60 ? 'Good' : 
                 averageScore >= 50 ? 'Fair' : 
                 averageScore >= 40 ? 'Pass' : 'Needs Improvement'}
              </p>
            </div>
            <div className="w-12 h-12 bg-orange-400 bg-opacity-30 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>



      {/* Modern Quick Actions */}
      <div className="bg-white shadow-xl rounded-2xl mb-8 overflow-hidden">
        <div className="px-6 py-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link
                key={action.name}
                to={action.href}
                className="group relative bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200 hover:shadow-lg hover:scale-105 transition-all duration-300 hover:border-blue-300"
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300"
                    style={{ backgroundColor: action.color }}
                  >
                    {action.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {action.name}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {action.description}
                  </p>
                </div>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Enhanced Recent Results */}
      <div className="bg-white shadow-xl rounded-2xl overflow-hidden">
        <div className="px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 flex items-center">
              <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Recent Results
            </h3>
            {recentResults.length > 0 && (
              <Link
                to="/student/results"
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                View All Results
              </Link>
            )}
          </div>
          
          <div className="space-y-4">
            {recentResults.length > 0 ? (
              recentResults.map((result, index) => (
                <div key={index} className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-200 hover:border-blue-300">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <h4 className="text-lg font-semibold text-gray-900">
                          {result.subject}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Score recorded on {result.date}
                      </p>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {result.score}%
                        </div>
                        <div className="text-xs text-gray-500">Total Score</div>
                      </div>
                      <div className={`px-3 py-2 text-sm font-bold rounded-full ${
                        result.grade === 'A' ? 'text-green-700 bg-green-100 border border-green-200' :
                        result.grade === 'B' ? 'text-blue-700 bg-blue-100 border border-blue-200' :
                        result.grade === 'C' ? 'text-yellow-700 bg-yellow-100 border border-yellow-200' :
                        result.grade === 'D' ? 'text-orange-700 bg-orange-100 border border-orange-200' :
                        result.grade === 'E' ? 'text-purple-700 bg-purple-100 border border-purple-200' :
                        'text-red-700 bg-red-100 border border-red-200'
                      }`}>
                        Grade {result.grade}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recent Results</h3>
                <p className="text-gray-500">Your scores will appear here once they are recorded by your teachers</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard; 