import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  BookOpen, 
  FileText,
  TrendingUp,
  Award,
  Filter,
  Eye,
  Download,
  Calendar,
  ArrowLeft,
  Shield,
  UserCheck
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import debug from '../../utils/debug';

const Results = () => {
  const navigate = useNavigate();
  const { user, getCurrentUserWithFreshStatus } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classResults, setClassResults] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('current');

  // Calculate total students from all classes
  const totalStudents = useMemo(() => {
    return classes.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  }, [classes]);

  // Helper function to extract level from class name
  const getLevelFromClassName = (className) => {
    if (!className) return 'unknown';
    const lowerName = className.toLowerCase();
    if (lowerName.includes('jss')) return 'jss';
    if (lowerName.includes('ss')) return 'ss';
    return 'unknown';
  };

  // Initialize component and fetch classes
  useEffect(() => {
    const initializeComponent = async () => {
      if (user) {
        try {
          debug.component('Results', 'Initializing component', { 
            userRole: user?.role,
            isFormTeacher: user?.is_form_teacher
          });
          
          // Get fresh user data to ensure we have the latest form teacher status
          const currentUser = await getCurrentUserWithFreshStatus();
          debug.component('Results', 'Fresh user data received', { 
            role: currentUser?.role,
            isFormTeacher: currentUser?.is_form_teacher
          });
          
          // Fetch classes based on user role
          if (currentUser?.role === 'admin' || currentUser?.is_form_teacher) {
            debug.component('Results', 'User has access, fetching classes');
            await fetchClasses();
          } else {
            debug.component('Results', 'User does not have access');
            showError('Access denied. Only admins and form teachers can view results.');
          }
        } catch (error) {
          debug.error('Error initializing component:', error);
        }
      }
    };

    initializeComponent();
  }, [user?.id, user?.role]); // Only depend on user ID and role, not userChecked

  const fetchClasses = async () => {
    try {
      setLoading(true);
      
      debug.component('Results', 'fetchClasses called', { 
        userRole: user?.role,
        isFormTeacher: user?.is_form_teacher
      });
      
      let response;
      
      if (user?.role === 'admin') {
        // Admin can see all classes
        debug.component('Results', 'fetchClasses - Fetching as admin');
        response = await API.getClasses();
      } else if (user?.role === 'teacher') {
        // Check if teacher is a form teacher
        if (user?.is_form_teacher) {
          // Form teacher can see classes where they are form teacher
          debug.component('Results', 'fetchClasses - Fetching as form teacher');
          response = await API.getTeacherAdminClasses();
        } else {
          // Regular teachers cannot access results page
          debug.component('Results', 'fetchClasses - Access denied, not a form teacher');
          showError('Access denied. Only form teachers can view results.');
          setClasses([]);
          setLoading(false);
          return;
        }
      } else {
        debug.warn('Results - Unknown user role:', user?.role);
        showError('Unknown user role');
        setClasses([]);
        setLoading(false);
        return;
      }
      // Handle response data structure consistently
      let classesData;
      if (response.data && Array.isArray(response.data)) {
        // Response has data property with array
        classesData = response.data;
      } else if (Array.isArray(response)) {
        // Response is directly an array
        classesData = response;
      } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Response has nested data structure
        classesData = response.data.data;
      } else {
        // Fallback to empty array
        debug.warn('Results - Unexpected response structure:', response);
        classesData = [];
      }
      
      debug.component('Results', 'fetchClasses - Data loaded', { 
        count: classesData.length,
        isArray: Array.isArray(classesData)
      });
      
      // Ensure classesData is always an array
      if (!Array.isArray(classesData)) {
        debug.error('Results - Classes data is not an array:', classesData);
        classesData = [];
      }
      
      setClasses(classesData);
    } catch (error) {
      if (error.response?.status === 403) {
        showError('Access denied. You do not have permission to view results.');
        setClasses([]);
      } else {
        showError('Failed to load classes');
      }
      debug.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassResults = async (classId) => {
    try {
      setLoading(true);
      let response;
      
      // Build query parameters
      const params = {};
      if (selectedTerm && selectedTerm !== 'current') {
        params.term = selectedTerm;
      }
      
      if (user?.role === 'admin') {
        response = await API.getAdminClassResults(classId, params);
      } else if (user?.role === 'teacher' && user?.is_form_teacher) {
        // Form teachers can access class results through form teacher endpoint
        response = await API.getTeacherAdminClassResults(classId, params);
      } else {
        showError('Access denied. You do not have permission to view class results.');
        setLoading(false);
        return;
      }
      
      const data = response.data || response;
      setClassResults(data);
    } catch (error) {
      if (error.response?.status === 403) {
        showError('Access denied. You do not have permission to view this class results.');
      } else {
        showError('Failed to load class results');
      }
      debug.error('Error fetching class results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewStudentResults = async (studentId) => {
    try {
      let response;
      
      if (user?.role === 'admin') {
        // Admin can view any student results
        response = await API.getAdminStudentResults(studentId);
      } else if (user?.role === 'teacher' && user?.is_form_teacher) {
        // Form teachers can view results for students in their classes
        response = await API.getTeacherStudentResults(studentId);
      } else {
        showError('Access denied. You do not have permission to view this student\'s results.');
        return;
      }
      
      // Navigate to student results page with the data based on user role
      if (user?.role === 'admin') {
        navigate(`/admin/students/${studentId}/results`, { 
          state: { 
            studentResults: response.data || response,
            userRole: user?.role 
          } 
        });
      } else if (user?.role === 'teacher' && user?.is_form_teacher) {
        navigate(`/teacher/student-results/${studentId}`, { 
          state: { 
            studentResults: response.data || response,
            userRole: user?.role 
          } 
        });
      }
    } catch (error) {
      debug.error('Error fetching student results:', error);
      if (error.response?.status === 403) {
        showError('Access denied. You do not have permission to view this student\'s results.');
      } else {
        showError('Failed to load student results');
      }
    }
  };

  const handleSelectClass = async (classItem) => {
    setSelectedClass(classItem);
    await fetchClassResults(classItem.id);
  };

  const handleBackToClasses = () => {
    setSelectedClass(null);
    setClassResults(null);
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'primary': return 'bg-blue-100 text-blue-800';
      case 'jss': return 'bg-green-100 text-green-800';
      case 'sss': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-orange-600 bg-orange-100';
      case 'E': return 'text-red-600 bg-red-100';
      case 'F': return 'text-red-800 bg-red-200';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'draft': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const filteredClasses = useMemo(() => {
    // Ensure classes is always an array
    if (!Array.isArray(classes)) {
      debug.warn('Results - Classes is not an array:', classes);
      return [];
    }
    
    let filtered = classes;

    // Filter by level
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(cls => getLevelFromClassName(cls.name) === selectedLevel);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(cls =>
        cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cls.form_teacher?.name && cls.form_teacher.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    return filtered;
  }, [classes, selectedLevel, searchTerm]);

  const calculateStudentAverage = (student) => {
    if (!student.results || Object.keys(student.results).length === 0) {
      return 0;
    }

    let totalScore = 0;
    let totalSubjects = 0;

    Object.values(student.results).forEach(termScores => {
      termScores.forEach(score => {
        totalScore += score.total_score || 0;
        totalSubjects++;
      });
    });

    return totalSubjects > 0 ? Math.round((totalScore / totalSubjects) * 100) / 100 : 0;
  };

  const calculateStudentGrade = (average) => {
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 50) return 'D';
    if (average >= 40) return 'E';
    return 'F';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  // Check access for teachers
  if (user?.role === 'teacher' && !user?.is_form_teacher) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          Only form teachers can access the results page. Please contact the administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Results Management</h1>
          <p className="text-gray-600">
            {user?.role === 'admin' ? 'View and manage all class results' : 'View results for your assigned classes'}
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">Total Students</div>
          <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
          <div className="text-sm text-gray-500">{classes.length} Classes</div>
        </div>
      </div>

      {/* Access Control Notice */}
      {user?.role === 'teacher' && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
              <div className="flex-shrink-0">
              <Shield className="h-5 w-5 text-blue-400" />
              </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Form Teacher Access
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  You can only view results for classes where you are assigned as the form teacher.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!selectedClass ? (
        <>
      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Classes
                </label>
            <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                    placeholder="Search by class name or form teacher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
          </div>

              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Level
                </label>
              <select 
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <option value="all">All Levels</option>
                  <option value="primary">Primary</option>
                  <option value="jss">Junior Secondary</option>
                  <option value="sss">Senior Secondary</option>
            </select>
          </div>

              <div className="sm:w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Term
                </label>
              <select 
                value={selectedTerm}
                onChange={(e) => setSelectedTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <option value="current">Current Term</option>
                  <option value="first">First Term</option>
                  <option value="second">Second Term</option>
                  <option value="third">Third Term</option>
            </select>
          </div>
        </div>
      </div>

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClasses.map((classItem) => {
              const level = getLevelFromClassName(classItem.name);
              const studentCount = classItem.students_count || 0;
              
              return (
              <div 
                key={classItem.id} 
                  className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
                onClick={() => handleSelectClass(classItem)}
              >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary.red}20` }}>
                        <BookOpen className="h-5 w-5" style={{ color: COLORS.primary.red }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {classItem.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(level)}`}>
                          {level.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <Eye className="h-5 w-5 text-gray-400" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Form Teacher:</span>
                      <span className="font-medium text-gray-900">
                        {classItem.form_teacher?.name || 'Not Assigned'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Students:</span>
                      <span className="font-medium text-gray-900">{studentCount}</span>
                  </div>
                  
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Active
                    </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClass(classItem);
                      }}
                      className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                      style={{ backgroundColor: COLORS.primary.red, '--tw-ring-color': COLORS.primary.red }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.primary.blue}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.primary.red}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Results
                    </button>
                    </div>
                  </div>
              );
            })}
          </div>

          {filteredClasses.length === 0 && (
            <div className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search criteria.' : 'No classes are available for your access level.'}
              </p>
            </div>
          )}
        </>
      ) : (
        /* Class Results View */
        <div className="space-y-6">
          {/* Back Button */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleBackToClasses}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ '--tw-ring-color': COLORS.primary.red }}
                >
              <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Classes
                </button>
            <h3 className="text-xl font-semibold text-gray-900">
              {selectedClass.name} - Results
            </h3>
                  </div>

          {classResults ? (
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">
                    Student Results ({classResults.results?.length || 0} students)
                  </h4>
                  <div className="flex space-x-2">
                    <button className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </button>
                  </div>
                </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Admission No.
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Average Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {classResults.results?.map((result) => {
                      const student = result.student;
                      const average = calculateStudentAverage(student);
                      const grade = calculateStudentGrade(average);
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary.red}20` }}>
                                  <span className="text-sm font-medium" style={{ color: COLORS.primary.red }}>
                                    {student.first_name?.[0]}{student.last_name?.[0]}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.first_name} {student.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.email}
                          </div>
                          </div>
                        </div>
                      </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {student.admission_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                              {average > 0 ? `${average}%` : 'No scores'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                              onClick={() => handleViewStudentResults(student.id)}
                              className="hover:opacity-80"
                              style={{ color: COLORS.primary.red }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            
            {/* Individual Student Results Section for Form Teachers */}
            {user?.role === 'teacher' && user?.is_form_teacher && (
              <div className="mt-6 p-6 bg-gray-50 rounded-lg">
                <h5 className="text-lg font-medium text-gray-900 mb-4">
                  Individual Student Results
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classResults.results?.map((result) => {
                    const student = result.student;
                    const average = calculateStudentAverage(student);
                    const grade = calculateStudentGrade(average);
                    
                    return (
                      <div key={student.id} className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${COLORS.primary.red}20` }}>
                            <span className="text-sm font-medium" style={{ color: COLORS.primary.red }}>
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </span>
                          </div>
                          <div className="flex-1">
                            <h6 className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </h6>
                            <p className="text-xs text-gray-500">{student.admission_number}</p>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Average:</span>
                            <span className="font-medium text-gray-900">
                              {average > 0 ? `${average}%` : 'No scores'}
                            </span>
                          </div>
                        </div>
                        
                        <button
                          onClick={() => handleViewStudentResults(student.id)}
                          className="w-full mt-3 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2"
                          style={{ backgroundColor: COLORS.primary.red, '--tw-ring-color': COLORS.primary.red }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = COLORS.primary.blue}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = COLORS.primary.red}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No results available</h3>
              <p className="mt-1 text-sm text-gray-500">
                No results have been published for this class yet.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Results; 