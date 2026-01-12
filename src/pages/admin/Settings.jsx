import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BookOpen,
  Users,
  UserPlus,
  Settings as SettingsIcon,
  Plus,
  Edit,
  Trash2,
  Save,
  Shield,
  Eye,
  EyeOff,
  Calendar, 
  Clock,
  CheckCircle,
  XCircle,
  GraduationCap,
  Download
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import DeleteConfirmationModal from '../../components/DeleteConfirmationModal';
import AcademicSessionsTab from '../../components/AcademicSessionsTab';
import PromotionTab from '../../components/PromotionTab';
import GradingConfigurationTab from '../../components/GradingConfigurationTab';
import TeachersTab from '../../components/TeachersTab';
import debug from '../../utils/debug';

const Settings = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(
    location.state?.tab || 'classes'
  );
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Reset to academic-sessions tab if navigated from warning modal
  useEffect(() => {
    if (location.state?.tab === 'academic-sessions') {
      setActiveTab('academic-sessions');
    }
  }, [location.state]);

  const tabs = [
    { id: 'classes', name: 'Classes', icon: BookOpen },
    { id: 'subjects', name: 'Subjects', icon: SettingsIcon },
    { id: 'teachers', name: 'Teachers', icon: Users },
    { id: 'activities', name: 'Teacher Activities', icon: UserPlus },
    { id: 'academic-sessions', name: 'Academic Sessions', icon: Calendar },
    { id: 'promotion', name: 'Student Promotion', icon: GraduationCap },
    { id: 'grading', name: 'Grading Configuration', icon: SettingsIcon },
    { id: 'admins', name: 'Add Admin', icon: Shield },
  ];

  const TabContent = () => {
    switch (activeTab) {
      
      case 'classes':
        return <ClassesTab />;
      case 'subjects':
        return <SubjectsTab />;
      case 'teachers':
        return <TeachersTab />;
      case 'activities':
        return <TeacherActivitiesTab />;
      case 'academic-sessions':
        return <AcademicSessionsTab />;
      case 'promotion':
        return <PromotionTab />;
      case 'grading':
        return <GradingConfigurationTab />;
      case 'admins':
        return <AdminsTab />;
      default:
        return <ClassesTab />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
          Settings
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Manage your school's classes, subjects, teachers, and assignments.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto py-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'border-red-500 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
                style={activeTab === tab.id ? { borderColor: COLORS.primary.red, color: COLORS.primary.red } : {}}
              >
                <Icon className="mr-2 h-5 w-5" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg">
        <TabContent />
      </div>
    </div>
  );
};

// Classes Tab Component
const ClassesTab = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, class: null });
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const [newClass, setNewClass] = useState({
    name: '',
    form_teacher_id: '',
    description: ''
  });

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await API.getClasses();
      debug.component('Settings', 'fetchClasses - Response received');
      
      // The API service returns { data: backendResponse, status }
      // Backend returns { data: [...], total: X, message: "..." }
      // So the structure is: response.data = { data: [...], total: X, message: "..." }
      // Therefore: response.data.data = [...]
      let classesData = [];
      
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
      }
      
      // Ensure it's always an array
      if (!Array.isArray(classesData)) {
        debug.warn('Settings - Unexpected classes response structure:', response);
        classesData = [];
      }
      
      debug.component('Settings', 'fetchClasses - Data loaded', { count: classesData.length });
      
      setClasses(classesData);
    } catch (error) {
      debug.error('Error fetching classes:', error);
      showError('Failed to fetch classes');
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await API.getUsers();
      debug.component('Settings', 'fetchTeachers - Response received');
      
      // The API service returns { data, status }
      // The backend returns { data: [...], total: X, message: "..." }
      // So we need to access response.data.data
      let teachersData = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Direct array response
          teachersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Standard backend response structure
          teachersData = response.data.data;
        }
      }
      
      debug.component('Settings', 'fetchTeachers - Data loaded', { count: teachersData.length });
      
      const teachersArray = Array.isArray(teachersData) ? teachersData : [];
      setTeachers(teachersArray.filter(user => user.role === 'teacher'));
    } catch (error) {
      debug.error('Failed to fetch teachers:', error);
      setTeachers([]);
    }
  };

  const handleAddClass = async () => {
    if (!newClass.name) {
      showError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const classData = {
        name: newClass.name,
        form_teacher_id: newClass.form_teacher_id || null,
        description: newClass.description
      };

      await API.createClass(classData);
      showSuccess('Class added successfully');
      setNewClass({ name: '', form_teacher_id: '', description: '' });
      setShowAddForm(false);
      fetchClasses(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to add class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClass = async (classId, updatedData) => {
    setSubmitting(true);
    try {
      await API.updateClass(classId, updatedData);
      showSuccess('Class updated successfully');
      setEditingClass(null);
      fetchClasses(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async () => {
    if (!deleteModal.class) return;

    setSubmitting(true);
    try {
      await API.deleteClass(deleteModal.class.id);
      showSuccess('Class deleted successfully');
      setDeleteModal({ isOpen: false, class: null });
      fetchClasses(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to delete class');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (classItem) => {
    setDeleteModal({ isOpen: true, class: classItem });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, class: null });
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Manage Classes</h3>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              try {
                await API.exportClasses();
                showSuccess('Classes exported successfully');
              } catch (error) {
                showError(error.message || 'Failed to export classes');
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
            style={{ backgroundColor: COLORS.primary.red }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Class
          </button>
        </div>
      </div>

      {/* Add Class Form */}
      {showAddForm && (
        <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Class</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class Name *
              </label>
              <input
                type="text"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                placeholder="e.g., JSS 1A, SS 2B"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Form Teacher
              </label>
              <select
                value={newClass.form_teacher_id}
                onChange={(e) => setNewClass({ ...newClass, form_teacher_id: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <option value="">Select a teacher (optional)</option>
                {(teachers && Array.isArray(teachers) ? teachers : []).map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newClass.description}
              onChange={(e) => setNewClass({ ...newClass, description: e.target.value })}
              rows={3}
              placeholder="Brief description of the class"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': COLORS.primary.red }}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleAddClass}
              disabled={!newClass.name || submitting}
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
                  Add Class
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewClass({ name: '', form_teacher_id: '', description: '' });
              }}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Classes List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
          <span className="ml-2 text-gray-600">Loading classes...</span>
        </div>
      ) : (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form Teacher
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {classes.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No classes found</h3>
                    <p className="text-sm text-gray-500">Get started by adding a new class.</p>
                  </td>
                </tr>
              ) : (
                (classes && Array.isArray(classes) ? classes : []).map((classItem) => (
                  <tr key={classItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <Users className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{classItem.name}</div>
                          <div className="text-sm text-gray-500">ID: {classItem.id}</div>
                          {classItem.description && (
                            <div className="text-xs text-gray-400 mt-1">{classItem.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {classItem.students_count || 0} students
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {classItem.form_teacher ? classItem.form_teacher.name : 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingClass(classItem)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit class"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(classItem)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete class"
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

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Class</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Class Name *
                  </label>
                  <input
                    type="text"
                    value={editingClass.name}
                    onChange={(e) => setEditingClass({ ...editingClass, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Form Teacher
                  </label>
                  <select
                    value={editingClass.form_teacher_id || ''}
                    onChange={(e) => setEditingClass({ ...editingClass, form_teacher_id: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  >
                    <option value="">Select form teacher...</option>
                    {(teachers && Array.isArray(teachers) ? teachers : []).map(teacher => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingClass.description || ''}
                    onChange={(e) => setEditingClass({ ...editingClass, description: e.target.value })}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleEditClass(editingClass.id, editingClass)}
                  disabled={!editingClass.name || submitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.primary.red }}
                >
                  {submitting ? 'Updating...' : 'Update Class'}
                </button>
                <button
                  onClick={() => setEditingClass(null)}
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
        onConfirm={handleDeleteClass}
        title="Delete Class"
        message="Are you sure you want to delete this class? This action cannot be undone and will remove all associated data including students and scores."
        itemName={deleteModal.class?.name}
        isLoading={submitting}
      />
    </div>
  );
};

// Subjects Tab Component
const SubjectsTab = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, subject: null });
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    description: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await API.getSubjects();
      debug.component('Settings', 'fetchSubjects - Response received');
      
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
      
      debug.component('Settings', 'fetchSubjects - Data loaded', { count: subjectsData.length });
      
      setSubjects(subjectsData);
    } catch (error) {
      debug.error('Error fetching subjects:', error);
      showError('Failed to fetch subjects');
      setSubjects([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectChange = (field, value) => {
    setNewSubject(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSubject = async () => {
    if (!newSubject.name || !newSubject.code) {
      showError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const subjectData = {
        name: newSubject.name,
        code: newSubject.code.toUpperCase(),
        description: newSubject.description
      };

      await API.createSubject(subjectData);
      showSuccess('Subject added successfully');
      setNewSubject({ name: '', code: '', description: '' });
      setShowAddForm(false);
      fetchSubjects(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to add subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubject = async (subjectId, updatedData) => {
    setSubmitting(true);
    try {
      await API.updateSubject(subjectId, updatedData);
      showSuccess('Subject updated successfully');
      setEditingSubject(null);
      fetchSubjects(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to update subject');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubject = async () => {
    if (!deleteModal.subject) return;

    setSubmitting(true);
    try {
      await API.deleteSubject(deleteModal.subject.id);
      showSuccess('Subject deleted successfully');
      setDeleteModal({ isOpen: false, subject: null });
      fetchSubjects(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to delete subject');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (subject) => {
    setDeleteModal({ isOpen: true, subject });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, subject: null });
  };




  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Manage Subjects</h3>
        <div className="flex space-x-3">
          <button
            onClick={async () => {
              try {
                await API.exportSubjects();
                showSuccess('Subjects exported successfully');
              } catch (error) {
                showError(error.message || 'Failed to export subjects');
              }
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Download className="mr-2 h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
            style={{ backgroundColor: COLORS.primary.red }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Add Subject Form */}
      {showAddForm && (
        <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Subject</h4>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Name *
              </label>
              <input
                type="text"
                value={newSubject.name}
                onChange={(e) => handleSubjectChange('name', e.target.value)}
                placeholder="e.g., Mathematics"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Subject Code *
              </label>
              <input
                type="text"
                value={newSubject.code}
                onChange={(e) => handleSubjectChange('code', e.target.value)}
                placeholder="e.g., MATH"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={newSubject.description}
              onChange={(e) => handleSubjectChange('description', e.target.value)}
              rows={3}
              placeholder="Brief description of the subject"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': COLORS.primary.red }}
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleAddSubject}
              disabled={!newSubject.name || !newSubject.code || submitting}
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
                  Add Subject
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewSubject({ name: '', code: '', description: '' });
              }}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Subjects List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
          <span className="ml-2 text-gray-600">Loading subjects...</span>
        </div>
      ) : (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {subjects.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No subjects found</h3>
                    <p className="text-sm text-gray-500">Get started by adding a new subject.</p>
                  </td>
                </tr>
              ) : (
                (subjects && Array.isArray(subjects) ? subjects : []).map((subject) => (
                  <tr key={subject.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                          <div className="text-sm text-gray-500">ID: {subject.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {subject.code}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {subject.description || 'No description provided'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingSubject(subject)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit subject"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(subject)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete subject"
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

      {/* Edit Subject Modal */}
      {editingSubject && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Subject</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={editingSubject.name}
                    onChange={(e) => setEditingSubject({ ...editingSubject, name: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    value={editingSubject.code}
                    onChange={(e) => setEditingSubject({ ...editingSubject, code: e.target.value.toUpperCase() })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={editingSubject.description || ''}
                    onChange={(e) => setEditingSubject({ ...editingSubject, description: e.target.value })}
                    rows={3}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleEditSubject(editingSubject.id, editingSubject)}
                  disabled={!editingSubject.name || !editingSubject.code || submitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.primary.red }}
                >
                  {submitting ? 'Updating...' : 'Update Subject'}
                </button>
                <button
                  onClick={() => setEditingSubject(null)}
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
        onConfirm={handleDeleteSubject}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This action cannot be undone and will remove all associated data."
        itemName={deleteModal.subject?.name}
        isLoading={submitting}
      />
    </div>
  );
};

// Teacher Activities Tab Component
const TeacherActivitiesTab = () => {
  const [activities, setActivities] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTeacher, setSelectedTeacher] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const { showError } = useNotification();

  useEffect(() => {
    fetchActivities();
    fetchTeachers();
  }, []);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      // Fetch latest teacher activities (scores, attendance, student additions)
      const response = await API.getTeacherActivities({ limit: 50 });
      
      let activitiesData = [];
      
      // Parse response structure
      if (response?.data) {
        if (Array.isArray(response.data)) {
          activitiesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          activitiesData = response.data.data;
        }
      } else if (Array.isArray(response)) {
        activitiesData = response;
      }
      
      // Transform activities to match the expected format
      const formattedActivities = activitiesData.map(activity => {
        const createdAt = new Date(activity.created_at);
        const date = createdAt.toISOString().split('T')[0];
        const time = createdAt.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        
        return {
          id: activity.id,
          teacher_id: activity.teacher_id,
          teacher: activity.teacher || 'Unknown Teacher',
          activity: activity.activity,
          subject: activity.subject || 'General',
          class: activity.class || 'Unknown Class',
          date: date,
          time: time,
          status: activity.status || 'completed',
          description: activity.description || '',
          created_at: activity.created_at
        };
      });
      
      // Take only the latest 20 activities (already sorted by backend)
      setActivities(formattedActivities.slice(0, 20));
    } catch (error) {
      console.error('Error fetching activities:', error);
      showError('Failed to load teacher activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await API.getUsers();
      let usersData = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          usersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          usersData = response.data.data;
        }
      }
      
      const teachersData = usersData.filter(user => user.role === 'teacher');
      setTeachers(teachersData);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      setTeachers([]);
    }
  };

  const availableTeachers = [
    { value: 'all', label: 'All Teachers' },
    ...teachers.map(teacher => ({
      value: teacher.id,
      label: teacher.name
    }))
  ];

  const getStatusColor = (status) => {
    const colors = {
      'completed': 'bg-green-100 text-green-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      'pending': 'bg-gray-100 text-gray-800',
      'overdue': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getActivityIcon = (activity) => {
    const icons = {
      'Result Entry': '📊',
      'Score Entry': '📝',
      'Attendance Marking': '✅',
      'Student Addition': '👤',
      'Assignment Grading': '📝',
      'Parent Meeting': '👥',
      'Lesson Planning': '📚',
      'Exam Preparation': '📋',
      'Student Assessment': '🎯'
    };
    return icons[activity] || '📋';
  };

  const filteredActivities = activities.filter(activity => {
    const matchesTeacher = selectedTeacher === 'all' || activity.teacher_id == selectedTeacher;
    const matchesStatus = selectedStatus === 'all' || activity.status === selectedStatus;
    return matchesTeacher && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Teacher Activities</h3>
        <div className="flex space-x-4">
          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': COLORS.primary.red }}
          >
            {availableTeachers.map((teacher) => (
              <option key={teacher.value} value={teacher.value}>
                {teacher.label}
              </option>
            ))}
          </select>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:border-transparent"
            style={{ '--tw-ring-color': COLORS.primary.red }}
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-green-600 text-lg">✅</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-lg font-semibold text-gray-900">
                {activities.filter(a => a.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-yellow-600 text-lg">⏳</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-lg font-semibold text-gray-900">
                {activities.filter(a => a.status === 'in-progress').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <span className="text-gray-600 text-lg">⏸️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-lg font-semibold text-gray-900">
                {activities.filter(a => a.status === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-red-600 text-lg">⚠️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Overdue</p>
              <p className="text-lg font-semibold text-gray-900">
                {activities.filter(a => a.status === 'overdue').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h4 className="text-lg font-medium text-gray-900">Recent Activities</h4>
        </div>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
            <span className="ml-2 text-gray-600">Loading activities...</span>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredActivities.map((activity) => (
            <div key={activity.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">{getActivityIcon(activity.activity)}</span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h5 className="text-sm font-medium text-gray-900">{activity.activity}</h5>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                        {activity.status.replace('-', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        {activity.teacher}
                      </span>
                      {activity.subject !== 'General' && (
                        <span className="flex items-center">
                          <BookOpen className="w-3 h-3 mr-1" />
                          {activity.subject} • {activity.class}
                        </span>
                      )}
                      <span className="flex items-center">
                        <span className="mr-1">📅</span>
                        {activity.date} at {activity.time}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900 text-sm">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
          </div>
        )}
        
        {!loading && filteredActivities.length === 0 && (
          <div className="p-6 text-center">
            <div className="text-gray-400 text-lg mb-2">📋</div>
            <p className="text-gray-500">No activities found for the selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Admins Tab Component
const AdminsTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, admin: null });
  const [submitting, setSubmitting] = useState(false);
  const { showSuccess, showError } = useNotification();

  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    username: '',
    password: '',
    role: 'admin'
  });

  const availableRoles = [
    { value: 'admin', label: 'Administrator' }
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await API.getUsers();
      debug.component('Settings', 'fetchAdmins - Response received');
      
      // The API service returns { data, status }
      // The backend returns { data: [...], total: X, message: "..." }
      // So we need to access response.data.data
      let usersData = [];
      
      if (response && response.data) {
        if (Array.isArray(response.data)) {
          // Direct array response
          usersData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Standard backend response structure
          usersData = response.data.data;
        }
      }
      
      debug.component('Settings', 'fetchAdmins - Data loaded', { count: usersData.length });
      const adminsData = usersData.filter(user => user.role === 'admin');
      setAdmins(adminsData);
    } catch (error) {
      debug.error('Failed to fetch admins:', error);
      showError('Failed to fetch admins');
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  // Generate username from admin name
  const generateUsername = (name) => {
    if (!name) return '';
    const cleanName = name.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    const nameParts = cleanName.split(' ').filter(part => part.length > 0);
    if (nameParts.length >= 2) {
      return `${nameParts[0]}.${nameParts[nameParts.length - 1]}.ggkacademy`;
    } else if (nameParts.length === 1) {
      return `${nameParts[0]}.ggkacademy`;
    }
    return '';
  };

  const handleAdminChange = (field, value) => {
    setNewAdmin(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate username when name changes
    if (field === 'name') {
      const username = generateUsername(value);
      setNewAdmin(prev => ({
        ...prev,
        username
      }));
    }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.username || !newAdmin.password) {
      showError('Please fill in all required fields');
      return;
    }

    if (newAdmin.password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    if (!newAdmin.email.includes('@')) {
      showError('Please enter a valid email address');
      return;
    }

    setSubmitting(true);
    try {
      const adminData = {
        name: newAdmin.name,
        email: newAdmin.email,
        username: newAdmin.username,
        password: newAdmin.password,
        role: newAdmin.role,
        is_active: true
      };

      await API.createUser(adminData);
      showSuccess('Admin added successfully');
      setNewAdmin({ name: '', email: '', username: '', password: '', role: 'admin' });
      setShowAddForm(false);
      fetchAdmins(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to add admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAdmin = async (adminId, updatedData) => {
    setSubmitting(true);
    try {
      await API.updateUser(adminId, updatedData);
      showSuccess('Admin updated successfully');
      setEditingAdmin(null);
      fetchAdmins(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to update admin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAdmin = async () => {
    if (!deleteModal.admin) return;

    setSubmitting(true);
    try {
      await API.deleteUser(deleteModal.admin.id);
      showSuccess('Admin deleted successfully');
      setDeleteModal({ isOpen: false, admin: null });
      fetchAdmins(); // Refresh the list
    } catch (error) {
      showError(error.message || 'Failed to delete admin');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (admin) => {
    setDeleteModal({ isOpen: true, admin });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, admin: null });
  };

  const getRoleColor = (role) => {
    const colors = {
      'principal': 'bg-purple-100 text-purple-800',
      'admin': 'bg-blue-100 text-blue-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'principal': 'Principal',
      'admin': 'Administrator'
    };
    return labels[role] || role;
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Manage Administrators</h3>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white shadow-sm hover:shadow-lg transition-all"
          style={{ backgroundColor: COLORS.primary.red }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Administrator
        </button>
      </div>

      {/* Add Admin Form */}
      {showAddForm && (
        <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Administrator</h4>
          
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                value={newAdmin.name}
                onChange={(e) => handleAdminChange('name', e.target.value)}
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
                value={newAdmin.username}
                onChange={(e) => handleAdminChange('username', e.target.value)}
                placeholder="Username (auto-generated from name)"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
          </div>

          {/* Contact and Role Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={newAdmin.email}
                onChange={(e) => handleAdminChange('email', e.target.value)}
                placeholder="admin@ggkacademy.com"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                value={newAdmin.role}
                onChange={(e) => handleAdminChange('role', e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <option value="">Select role</option>
                {availableRoles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Password Information */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={newAdmin.password}
              onChange={(e) => handleAdminChange('password', e.target.value)}
              placeholder="Enter password (min 6 characters)"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
              style={{ '--tw-ring-color': COLORS.primary.red }}
            />
            {newAdmin.password && newAdmin.password.length < 6 && (
              <p className="text-sm text-yellow-600 mt-1">Password must be at least 6 characters long</p>
            )}
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleAddAdmin}
              disabled={!newAdmin.name || !newAdmin.email || !newAdmin.username || !newAdmin.role || !newAdmin.password || submitting}
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
                  Add Administrator
                </>
              )}
            </button>
            <button
              onClick={() => {
                setShowAddForm(false);
                setNewAdmin({ name: '', email: '', username: '', password: '', role: 'admin' });
              }}
              disabled={submitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Admins List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
          <span className="ml-2 text-gray-600">Loading administrators...</span>
        </div>
      ) : (
        <div className="overflow-x-auto shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Administrator
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Username
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
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
              {admins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-sm font-medium text-gray-900 mb-2">No administrators found</h3>
                    <p className="text-sm text-gray-500">Get started by adding a new administrator.</p>
                  </td>
                </tr>
              ) : (
                admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <Shield className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{admin.name}</div>
                          <div className="text-sm text-gray-500">ID: {admin.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {admin.username}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {admin.email}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(admin.role)}`}>
                        {getRoleLabel(admin.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {admin.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingAdmin(admin)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit administrator"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openDeleteModal(admin)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete administrator"
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

      {/* Edit Admin Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Administrator</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editingAdmin.name}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
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
                    value={editingAdmin.username}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, username: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={editingAdmin.email}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, email: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={editingAdmin.role}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, role: e.target.value })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  >
                    {availableRoles.map((role) => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={editingAdmin.is_active ? 'active' : 'inactive'}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, is_active: e.target.value === 'active' })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ '--tw-ring-color': COLORS.primary.red }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => handleEditAdmin(editingAdmin.id, {
                    name: editingAdmin.name,
                    username: editingAdmin.username,
                    email: editingAdmin.email,
                    role: editingAdmin.role,
                    is_active: editingAdmin.is_active
                  })}
                  disabled={!editingAdmin.name || !editingAdmin.username || !editingAdmin.email || !editingAdmin.role || submitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: COLORS.primary.red }}
                >
                  {submitting ? 'Updating...' : 'Update Administrator'}
                </button>
                <button
                  onClick={() => setEditingAdmin(null)}
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
        onConfirm={handleDeleteAdmin}
        title="Delete Administrator"
        message="Are you sure you want to delete this administrator? This action cannot be undone and will remove all associated access."
        itemName={deleteModal.admin?.name}
        isLoading={submitting}
      />

      {/* Statistics */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Shield className="w-5 h-5 text-purple-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Administrators</p>
              <p className="text-lg font-semibold text-gray-900">{admins.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-blue-600 text-lg">⚙️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Administrators</p>
              <p className="text-lg font-semibold text-gray-900">
                {admins.filter(admin => admin.is_active).length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
