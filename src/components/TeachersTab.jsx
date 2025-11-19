import { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
} from 'lucide-react';
import { COLORS } from '../constants/colors';
import API from '../services/API';
import { useNotification } from '../contexts/NotificationContext';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import debug from '../utils/debug';

const TeachersTab = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, teacher: null });
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    role: 'teacher',
    assignedClasses: [],
    assignedSubjects: []
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
    fetchClasses();
  }, []);

  const fetchTeachers = async () => {
    try {
      // First, just fetch users - assignments are optional
      const usersResponse = await API.getUsers();
      
      // The API service returns { data, status }
      // The backend returns { data: [...], total: X, message: "..." }
      // So we need to access response.data.data
      let usersData = [];
      
      if (usersResponse && usersResponse.data) {
        if (Array.isArray(usersResponse.data)) {
          // Direct array response
          usersData = usersResponse.data;
        } else if (usersResponse.data.data && Array.isArray(usersResponse.data.data)) {
          // Standard backend response structure
          usersData = usersResponse.data.data;
        }
      }
      
      debug.component('TeachersTab', 'fetchTeachers - Users loaded', { count: usersData.length });
      const teachersData = usersData.filter(user => user.role === 'teacher');

      // Try to fetch assignments, but don't fail if it doesn't work
      let teacherAssignments = {};
      let teacherAssignmentIds = {}; // Store assignment IDs for editing
      try {
        const assignmentsResponse = await API.getTeacherAssignments();
        
        // The API service returns { data, status }
        // The backend returns { data: [...], total: X, message: "..." }
        // So we need to access response.data.data
        let assignmentsData = [];
        
        if (assignmentsResponse && assignmentsResponse.data) {
          if (Array.isArray(assignmentsResponse.data)) {
            // Direct array response
            assignmentsData = assignmentsResponse.data;
          } else if (assignmentsResponse.data.data && Array.isArray(assignmentsResponse.data.data)) {
            // Standard backend response structure
            assignmentsData = assignmentsResponse.data.data;
          }
        }
        
        debug.component('TeachersTab', 'fetchTeachers - Assignments loaded', { count: assignmentsData.length });

        // Group assignments by teacher - store both names and IDs
        assignmentsData.forEach(assignment => {
          const teacherId = assignment.teacher_id;
          if (!teacherAssignments[teacherId]) {
            teacherAssignments[teacherId] = {
              classes: new Set(),
              subjects: new Set()
            };
            teacherAssignmentIds[teacherId] = {
              classIds: new Set(),
              subjectIds: new Set(),
              assignmentIds: [], // Store full assignment objects for deletion
              assignments: [] // Store full assignment objects with class_id and subject_id
            };
          }

          // Handle different possible class property names
          const classObj = assignment.schoolClass || assignment.school_class || assignment.class;
          if (classObj && classObj.name) {
            teacherAssignments[teacherId].classes.add(classObj.name);
            teacherAssignmentIds[teacherId].classIds.add(classObj.id);
          }

          // Handle subject
          if (assignment.subject && assignment.subject.name) {
            teacherAssignments[teacherId].subjects.add(assignment.subject.name);
            teacherAssignmentIds[teacherId].subjectIds.add(assignment.subject.id);
          }

          // Store assignment ID for deletion
          if (assignment.id) {
            teacherAssignmentIds[teacherId].assignmentIds.push(assignment.id);
          }

          // Store full assignment with class_id and subject_id for comparison
          if (assignment.id && assignment.class_id && assignment.subject_id) {
            teacherAssignmentIds[teacherId].assignments.push({
              id: assignment.id,
              class_id: assignment.class_id,
              subject_id: assignment.subject_id
            });
          }
        });
      } catch (assignmentError) {
        debug.warn('Could not fetch teacher assignments:', assignmentError);
        // Continue without assignments - they'll show as empty
      }

      // Add assignment data to teachers - include both names and IDs
      const enrichedTeachers = teachersData.map(teacher => ({
        ...teacher,
        assignedClasses: Array.from(teacherAssignments[teacher.id]?.classes || []),
        assignedSubjects: Array.from(teacherAssignments[teacher.id]?.subjects || []),
        assignedClassIds: Array.from(teacherAssignmentIds[teacher.id]?.classIds || []),
        assignedSubjectIds: Array.from(teacherAssignmentIds[teacher.id]?.subjectIds || []),
        assignmentIds: teacherAssignmentIds[teacher.id]?.assignmentIds || [],
        assignments: teacherAssignmentIds[teacher.id]?.assignments || [] // Store full assignment objects
      }));

      setTeachers(enrichedTeachers);
    } catch (error) {
      showError('Failed to fetch teachers');
      debug.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await API.getSubjects();
      
      // The API service returns { data, status }
      // The backend returns { data: [...], total: X, message: "..." }
      // So we need to access response.data.data
      let subjectsData = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Direct array response
          subjectsData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Standard backend response structure
          subjectsData = response.data.data;
        }
      }
      
      debug.component('TeachersTab', 'fetchSubjects - Subjects loaded', { count: subjectsData.length });
      setSubjects(subjectsData);
    } catch (error) {
      debug.error('Failed to fetch subjects:', error);
      setSubjects([]);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await API.getClasses();
      
      // The API service returns { data, status }
      // The backend returns { data: [...], total: X, message: "..." }
      // So we need to access response.data.data
      let classesData = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Direct array response
          classesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Standard backend response structure
          classesData = response.data.data;
        }
      }
      
      debug.component('TeachersTab', 'fetchClasses - Classes loaded', { count: classesData.length });
      setClasses(classesData);
    } catch (error) {
      debug.error('Failed to fetch classes:', error);
      setClasses([]);
    }
  };

  // Generate username from teacher name
  const generateUsername = (name) => {
    if (!name) return '';
    const cleanName = name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const nameParts = cleanName.split(' ').filter(part => part.length > 0);
    if (nameParts.length >= 2) {
      return `${nameParts[0]}.${nameParts[nameParts.length - 1]}.gloveacademy`;
    } else if (nameParts.length === 1) {
      return `${nameParts[0]}.gloveacademy`;
    }
    return '';
  };

  const handleTeacherChange = (field, value) => {
    setNewTeacher(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate username when name changes
    if (field === 'name') {
      const username = generateUsername(value);
      setNewTeacher(prev => ({
        ...prev,
        username
      }));
    }
  };

  // Validate phone number format
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Phone is optional
    // Accept Nigerian phone formats: +234, 234, 0, or just digits
    // Remove all non-digit characters for validation
    const digitsOnly = phone.replace(/\D/g, '');
    // Should be 10-13 digits (0xxx, 234xxx, +234xxx)
    return digitsOnly.length >= 10 && digitsOnly.length <= 13;
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.username) {
      showError('Please fill in all required fields (Name and Username)');
      return;
    }

    // Validate phone number if provided
    if (newTeacher.phone && !validatePhoneNumber(newTeacher.phone)) {
      showError('Please enter a valid phone number (10-13 digits)');
      return;
    }

    setSubmitting(true);
    try {
      const teacherData = {
        name: newTeacher.name,
        email: newTeacher.email || null, // Allow null if not provided
        username: newTeacher.username,
        password: newTeacher.password || 'password', // Use provided password or default
        role: 'teacher',
        phone: newTeacher.phone || null, // Allow null if not provided
        is_active: true
      };

      // Create the teacher first
      const response = await API.createUser(teacherData);

      // Extract teacher ID from response - try multiple possible structures
      let teacherId = null;
      if (response.data?.id) {
        teacherId = response.data.id;
      } else if (response.id) {
        teacherId = response.id;
      } else if (response.user?.id) {
        teacherId = response.user.id;
      } else if (response.data?.user?.id) {
        teacherId = response.data.user.id;
      }

      debug.component('TeachersTab', 'handleAddTeacher - Teacher created', { teacherId });

      if (!teacherId) {
        showError('Teacher created but could not extract teacher ID for assignments');
        return;
      }

      // Create assignments for each selected class-subject combination
      const assignments = [];
      for (const classId of newTeacher.assignedClasses) {
        for (const subjectId of newTeacher.assignedSubjects) {
          assignments.push({
            teacher_id: parseInt(teacherId), // Ensure it's a number
            subject_id: parseInt(subjectId),
            class_id: parseInt(classId)
          });
        }
      }

      debug.component('TeachersTab', 'handleAddTeacher - Creating assignments', { count: assignments.length });

      // Create all assignments
      if (assignments.length > 0) {
        try {
          const assignmentPromises = assignments.map(async (assignment) => {
            return await API.assignTeacher(assignment);
          });

          await Promise.all(assignmentPromises);
          debug.component('TeachersTab', 'handleAddTeacher - All assignments created');
        } catch (assignmentError) {
          debug.error('Assignment error:', assignmentError);
          showError(`Teacher created successfully, but assignments failed: ${assignmentError.message}. You can assign classes and subjects manually later.`);
          // Don't return here - still show success and refresh the list
        }
      }

      // Show appropriate success message
      if (assignments.length > 0) {
        showSuccess('Teacher added and assigned successfully');
      } else {
        showSuccess('Teacher added successfully');
      }
      setNewTeacher({
        name: '',
        email: '',
        phone: '',
        username: '',
        password: '',
        role: 'teacher',
        assignedClasses: [],
        assignedSubjects: []
      });
      setShowAddForm(false);
      fetchTeachers(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to add teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClassChange = (classId) => {
    setNewTeacher(prev => ({
      ...prev,
      assignedClasses: prev.assignedClasses.includes(classId)
        ? prev.assignedClasses.filter(id => id !== classId)
        : [...prev.assignedClasses, classId]
    }));
  };

  const handleSubjectChange = (subjectId) => {
    setNewTeacher(prev => ({
      ...prev,
      assignedSubjects: prev.assignedSubjects.includes(subjectId)
        ? prev.assignedSubjects.filter(id => id !== subjectId)
        : [...prev.assignedSubjects, subjectId]
    }));
  };

  const handleEditClassChange = (classId) => {
    setEditingTeacher(prev => ({
      ...prev,
      assignedClassIds: prev.assignedClassIds.includes(classId)
        ? prev.assignedClassIds.filter(id => id !== classId)
        : [...prev.assignedClassIds, classId]
    }));
  };

  const handleEditSubjectChange = (subjectId) => {
    setEditingTeacher(prev => ({
      ...prev,
      assignedSubjectIds: prev.assignedSubjectIds.includes(subjectId)
        ? prev.assignedSubjectIds.filter(id => id !== subjectId)
        : [...prev.assignedSubjectIds, subjectId]
    }));
  };

  const handleEditTeacher = async (teacherId, updatedData, newAssignments) => {
    setSubmitting(true);
    try {
      // First, update the teacher's basic info
      await API.updateUser(teacherId, updatedData);

      // Then handle assignments if provided
      let assignmentUpdateSuccess = true;
      if (newAssignments) {
        // Get current assignments for this teacher with class_id and subject_id
        const teacher = teachers.find(t => t.id === teacherId);
        const currentAssignments = teacher?.assignments || [];
        
        // Create a set of new assignments for easy comparison
        const newAssignmentsSet = new Set(
          newAssignments.map(a => `${a.class_id}-${a.subject_id}`)
        );
        
        // Find assignments to remove (exist in current but not in new)
        const assignmentsToRemove = currentAssignments.filter(assignment => {
          const key = `${assignment.class_id}-${assignment.subject_id}`;
          return !newAssignmentsSet.has(key);
        });
        
        // Find assignments to add (exist in new but not in current)
        const currentAssignmentsSet = new Set(
          currentAssignments.map(a => `${a.class_id}-${a.subject_id}`)
        );
        const assignmentsToAdd = newAssignments.filter(assignment => {
          const key = `${assignment.class_id}-${assignment.subject_id}`;
          return !currentAssignmentsSet.has(key);
        });
        
        // Remove assignments that are no longer needed
        if (assignmentsToRemove.length > 0) {
          try {
            await Promise.all(
              assignmentsToRemove.map(assignment => 
                API.removeTeacherAssignment(assignment.id)
              )
            );
          } catch (removeError) {
            debug.error('Error removing old assignments:', removeError);
            assignmentUpdateSuccess = false;
            // Continue even if removal fails
          }
        }

        // Create only new assignments that don't already exist
        if (assignmentsToAdd.length > 0) {
          try {
            // Use Promise.allSettled to handle individual failures gracefully
            const results = await Promise.allSettled(
              assignmentsToAdd.map(assignment => API.assignTeacher(assignment))
            );
            
            // Check for any failures
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
              debug.warn('Some assignments failed to create:', failures);
              assignmentUpdateSuccess = false;
              // Only show error if all failed
              if (failures.length === assignmentsToAdd.length) {
                showError('Teacher updated but assignments failed. Please check and update manually.');
                return; // Exit early if all assignments failed
              } else {
                // Some succeeded, some failed - show partial success
                showSuccess(`Teacher updated. ${assignmentsToAdd.length - failures.length} of ${assignmentsToAdd.length} assignments created successfully.`);
                setEditingTeacher(null);
                fetchTeachers();
                return;
              }
            }
          } catch (assignError) {
            debug.error('Error creating new assignments:', assignError);
            assignmentUpdateSuccess = false;
            // If it's a 400 error about duplicate, that's okay - assignment already exists
            const errorMessage = assignError.message || assignError.response?.data?.message || '';
            if (assignError.response?.status === 400 && errorMessage.includes('already assigned')) {
              // This is fine, assignment already exists - continue
              debug.log('Some assignments already exist, skipping...');
            } else {
              showError('Teacher updated but some assignments failed. Please check and update manually.');
              setEditingTeacher(null);
              fetchTeachers();
              return;
            }
          }
        }
      }

      // Show success message if everything succeeded
      if (assignmentUpdateSuccess) {
        showSuccess('Teacher updated successfully');
      }
      setEditingTeacher(null);
      fetchTeachers(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to update teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTeacher = async () => {
    if (!deleteModal.teacher) return;

    setSubmitting(true);
    try {
      // Use hard delete to completely remove teacher and all associated data
      await API.deleteUser(deleteModal.teacher.id, true);
      showSuccess('Teacher permanently deleted successfully');
      setDeleteModal({ isOpen: false, teacher: null });
      fetchTeachers(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to delete teacher');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (teacher) => {
    setDeleteModal({ isOpen: true, teacher });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, teacher: null });
  };

  // Initialize edit teacher with assignments when opening edit modal
  const handleEditClick = (teacher) => {
    setEditingTeacher({
      ...teacher,
      assignedClassIds: teacher.assignedClassIds || [],
      assignedSubjectIds: teacher.assignedSubjectIds || []
    });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Manage Teachers</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
          style={{ backgroundColor: COLORS.primary.red }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Teacher
        </button>
      </div>

      {/* Add Teacher Form */}
      {showAddForm && (
        <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Teacher</h4>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={newTeacher.name}
                onChange={(e) => handleTeacherChange('name', e.target.value)}
                placeholder="Enter full name"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                value={newTeacher.username}
                onChange={(e) => handleTeacherChange('username', e.target.value)}
                placeholder="Username (auto-generated from name)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address (Optional)
              </label>
              <input
                type="email"
                value={newTeacher.email}
                onChange={(e) => handleTeacherChange('email', e.target.value)}
                placeholder="teacher@gloveacademy.edu.ng"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional - Leave empty if teacher does not have an email address
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                value={newTeacher.phone}
                onChange={(e) => {
                  const value = e.target.value;
                  // Allow only digits, spaces, +, and - for phone numbers
                  if (value === '' || /^[\d\s\+\-()]+$/.test(value)) {
                    handleTeacherChange('phone', value);
                  }
                }}
                placeholder="+234 801 234 5678 or 08012345678"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter a valid phone number (10-13 digits)
              </p>
            </div>
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={newTeacher.password}
              onChange={(e) => handleTeacherChange('password', e.target.value)}
              placeholder="Leave blank for default password"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': COLORS.primary.red }}
            />
            <p className="text-xs text-gray-500 mt-1">
              If left blank, default password "password" will be used
            </p>
          </div>

          {/* Class Assignments */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Classes
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {(classes && Array.isArray(classes) ? classes : []).map(cls => (
                <label key={cls.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTeacher.assignedClasses.includes(cls.id)}
                    onChange={() => handleClassChange(cls.id)}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                  <span className="ml-2 text-sm text-gray-700">{cls.name}</span>
                </label>
              ))}
            </div>
            {newTeacher.assignedClasses.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Select classes this teacher will teach
              </p>
            )}
          </div>

          {/* Subject Assignments */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assign Subjects
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {(subjects && Array.isArray(subjects) ? subjects : []).map(subject => (
                <label key={subject.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={newTeacher.assignedSubjects.includes(subject.id)}
                    onChange={() => handleSubjectChange(subject.id)}
                    className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                  <span className="ml-2 text-sm text-gray-700">{subject.name}</span>
                </label>
              ))}
            </div>
            {newTeacher.assignedSubjects.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Select subjects this teacher will teach
              </p>
            )}
          </div>

          {/* Assignment Summary */}
          {newTeacher.assignedClasses.length > 0 && newTeacher.assignedSubjects.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-800">
                <strong>Assignment Summary:</strong> This teacher will be assigned to teach{' '}
                <strong>{newTeacher.assignedSubjects.length}</strong> subject(s) across{' '}
                <strong>{newTeacher.assignedClasses.length}</strong> class(es), creating{' '}
                <strong>{newTeacher.assignedClasses.length * newTeacher.assignedSubjects.length}</strong> total assignment(s).
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleAddTeacher}
              disabled={!newTeacher.name || !newTeacher.username || submitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: COLORS.primary.red }}
            >
              {submitting ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding...
                </div>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Teacher
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewTeacher({
                  name: '',
                  email: '',
                  phone: '',
                  username: '',
                  password: '',
                  role: 'teacher',
                  assignedClasses: [],
                  assignedSubjects: []
                });
              }}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Teachers List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          <span className="ml-2 text-gray-600">Loading teachers...</span>
        </div>
      ) : (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Classes To Teach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assigned Subjects To Teach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No teachers found</h3>
                    <p className="text-sm text-gray-500">Get started by adding a new teacher.</p>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{teacher.name}</div>
                          <div className="text-sm text-gray-500">ID: {teacher.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {teacher.username}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.email || 'Not provided'}</div>
                      <div className="text-sm text-gray-500">{teacher.phone || 'Not provided'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? (
                          teacher.assignedClasses.slice(0, 2).map((className, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-700"
                            >
                              {className}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No classes assigned</span>
                        )}
                        {teacher.assignedClasses && teacher.assignedClasses.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600">
                            +{teacher.assignedClasses.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {teacher.assignedSubjects && teacher.assignedSubjects.length > 0 ? (
                          teacher.assignedSubjects.slice(0, 2).map((subjectName, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700"
                            >
                              {subjectName}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">No subjects assigned</span>
                        )}
                        {teacher.assignedSubjects && teacher.assignedSubjects.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-50 text-gray-600">
                            +{teacher.assignedSubjects.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        teacher.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {teacher.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditClick(teacher)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit teacher"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(teacher)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete teacher"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Teacher</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={editingTeacher.name}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': COLORS.primary.red }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      value={editingTeacher.username}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, username: e.target.value })}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': COLORS.primary.red }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={editingTeacher.email || ''}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value || null })}
                      placeholder="teacher@gloveacademy.edu.ng"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': COLORS.primary.red }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Optional - Leave empty if teacher does not have an email address
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      value={editingTeacher.phone || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // Allow only digits, spaces, +, and - for phone numbers
                        if (value === '' || /^[\d\s\+\-()]+$/.test(value)) {
                          setEditingTeacher({ ...editingTeacher, phone: value || null });
                        }
                      }}
                      placeholder="+234 801 234 5678 or 08012345678"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                      style={{ '--tw-ring-color': COLORS.primary.red }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter a valid phone number (10-13 digits)
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingTeacher.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, is_active: e.target.value === 'active' })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                {/* Class Assignments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Classes
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {(classes && Array.isArray(classes) ? classes : []).map(cls => (
                      <label key={cls.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingTeacher.assignedClassIds?.includes(cls.id) || false}
                          onChange={() => handleEditClassChange(cls.id)}
                          className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                          style={{ '--tw-ring-color': COLORS.primary.red }}
                        />
                        <span className="ml-2 text-sm text-gray-700">{cls.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Subject Assignments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Subjects
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-md p-2">
                    {(subjects && Array.isArray(subjects) ? subjects : []).map(subject => (
                      <label key={subject.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={editingTeacher.assignedSubjectIds?.includes(subject.id) || false}
                          onChange={() => handleEditSubjectChange(subject.id)}
                          className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                          style={{ '--tw-ring-color': COLORS.primary.red }}
                        />
                        <span className="ml-2 text-sm text-gray-700">{subject.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Assignment Summary */}
                {editingTeacher.assignedClassIds?.length > 0 && editingTeacher.assignedSubjectIds?.length > 0 && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Assignment Summary:</strong> This teacher will be assigned to teach{' '}
                      <strong>{editingTeacher.assignedSubjectIds.length}</strong> subject(s) across{' '}
                      <strong>{editingTeacher.assignedClassIds.length}</strong> class(es), creating{' '}
                      <strong>{editingTeacher.assignedClassIds.length * editingTeacher.assignedSubjectIds.length}</strong> total assignment(s).
                    </p>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => {
                    // Prepare new assignments
                    const newAssignments = [];
                    for (const classId of editingTeacher.assignedClassIds || []) {
                      for (const subjectId of editingTeacher.assignedSubjectIds || []) {
                        newAssignments.push({
                          teacher_id: parseInt(editingTeacher.id),
                          subject_id: parseInt(subjectId),
                          class_id: parseInt(classId)
                        });
                      }
                    }

                    // Validate phone number if provided
                    if (editingTeacher.phone && !validatePhoneNumber(editingTeacher.phone)) {
                      showError('Please enter a valid phone number (10-13 digits)');
                      return;
                    }

                    handleEditTeacher(editingTeacher.id, {
                      name: editingTeacher.name,
                      username: editingTeacher.username,
                      email: editingTeacher.email || null, // Allow null if not provided
                      phone: editingTeacher.phone || null, // Allow null if not provided
                      role: 'teacher', // Required by API
                      is_active: editingTeacher.is_active
                    }, newAssignments);
                  }}
                  disabled={!editingTeacher.name || !editingTeacher.username || submitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.primary.red }}
                >
                  {submitting ? 'Updating...' : 'Update Teacher'}
                </button>
                <button
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={handleDeleteTeacher}
        title="Delete Teacher"
        message="Are you sure you want to delete this teacher? This action cannot be undone and will remove all associated data."
        itemName={deleteModal.teacher?.name}
        isLoading={submitting}
      />
    </div>
  );
};

export default TeachersTab;

