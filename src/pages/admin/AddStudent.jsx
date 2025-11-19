import { useState, useEffect } from 'react';
import { Save, User, Mail, Phone, MapPin, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { COLORS } from '../../constants/colors';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../services/API';
import debug from '../../utils/debug';

const AddStudent = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    admissionNumber: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    class: '',
    subjects: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const { showError, showSuccess } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchFormData();
    }
  }, [user]);

  const fetchFormData = async () => {
    try {
      setLoadingData(true);
      
      const [classesData, subjectsData] = await Promise.all([
        user?.role === 'teacher' ? API.getFormTeacherClasses() : API.getClasses(),
        user?.role === 'teacher' ? API.getTeacherSubjects() : API.getSubjects() // Use teacher endpoint for teachers
      ]);

      // Handle the response structure properly
      // Classes are double-wrapped: response.data.data contains the actual array
      const classesResponse = classesData.data?.data || classesData.data || classesData;
      const subjectsResponse = subjectsData.data || subjectsData; // Subjects might also be wrapped

      // Ensure both are arrays - classesResponse should be the data array
      const classesArray = Array.isArray(classesResponse) ? classesResponse : [];
      const subjectsArray = Array.isArray(subjectsResponse) ? subjectsResponse : [];
      
      debug.component('AddStudent', 'fetchFormData - Data loaded', { 
        classesCount: classesArray.length,
        subjectsCount: subjectsArray.length
      });

      setClasses(classesArray);
      setSubjects(subjectsArray);

      // Filter classes based on user role
      if (user?.role === 'teacher') {
        // For teachers, only show classes they are form teachers of
        setAvailableClasses(classesArray);

        if (classesArray.length === 0) {
          showError('You are not assigned as a form teacher to any class. Please contact the administrator.');
        }
      } else {
        // For admins, show all classes
        setAvailableClasses(classesArray);
      }
    } catch (error) {
      debug.error('Error fetching form data:', error);
      showError('Failed to load form data. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubjectChange = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Find the selected class ID
      const selectedClass = classes.find(c => c.name === formData.class);
      if (!selectedClass) {
        throw new Error('Please select a valid class');
      }

      // Find the selected subject IDs
      const selectedSubjectIds = subjects
        .filter(subject => formData.subjects.includes(subject.name))
        .map(subject => subject.id);

      if (selectedSubjectIds.length === 0) {
        throw new Error('Please select at least one subject');
      }

      const studentData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        middle_name: formData.middleName,
        admission_number: formData.admissionNumber,
        email: formData.email,
        phone: formData.phone,
        date_of_birth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.address,
        parent_name: formData.parentName,
        parent_phone: formData.parentPhone,
        parent_email: formData.parentEmail,
        class_id: selectedClass.id,
        subjects: selectedSubjectIds
      };

      // Use appropriate API endpoint based on user role
      if (user?.role === 'teacher') {
        await API.addStudent(studentData);
      } else {
        await API.createStudent(studentData);
      }

      showSuccess('Student added successfully! They can now login with their admission number.');
      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        middleName: '',
        admissionNumber: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: '',
        address: '',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        class: '',
        subjects: []
      });
    } catch (error) {
      showError(error.response?.data?.message || 'Please fill in all required fields and try again.');
      debug.error('Error creating student:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl">
          Add New Student
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Fill in the student's information to add them to the system.
          {user?.role === 'teacher' && (
            <span className="block mt-1 text-blue-600">
              As a form teacher, you can only add students to classes you are assigned to.
            </span>
          )}
        </p>
        
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg">
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          {/* Personal Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <User className="mr-2 h-5 w-5" style={{ color: COLORS.primary.red }} />
              Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                  placeholder="Enter first name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                  placeholder="Enter last name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Middle Name
                </label>
                <input
                  type="text"
                  name="middleName"
                  value={formData.middleName}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                  placeholder="Enter middle name"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Number *
                </label>
                <input
                  type="text"
                  name="admissionNumber"
                  value={formData.admissionNumber}
                  onChange={handleChange}
                  required
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                  placeholder="e.g., ADM/2024/001"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Mail className="mr-2 h-5 w-5" style={{ color: COLORS.primary.blue }} />
              Contact Information (Optional)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                  placeholder="student@email.com (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                  placeholder="+234 xxx xxx xxxx (optional)"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent"
                style={{ '--tw-ring-color': COLORS.primary.red }}
                placeholder="Enter full address (optional)"
              />
            </div>
          </div>

          {/* Academic Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <BookOpen className="mr-2 h-5 w-5" style={{ color: COLORS.primary.yellow }} />
              Academic Information
            </h3>

            {/* Role-based access message */}
            {user?.role === 'teacher' && Array.isArray(availableClasses) && availableClasses.length === 0 && !loadingData && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      No Classes Available
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You are not assigned as a form teacher to any class. Please contact the administrator
                        to be assigned as a form teacher before adding students.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Class *
                  {user?.role === 'teacher' && (
                    <span className="text-xs text-blue-600 ml-1">(Your assigned classes only)</span>
                  )}
                </label>
                <select
                  name="class"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  disabled={loadingData || (user?.role === 'teacher' && Array.isArray(availableClasses) && availableClasses.length === 0)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:border-transparent disabled:opacity-50"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
                >
                  <option value="">
                    {loadingData
                      ? 'Loading classes...'
                      : (Array.isArray(availableClasses) && availableClasses.length === 0)
                        ? 'No classes available'
                        : 'Select class'
                    }
                  </option>
                  {Array.isArray(availableClasses) && availableClasses.map(cls => (
                    <option key={cls.id} value={cls.name}>{cls.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subjects
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {loadingData ? (
                  <div className="col-span-full text-center py-4 text-gray-500">Loading subjects...</div>
                ) : (
                  subjects.map(subject => (
                    <label key={subject.id} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject.name)}
                        onChange={() => handleSubjectChange(subject.name)}
                        className="h-4 w-4 rounded border-gray-300 focus:ring-2"
                        style={{ '--tw-ring-color': COLORS.primary.red }}
                      />
                      <span className="ml-2 text-sm text-gray-700">{subject.name}</span>
                    </label>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
              style={{ '--tw-ring-color': COLORS.primary.red }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (user?.role === 'teacher' && Array.isArray(availableClasses) && availableClasses.length === 0)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: COLORS.primary.red,
                '--tw-ring-color': COLORS.primary.red
              }}
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Adding Student...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Add Student
                </>
              )}
            </button>
          </div>
        </form>
      </div>


    </div>
  );
};

export default AddStudent;
