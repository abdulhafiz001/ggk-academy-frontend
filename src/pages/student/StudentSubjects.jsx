import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import API from '../../services/API';

const StudentSubjects = () => {
  const [selectedTerm, setSelectedTerm] = useState('Second Term');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { showError } = useNotification();

  const [currentSession, setCurrentSession] = useState(null);
  const [admissionSession, setAdmissionSession] = useState(null);

  useEffect(() => {
    const fetchSessionInfo = async () => {
      try {
        const response = await API.getCurrentAcademicSession();
        const data = response.data || response;
        if (data.session) setCurrentSession(data.session);
        // Note: admission session would come from student profile
      } catch (error) {
        console.error('Error fetching session info:', error);
      }
    };
    fetchSessionInfo();
  }, []);

  const studentInfo = {
    name: user ? `${user.first_name} ${user.last_name}` : "Loading...",
    class: user?.school_class?.name || "Loading...",
    session: currentSession?.name || "Not Set"
  };

  // Fetch student subjects from backend
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await API.getStudentSubjects();
        setSubjects(response.data || []);
      } catch (err) {
        showError(err.response?.data?.message || 'Failed to load subjects');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A+': return 'text-green-800 bg-green-100 border-green-200';
      case 'A': return 'text-green-700 bg-green-50 border-green-200';
      case 'B+': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'C+': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Submitted': return 'text-blue-700 bg-blue-100';
      case 'Graded': return 'text-green-700 bg-green-100';
      case 'Pending': return 'text-orange-700 bg-orange-100';
      case 'Available': return 'text-green-700 bg-green-100';
      case 'In Use': return 'text-blue-700 bg-blue-100';
      case 'Active': return 'text-purple-700 bg-purple-100';
      default: return 'text-gray-700 bg-gray-100';
    }
  };

  // Calculate stats with safety checks
  const totalSubjects = subjects && Array.isArray(subjects) ? subjects.length : 0;
  const averageProgress = totalSubjects > 0 
    ? Math.round(subjects.reduce((sum, subject) => sum + (subject.progress || 0), 0) / totalSubjects)
    : 0;
  
  // Calculate subjects with grades
  const subjectsWithGrades = totalSubjects > 0 
    ? subjects.filter(subject => subject.grade && subject.grade !== 'N/A').length
    : 0;
  
  // Calculate average grade (convert to numeric for calculation)
  const gradeToNumeric = (grade) => {
    switch (grade) {
      case 'A': return 5;
      case 'B': return 4;
      case 'C': return 3;
      case 'D': return 2;
      case 'E': return 1;
      case 'F': return 0;
      default: return null;
    }
  };
  
  const grades = subjects.map(subject => gradeToNumeric(subject.grade)).filter(grade => grade !== null);
  const averageGrade = grades.length > 0 
    ? (grades.reduce((sum, grade) => sum + grade, 0) / grades.length).toFixed(1)
    : 'N/A';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Subjects</h1>
              <p className="mt-1 text-lg text-gray-600">
                Academic curriculum and course management
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option>First Term</option>
                <option>Second Term</option>
                <option>Third Term</option>
              </select>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                {studentInfo.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h3 className="font-semibold text-gray-900">{studentInfo.name}</h3>
              <p className="text-sm text-gray-600">{studentInfo.class}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{totalSubjects}</div>
              <p className="text-sm text-gray-600 mt-1">Total Subjects</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{averageProgress}%</div>
              <p className="text-sm text-gray-600 mt-1">Average Progress</p>
            </div>
          </div>
        </div>

        {/* Subjects Display */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-lg text-gray-600">Loading subjects...</p>
          </div>
        ) : !subjects || !Array.isArray(subjects) || subjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects assigned</h3>
              <p className="mt-1 text-sm text-gray-500">
                You haven't been assigned to any subjects yet. Please contact your administrator.
              </p>
            </div>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className={`h-2 bg-gradient-to-r ${subject.color || 'from-blue-500 to-blue-600'}`}></div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-3xl">{subject.icon || '📚'}</div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{subject.grade || 'N/A'}</div>
                      <div className="text-sm text-gray-500">Current Grade</div>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{subject.name}</h3>
                  <p className="text-sm text-gray-600 mb-4">{subject.description || 'Subject description not available'}</p>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>Progress</span>
                      <span>{subject.progress || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${subject.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-0">
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r ${subject.color} rounded-lg flex items-center justify-center text-white text-lg sm:text-2xl flex-shrink-0`}>
                        {subject.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{subject.name}</h3>
                        <p className="text-sm text-gray-600 line-clamp-2 sm:line-clamp-1">{subject.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:block sm:text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium border ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </span>
                      <div className="sm:mt-2">
                        <div className="flex items-center space-x-3 sm:justify-end">
                          <span className="text-sm text-gray-600 sm:hidden">Progress:</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 sm:w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`bg-gradient-to-r ${subject.color} h-2 rounded-full transition-all duration-500`}
                                style={{ width: `${subject.progress}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900 w-10 text-right">{subject.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Total Subjects</h3>
                <p className="text-2xl font-bold text-blue-600">{totalSubjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">With Grades</h3>
                <p className="text-2xl font-bold text-green-600">{subjectsWithGrades}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Average Grade</h3>
                <p className="text-2xl font-bold text-purple-600">{averageGrade}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Progress</h3>
                <p className="text-2xl font-bold text-orange-600">{averageProgress}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentSubjects; 