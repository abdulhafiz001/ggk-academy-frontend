import { useState, useMemo, useEffect } from 'react';
import { 
  Users, 
  Search, 
  BookOpen, 
  GraduationCap,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Shield
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import debug from '../../utils/debug';
import { Link } from 'react-router-dom';

const Classes = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedClasses, setExpandedClasses] = useState({});
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState([]);
  const { showError, showSuccess } = useNotification();
  const { user, getCurrentUserWithFreshStatus } = useAuth();
  const [selectedClass, setSelectedClass] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);

  // Initialize component and fetch data
  useEffect(() => {
    const initializeComponent = async () => {
      if (user) {
        try {
          // Get fresh user data to ensure we have the latest form teacher status
          const currentUser = await getCurrentUserWithFreshStatus();
          
          // Fetch classes based on user role
          if (currentUser?.role === 'admin' || currentUser?.is_form_teacher) {
            await fetchClasses();
          }
          
          // Fetch teachers if admin
          if (currentUser?.role === 'admin') {
            await fetchTeachers();
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
      
      debug.component('Classes', 'fetchClasses', { userRole: user?.role, isFormTeacher: user?.is_form_teacher });
      
      let response;
      
      if (user?.role === 'admin') {
        // Admin can see all classes
        response = await API.getClasses();
      } else if (user?.role === 'teacher') {
        // Check if teacher is a form teacher
        if (user?.is_form_teacher) {
          // Form teacher can see classes where they are form teacher
          response = await API.getTeacherAdminClasses();
        } else {
          // Regular teachers cannot access classes page
          showError('Access denied. Only form teachers can view classes.');
          setClasses([]);
          setLoading(false);
          return;
        }
      } else {
        showError('Access denied. You do not have permission to view classes.');
        setClasses([]);
        setLoading(false);
        return;
      }
      
      // Handle different response structures
      let classesData = [];
      
      if (user?.role === 'teacher') {
        // Form teacher response - should be direct array from form-teacher endpoint
        classesData = response.data || response;
        // Ensure it's an array
        classesData = Array.isArray(classesData) ? classesData : [];
      } else {
        // Admin response - API service returns { data: backendResponse, status }
        // Backend returns { data: [...], total: X, message: "..." }
        // So the structure is: response.data = { data: [...], total: X, message: "..." }
        // Therefore: response.data.data = [...]
        if (response?.data) {
          // First check if response.data.data exists and is an array (standard backend structure)
          if (response.data.data && Array.isArray(response.data.data)) {
            classesData = response.data.data;
          } 
          // If response.data is directly an array (unlikely but possible)
          else if (Array.isArray(response.data)) {
            classesData = response.data;
          }
          // Try to find any array property in response.data
          else if (typeof response.data === 'object') {
            const keys = Object.keys(response.data);
            for (const key of keys) {
              if (Array.isArray(response.data[key])) {
                classesData = response.data[key];
                break;
              }
            }
          }
        } else if (Array.isArray(response)) {
          classesData = response;
        }
        
        // Ensure it's always an array
        if (!Array.isArray(classesData)) {
          debug.warn('Unexpected admin response structure:', response);
          classesData = [];
        }
      }
      
      // Final check - ensure it's always an array
      if (!Array.isArray(classesData)) {
        debug.error('Classes data is not an array after processing:', classesData);
        classesData = [];
      }
      
      debug.component('Classes', 'fetchClasses - Data loaded', { 
        count: classesData?.length || 0,
        isArray: Array.isArray(classesData)
      });
      
      setClasses(classesData);
    } catch (error) {
      if (error.response?.status === 403) {
        showError('Access denied. You do not have permission to view classes.');
        setClasses([]);
      } else {
        showError('Failed to load classes');
      }
      debug.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await API.getUsers();
      const teachersData = response.data.filter(user => user.role === 'teacher');
      setTeachers(teachersData);
    } catch (error) {
      debug.error('Error fetching teachers:', error);
    }
  };

  const toggleClass = (classId) => {
    setExpandedClasses(prev => ({
      ...prev,
      [classId]: !prev[classId]
    }));
  };

  const getLevelColor = (level) => {
    const colors = {
      'jss': 'bg-green-100 text-green-800',
      'ss': 'bg-purple-100 text-purple-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  const getLevelFromClassName = (className) => {
    if (className.includes('JSS')) return 'jss';
    if (className.includes('SS')) return 'ss';
    return 'other';
  };

  const filteredClasses = useMemo(() => {
    let filtered = classes;

    // Filter by level
    if (selectedLevel !== 'all') {
      if (selectedLevel === 'jss') {
        filtered = filtered.filter(cls => cls.name.includes('JSS'));
      } else if (selectedLevel === 'ss') {
        filtered = filtered.filter(cls => cls.name.includes('SS'));
      }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
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
          Only form teachers can access the classes page. Please contact the administrator if you believe this is an error.
        </p>
      </div>
    );
  }

  const totalStudents = classes.reduce((sum, cls) => {
    const count = cls.student_count || cls.students?.length || 0;
    return sum + (Number.isNaN(count) ? 0 : Number(count));
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Classes Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {user?.role === 'admin' 
              ? 'Manage all classes from Primary 1 to SS 3 and their students.'
              : 'View classes where you are assigned as the form teacher.'
            }
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/admin/settings">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
            style={{ backgroundColor: COLORS.primary.red }}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Class
          </button>
          
          </Link>
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
                  You can only view classes where you are assigned as the form teacher.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BookOpen className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Classes</dt>
                  <dd className="text-lg font-medium text-gray-900">{classes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Students</dt>
                  <dd className="text-lg font-medium text-gray-900">{totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-green-100 flex items-center justify-center">
                  <GraduationCap className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Junior Secondary</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classes.filter(cls => {
                      const name = cls.name?.toUpperCase() || '';
                      return name.includes('JSS') && !name.includes('SS');
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center">
                  <BookOpen className="h-4 w-4 text-purple-600" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Senior Secondary</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {classes.filter(cls => {
                      const name = cls.name?.toUpperCase() || '';
                      return name.includes('SS') && !name.includes('JSS');
                    }).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes or teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <select 
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': COLORS.primary.red }}
            >
              <option value="all">All Levels</option>
              <option value="jss">Junior Secondary (JSS)</option>
              <option value="ss">Senior Secondary (SS)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-4">
        {filteredClasses.map((classItem) => (
          <div key={classItem.id} className="bg-white shadow rounded-lg overflow-hidden">
            <div 
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleClass(classItem.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-gray-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{classItem.name}</h3>
                    <p className="text-sm text-gray-600">Class Teacher: {classItem.form_teacher?.name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getLevelColor(getLevelFromClassName(classItem.name))}`}>
                    {getLevelFromClassName(classItem.name).charAt(0).toUpperCase() + getLevelFromClassName(classItem.name).slice(1)}
                  </span>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {classItem.student_count || classItem.students?.length || 0}
                    </div>
                    <div className="text-sm text-gray-500">Students</div>
                  </div>
                  {expandedClasses[classItem.id] ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded Student List */}
            {expandedClasses[classItem.id] && (
              <div className="border-t border-gray-200 bg-gray-50 p-6">
                <h4 className="text-sm font-medium text-gray-900 mb-4">Students in {classItem.name}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classItem.students && classItem.students.length > 0 ? (
                    classItem.students.map((student) => (
                    <div key={student.id} className="bg-white p-4 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="flex-1">
                            <h5 className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </h5>
                          <p className="text-xs text-gray-500">{student.admission_number}</p>
                            <p className="text-xs text-gray-500">
                              {student.date_of_birth ? 
                                `${new Date().getFullYear() - new Date(student.date_of_birth).getFullYear()} years` : 
                                'Age not specified'
                              }
                            </p>
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8">
                      <Users className="mx-auto h-8 w-8 text-gray-400" />
                      <p className="mt-2 text-sm text-gray-500">No students in this class</p>
                    </div>
                  )}
                  {classItem.students && (() => {
                    const studentCount = classItem.student_count || classItem.students.length || 0;
                    const displayedCount = classItem.students.length || 0;
                    const remaining = Number(studentCount) - Number(displayedCount);
                    return remaining > 0 && (
                      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200 flex items-center justify-center">
                        <span className="text-sm text-gray-500">
                          +{remaining} more students
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredClasses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No classes found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  );
};

export default Classes; 