import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen,
  Mail,
  Phone,
  Calendar,
  MapPin,
  GraduationCap,
  UserPlus,
  Download,
  Upload,
  FileText,
  Shield,
  UserCheck,
  X
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import EditStudentModal from '../../components/EditStudentModal';
import debug from '../../utils/debug';

const Students = () => {
  const navigate = useNavigate();
  const { showError, showSuccess } = useNotification();
  const { user, refreshUserData } = useAuth();
  const [userFormTeacherStatus, setUserFormTeacherStatus] = useState(null);
  const hasRefreshedUserRef = useRef(false);
  const lastUserIdRef = useRef(null);
  const [selectedClass, setSelectedClass] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  const [showFilters, setShowFilters] = useState(false);
  const [filterGender, setFilterGender] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, student: null });
  const [editModal, setEditModal] = useState({ isOpen: false, student: null });
  const [submitting, setSubmitting] = useState(false);
  const [importModal, setImportModal] = useState({ isOpen: false, importing: false, selectedClassId: null });
  const [exportModal, setExportModal] = useState({ isOpen: false, selectedClassId: null });
  const [importResults, setImportResults] = useState(null);

  // Role-based permissions - use useMemo to ensure they update when user changes
  const isAdmin = useMemo(() => user?.role === 'admin', [user?.role]);
  const isTeacher = useMemo(() => user?.role === 'teacher', [user?.role]);
  // Use userFormTeacherStatus state if available, otherwise fall back to user.is_form_teacher
  const effectiveFormTeacherStatus = userFormTeacherStatus !== null ? userFormTeacherStatus : (user?.is_form_teacher === true || user?.is_form_teacher === 1);
  const isFormTeacher = useMemo(() => isTeacher && effectiveFormTeacherStatus, [isTeacher, effectiveFormTeacherStatus]);
  const canManageStudents = useMemo(() => isAdmin || isFormTeacher, [isAdmin, isFormTeacher]);
  // Only admin and form teachers can import/export
  const canImportExport = useMemo(() => isAdmin || isFormTeacher, [isAdmin, isFormTeacher]);
  
  // Check if user can view results (all roles can view results)
  const canViewResults = true;
  
  // Get role-specific header message
  const getHeaderMessage = () => {
    if (user?.role === 'admin') {
      return "Manage all students in the school";
    } else if (user?.role === 'teacher' && user?.is_form_teacher) {
      return "Manage students in your assigned classes and view students in classes you teach";
    } else if (user?.role === 'teacher') {
      return "View students in classes where you teach subjects (read-only access)";
    }
    return "Student Management";
  };

  // Only refresh user data once when component mounts or user ID actually changes
  useEffect(() => {
    if (user && user.id !== lastUserIdRef.current) {
      // User ID changed, reset the refresh flag
      hasRefreshedUserRef.current = false;
      lastUserIdRef.current = user.id;
    }

    if (user && !hasRefreshedUserRef.current && user.role === 'teacher') {
      hasRefreshedUserRef.current = true;
      refreshUserData().then(updatedUser => {
        if (updatedUser) {
          setUserFormTeacherStatus(updatedUser.is_form_teacher);
        }
      }).catch(error => {
        debug.error('Error refreshing user data:', error);
        hasRefreshedUserRef.current = false; // Allow retry on error
      });
    } else if (user && !hasRefreshedUserRef.current) {
      // For non-teachers, just mark as refreshed
      hasRefreshedUserRef.current = true;
    }
  }, [user?.id, user?.role, refreshUserData]); // Only depend on user ID and role

  // Fetch students and classes when user is available (only once per user ID)
  useEffect(() => {
    if (user && user.id) {
      fetchStudents();
      fetchClasses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user ID to prevent loops

  // Update class counts when students change
  useEffect(() => {
    if (students.length > 0 && classes.length > 0) {
      // Only update if we don't have counts yet
      const hasCounts = classes.some(cls => cls.count !== undefined && cls.count !== 0);
      if (!hasCounts) {
        updateClassCounts();
      }
    }
  }, [students, classes]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // Use appropriate API endpoint based on user role
      const response = user?.role === 'teacher'
        ? await API.getTeacherStudents()
        : await API.getStudents();
      
      // Handle different response structures
      let studentsData;
      
      if (user?.role === 'teacher') {
        // Teacher response might be wrapped in data property
        const teacherResponse = response.data || response;
        if (teacherResponse?.students) {
          studentsData = teacherResponse.students;
          // Update user form teacher status from API response
          if (teacherResponse.is_form_teacher !== undefined && user) {
            setUserFormTeacherStatus(teacherResponse.is_form_teacher);
            // Also update localStorage for persistence
            const updatedUser = { ...user, is_form_teacher: teacherResponse.is_form_teacher };
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        } else {
          studentsData = [];
        }
      } else if (Array.isArray(response)) {
        // Direct array response (Admin)
        studentsData = response;
      } else if (response?.data && Array.isArray(response.data)) {
        // Admin response with data wrapper
        studentsData = response.data;
      } else {
        // Fallback
        studentsData = [];
      }
      
      debug.component('Students', 'fetchStudents - Data loaded', { 
        count: studentsData?.length || 0,
        isArray: Array.isArray(studentsData)
      });
      
      setStudents(Array.isArray(studentsData) ? studentsData : []);
    } catch (error) {
      showError('Failed to load students');
      debug.error('Error fetching students:', error);
      setStudents([]); // Ensure students is always an array
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      let response;
      
      if (user?.role === 'teacher') {
        // Form teachers can see their assigned classes (where they are form teacher)
        response = await API.getFormTeacherClasses();
      } else {
        // Admins can see all classes
        response = await API.getClasses();
      }
      
      // Handle different response structures
      // API service returns { data: backendResponse, status }
      // Backend returns { data: [...], total: X, message: "..." }
      // So the structure is: response.data = { data: [...], total: X, message: "..." }
      // Therefore: response.data.data = [...]
      let classData = [];
      if (response?.data) {
        // First check if response.data.data exists and is an array (standard backend structure)
        if (response.data.data && Array.isArray(response.data.data)) {
          classData = response.data.data;
        } 
        // If response.data is directly an array (unlikely but possible)
        else if (Array.isArray(response.data)) {
          classData = response.data;
        }
        // Try to find any array property in response.data
        else if (typeof response.data === 'object') {
          const keys = Object.keys(response.data);
          for (const key of keys) {
            if (Array.isArray(response.data[key])) {
              classData = response.data[key];
              break;
            }
          }
        }
      } else if (Array.isArray(response)) {
        // If response is directly an array
        classData = response;
      }
      
      // Ensure it's always an array
      if (!Array.isArray(classData)) {
        debug.warn('Students - Unexpected classes response structure:', response);
        classData = [];
      }
      
      debug.component('Students', 'fetchClasses - Data loaded', { 
        count: classData.length,
        isArray: Array.isArray(classData)
      });
      
      // Store raw class data first, counts will be updated later
      const allClasses = [
        { id: 'all', name: 'All Classes', count: 0, color: 'bg-gray-100 text-gray-800' },
        ...(Array.isArray(classData) ? classData.map(cls => ({
          id: cls.id,
          name: cls.name,
          count: 0, // Will be updated when students are loaded
          color: getClassColor(cls.name)
        })) : [])
      ];
      
      setClasses(allClasses);
    } catch (error) {
      debug.error('Error fetching classes:', error);
      // Don't show error for teachers if they have no assignments
      if (user?.role === 'teacher' && error.response?.status === 404) {
        setClasses([{ id: 'all', name: 'All Classes', count: 0, color: 'bg-gray-100 text-gray-800' }]);
      } else {
        showError('Failed to load classes');
        setClasses([{ id: 'all', name: 'All Classes', count: 0, color: 'bg-gray-100 text-gray-800' }]);
      }
    }
  };

  const updateClassCounts = useCallback(() => {
    setClasses(prevClasses =>
      prevClasses.map(cls => ({
        ...cls,
        count: cls.id === 'all'
          ? students.length
          : students.filter(s => s.class_id?.toString() === cls.id.toString()).length
      }))
    );
  }, [students]);

  const getClassColor = (className) => {
    const colors = [
      'bg-blue-100 text-blue-800',
      'bg-green-100 text-green-800',
      'bg-yellow-100 text-yellow-800',
      'bg-purple-100 text-purple-800',
      'bg-red-100 text-red-800',
      'bg-indigo-100 text-indigo-800',
      'bg-pink-100 text-pink-800',
      'bg-orange-100 text-orange-800'
    ];
    const index = className.length % colors.length;
    return colors[index];
  };

  // Filter students based on selected class, search term, and additional filters
  const filteredStudents = useMemo(() => {
    if (!Array.isArray(students) || students.length === 0) return [];

    const filtered = students.filter(student => {
      // Class filter (from tabs)
      const matchesClass = selectedClass === 'all' || student.class_id?.toString() === selectedClass?.toString();
      
      // Additional class filter (from filter panel)
      const matchesFilterClass = !filterClass || filterClass === '' || student.class_id?.toString() === filterClass?.toString();
      
      // Gender filter
      const matchesGender = !filterGender || filterGender === '' || student.gender?.toLowerCase() === filterGender.toLowerCase();
      
      // Search filter
      const matchesSearch = !searchTerm || searchTerm === '' || 
                           student.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           student.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesClass && matchesFilterClass && matchesGender && matchesSearch;
    });
    
    debug.component('Students', 'Filtering students', { 
      selectedClass,
      filterClass,
      filterGender,
      searchTermLength: searchTerm?.length || 0,
      totalStudents: students.length,
      filteredCount: filtered.length
    });
    
    return filtered;
  }, [selectedClass, filterClass, filterGender, searchTerm, students]);

  const handleDeleteStudent = useCallback(async () => {
    if (!deleteModal.student) return;

    setSubmitting(true);
    try {
      if (user?.role === 'teacher') {
        await API.deleteStudent(deleteModal.student.id);
      } else {
        await API.deleteStudent(deleteModal.student.id);
      }
      showSuccess('Student deleted successfully');
      setDeleteModal({ isOpen: false, student: null });
      fetchStudents(); // Refresh the list
    } catch (error) {
      showError('Failed to delete student');
      debug.error('Error deleting student:', error);
    } finally {
      setSubmitting(false);
    }
  }, [deleteModal.student, showSuccess, showError, user?.role]);

  const handleEditStudent = useCallback((student) => {
    setEditModal({ isOpen: true, student });
  }, []);

  const handleEditSuccess = useCallback((updatedStudent) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    showSuccess('Student updated successfully');
  }, [showSuccess]);

  const openDeleteModal = useCallback((student) => {
    // Check permissions for deletion
    if (user?.role === 'teacher' && !student.can_manage) {
      showError('You can only delete students from classes where you are the form teacher');
      return;
    }
    setDeleteModal({ isOpen: true, student });
  }, [user?.role, showError]);

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, student: null });
  }, []);

  const closeEditModal = useCallback(() => {
    setEditModal({ isOpen: false, student: null });
  }, []);

  const handleViewStudent = useCallback((student) => {
    // Navigate to student details page instead of results
    if (user?.role === 'admin') {
      navigate(`/admin/students/${student.id}/details`);
    } else if (user?.role === 'teacher' && effectiveFormTeacherStatus) {
      navigate(`/teacher/students/${student.id}/details`);
    } else {
      // Regular teachers cannot view details
      showError('Access denied. Only form teachers can view student details.');
    }
  }, [navigate, user, effectiveFormTeacherStatus]);

  const getClassColorForStudent = useCallback((className) => {
    const classItem = classes.find(c => c.name === className);
    return classItem ? classItem.color : 'bg-gray-100 text-gray-800';
  }, [classes]);

  // Check if user can manage a specific student
  const canManageStudent = useCallback((student) => {
    if (isAdmin) return true;
    if (isTeacher && student.can_manage) return true;
    return false;
  }, [isAdmin, isTeacher]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
            Students Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {getHeaderMessage()}
          </p>
          {isTeacher && (
            <div className="mt-2 flex items-center text-sm text-blue-600">
              <Shield className="mr-2 h-4 w-4" />
              {effectiveFormTeacherStatus 
                ? 'You have form teacher permissions for some classes'
                : 'You can view students but cannot manage them'
              }
            </div>
          )}
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          {canImportExport && user && (
            <>
              <button 
                onClick={() => {
                  setExportModal({ isOpen: true, selectedClassId: null });
                }}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </button>
              <button 
                onClick={() => setImportModal({ isOpen: true, importing: false, selectedClassId: null })}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Upload className="mr-2 h-4 w-4" />
                Import
              </button>
            </>
          )}
          {canManageStudents && user && (
            <button 
              onClick={() => navigate('/admin/add-student')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
              style={{ backgroundColor: COLORS.primary.red }}>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Student
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards - Compact */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-lg font-semibold text-gray-900">{students.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-lg font-semibold text-gray-900">{students.filter(s => s.is_active).length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <GraduationCap className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Classes</p>
              <p className="text-lg font-semibold text-gray-900">{classes.length - 1}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BookOpen className="w-5 h-5 text-orange-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Filtered</p>
              <p className="text-lg font-semibold text-gray-900">{filteredStudents.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Filter Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6 overflow-x-auto">
            {classes.map((classItem) => (
              <button
                key={classItem.id}
                onClick={() => {
                  debug.component('Students', 'Class tab clicked', { 
                    classId: classItem.id,
                    className: classItem.name
                  });
                  setSelectedClass(classItem.id);
                }}
                className={`
                  group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${selectedClass === classItem.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                style={selectedClass === classItem.id ? { borderColor: COLORS.primary.red, color: COLORS.primary.red } : {}}
              >
                <Users className="mr-2 h-5 w-5" />
                {classItem.name}
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${classItem.color}`}>
                  {classItem.count}
                </span>
              </button>
            ))}
          </nav>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search students by name, admission number, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                />
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </button>
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'grid' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-2 text-sm font-medium ${
                    viewMode === 'table' 
                      ? 'bg-gray-100 text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>

          {/* Additional Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select 
                  value={filterGender}
                  onChange={(e) => setFilterGender(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                >
                  <option value="">All Genders</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
                <select 
                  value={filterClass}
                  onChange={(e) => setFilterClass(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                >
                  <option value="">All Classes</option>
                  {classes.filter(c => c.id !== 'all').map((classItem) => (
                    <option key={classItem.id} value={classItem.id}>
                      {classItem.name}
                    </option>
                  ))}
                </select>
                <button 
                  onClick={() => {
                    setFilterGender('');
                    setFilterClass('');
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Students Content */}
        <div className="p-6">
          {viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredStudents.map((student) => (
                <div 
                  key={`student-${student.id}`} 
                  className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => handleViewStudent(student)}
                >
                  <div className="p-6">
                    {/* Student Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                          {student.avatar ? (
                            <img src={student.avatar} alt={`${student.first_name} ${student.last_name}`} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <Users className="w-6 h-6 text-gray-400" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {student.first_name} {student.last_name}
                          </h3>
                          <p className="text-sm text-gray-500">{student.admission_number}</p>
                        </div>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewStudent(student);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                          title="View Results"
                        >
                          <FileText className="h-4 w-4" />
                        </button>
                        {canManageStudent(student) && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditStudent(student);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit Student"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDeleteModal(student);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete student"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Student Info */}
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassColorForStudent(student.school_class?.name)}`}>
                          {student.school_class?.name || 'No Class'}
                        </span>
                        {student.is_form_teacher && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                            <UserCheck className="mr-1 h-3 w-3" />
                            Form Teacher
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="mr-2 h-4 w-4" />
                        {student.email || 'No email'}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="mr-2 h-4 w-4" />
                        {student.phone || 'No phone'}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        {student.date_of_birth || 'No DOB'}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="mr-2 h-4 w-4" />
                        {student.address || 'No address'}
                      </div>
                    </div>

                    {/* Subjects */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <BookOpen className="mr-2 h-4 w-4" />
                        Subjects ({student.student_subjects?.length || 0})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {student.student_subjects?.slice(0, 3).map((subject) => (
                          <span
                            key={subject.id}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700"
                          >
                            {subject.subject?.name}
                          </span>
                        ))}
                        {student.student_subjects?.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600">
                            +{student.student_subjects.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Table View */
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Class
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subjects
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr 
                      key={`student-row-${student.id}`} 
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleViewStudent(student)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                            {student.avatar ? (
                              <img src={student.avatar} alt={`${student.first_name} ${student.last_name}`} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              <Users className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{student.admission_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getClassColorForStudent(student.school_class?.name)}`}>
                            {student.school_class?.name || 'No Class'}
                          </span>
                          {student.is_form_teacher && (
                            <span className="mt-1 inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">
                              <UserCheck className="mr-1 h-3 w-3" />
                              Form Teacher
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{student.email || 'No email'}</div>
                        <div className="text-sm text-gray-500">{student.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {student.student_subjects?.slice(0, 2).map((subject, index) => (
                            <span
                              key={`${student.id}-subject-${index}`}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-50 text-blue-700"
                            >
                              {subject.subject?.name}
                            </span>
                          ))}
                          {student.student_subjects?.length > 2 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600">
                              +{student.student_subjects.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewStudent(student);
                            }}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="View Results"
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                          {canManageStudent(student) && (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditStudent(student);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 transition-colors"
                              title="Edit Student"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {isAdmin && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openDeleteModal(student);
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors"
                              title="Delete student"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Empty State */}
          {filteredStudents.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {isTeacher && students.length === 0
                  ? 'No students offering your assigned subjects yet'
                  : 'No students found'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isTeacher && students.length === 0
                  ? 'Students will appear here once they are enrolled in subjects you teach.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteStudent}
        title="Delete Student"
        message="Are you sure you want to delete this student? This action cannot be undone and will remove all associated data including scores and records."
        itemName={deleteModal.student ? `${deleteModal.student.first_name} ${deleteModal.student.last_name}` : ''}
        isLoading={submitting}
      />

      {/* Edit Student Modal */}
      <EditStudentModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        student={editModal.student}
        onSuccess={handleEditSuccess}
      />

      {/* Import Modal */}
      {importModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Import Students from Excel/CSV</h3>
                <button
                  onClick={() => setImportModal({ isOpen: false, importing: false, selectedClassId: null })}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-4">
                  Upload an Excel (.xlsx, .xls) or CSV file containing student data. 
                  Download the template below to see the required format.
                </p>
                <button
                  onClick={async () => {
                    try {
                      await API.downloadStudentTemplate();
                      showSuccess('Template downloaded');
                    } catch (error) {
                      showError(error.response?.data?.message || error.message || 'Failed to download template');
                      debug.error('Template download error:', error);
                    }
                  }}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </button>
              </div>

              {/* Class Selection - Required before import */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class <span className="text-red-500">*</span>
                </label>
                <select
                  value={importModal.selectedClassId || ''}
                  onChange={(e) => setImportModal({ ...importModal, selectedClassId: e.target.value })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">-- Select a class --</option>
                  {isAdmin ? (
                    // Admin can select any class
                    classes.filter(c => c.id !== 'all').map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))
                  ) : (
                    // Form teacher can only select their assigned classes
                    classes.filter(c => c.id !== 'all' && c.is_form_teacher !== false).map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  {isAdmin 
                    ? 'Select the class where you want to import students.' 
                    : 'You can only import students to classes where you are a form teacher.'}
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select File <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={async (e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (!importModal.selectedClassId) {
                      showError('Please select a class first');
                      return;
                    }

                    setImportModal({ ...importModal, importing: true });
                    try {
                      const result = await API.importStudents(file, importModal.selectedClassId);
                      setImportResults(result);
                      showSuccess(`Import completed: ${result.success_count} successful, ${result.error_count} errors`);
                      fetchStudents(); // Refresh the list
                      setImportModal({ isOpen: false, importing: false, selectedClassId: null });
                    } catch (error) {
                      showError(error.message || 'Failed to import students');
                    } finally {
                      setImportModal({ ...importModal, importing: false });
                    }
                  }}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={importModal.importing || !importModal.selectedClassId}
                />
              </div>

              {importResults && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm">
                    <div className="mb-2">
                      <span className="font-medium text-green-600">Successfully imported: {importResults.success_count} students</span>
                    </div>
                    {importResults.error_count > 0 && (
                      <div>
                        <span className="font-medium text-red-600">Errors: {importResults.error_count}</span>
                        <div className="mt-2 max-h-32 overflow-y-auto">
                          {importResults.errors.map((error, idx) => (
                            <div key={idx} className="text-xs text-red-600 mb-1">
                              Row {error.row} ({error.admission_number}): {error.errors.join(', ')}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {importModal.importing && (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-sm text-gray-600">Importing...</span>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setImportModal({ isOpen: false, importing: false });
                    setImportResults(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {exportModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Export Students</h3>
                <button
                  onClick={() => {
                    setExportModal({ isOpen: false, selectedClassId: null });
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Select a class to export students. Two files will be generated:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-gray-600">
                  <li>One with basic student data (first_name, last_name, middle_name, admission_number, email, phone, gender, address)</li>
                  <li>One with the same data plus subjects field</li>
                </ul>
              </div>

              {/* Class Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Class
                </label>
                <select
                  value={exportModal.selectedClassId || ''}
                  onChange={(e) => {
                    setExportModal({ ...exportModal, selectedClassId: e.target.value });
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                >
                  <option value="">-- All Classes --</option>
                  {classes && classes.length > 0 ? (
                    classes.filter(c => c.id !== 'all').map((classItem) => (
                      <option key={classItem.id} value={classItem.id}>
                        {classItem.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>No classes available</option>
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  Select a class to export students from that class, or leave empty to export all students.
                </p>
              </div>

              <div className="flex justify-end mt-6 space-x-3">
                <button
                  onClick={() => {
                    setExportModal({ isOpen: false, selectedClassId: null });
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      // Export basic data
                      const params1 = {};
                      if (exportModal.selectedClassId) params1.class_id = exportModal.selectedClassId;
                      await API.exportStudents(params1);
                      
                      // Wait longer before second export to ensure first download completes and session is maintained
                      await new Promise(resolve => setTimeout(resolve, 1500));
                      
                      // Export with subjects
                      const params2 = { ...params1, include_subjects: true };
                      await API.exportStudents(params2);
                      
                      showSuccess('Students exported successfully (2 files generated)');
                      setExportModal({ isOpen: false, selectedClassId: null });
                    } catch (error) {
                      showError(error.message || 'Failed to export students');
                    }
                  }}
                  className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white"
                  style={{ backgroundColor: COLORS.primary.red }}
                >
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students; 