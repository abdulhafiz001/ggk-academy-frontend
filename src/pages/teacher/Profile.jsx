import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Shield, 
  BookOpen, 
  School, 
  Key, 
  Edit3, 
  Save, 
  X,
  UserCheck,
  Award,
  GraduationCap,
  Briefcase,
  Building2,
  BookMarked,
  MoreVertical,
  Settings,
  IdCard
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import debug from '../../utils/debug';

const Profile = () => {
  const { user } = useAuth();
  const { showError, showSuccess } = useNotification();
  const [profileData, setProfileData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({});
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const response = await API.getTeacherProfile();
      setProfileData(response.data);
      setEditData(response.data);
    } catch (error) {
      debug.error('Error fetching profile:', error);
      showError('Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      // Only include fields that exist in the teacher creation form: name, username, email, phone
      const updateData = {
        name: editData.name || '',
        username: editData.username || '',
        email: editData.email || '',
        phone: editData.phone || '',
        address: editData.address || '' // Address is optional but can be updated
      };
      await API.updateTeacherProfile(updateData);
      const response = await API.getTeacherProfile();
      setProfileData(response.data);
      setEditData(response.data);
      setIsEditing(false);
      showSuccess('Profile updated successfully');
    } catch (error) {
      debug.error('Error updating profile:', error);
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const passwordUpdateData = {
        current_password: passwordData.current_password,
        new_password: passwordData.new_password,
        confirm_password: passwordData.new_password_confirmation
      };
      await API.changeTeacherPassword(passwordUpdateData);
      setPasswordData({
        current_password: '',
        new_password: '',
        new_password_confirmation: ''
      });
      setShowPasswordForm(false);
      showSuccess('Password changed successfully');
    } catch (error) {
      debug.error('Error changing password:', error);
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const getFullName = () => {
    // Use name field (which is what teachers have) or fallback to constructing from first/last if available
    if (profileData.name) {
      return profileData.name;
    }
    const parts = [
      profileData.first_name,
      profileData.middle_name,
      profileData.last_name
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(' ') : 'N/A';
  };

  const getInitials = () => {
    const name = getFullName();
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0]?.toUpperCase() || 'T';
    }
    return 'T';
  };

  const getAllSubjects = () => {
    if (!profileData.assignments || profileData.assignments.length === 0) return [];
    const allSubjects = [];
    profileData.assignments.forEach(assignment => {
      if (assignment.subjects && assignment.subjects.length > 0) {
        assignment.subjects.forEach(subject => {
          const subjectName = subject.name || subject;
          if (!allSubjects.find(s => s === subjectName)) {
            allSubjects.push(subjectName);
          }
        });
      }
    });
    return allSubjects;
  };

  const getAllClasses = () => {
    if (!profileData.assignments || profileData.assignments.length === 0) return [];
    return profileData.assignments.map(assignment => assignment.name || assignment);
  };

  if (isLoading && !profileData.id) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const allSubjects = getAllSubjects();
  const allClasses = getAllClasses();
  const formTeacherClasses = profileData.form_teacher_classes || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-6">
                <div className="relative">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <span className="text-2xl font-bold text-white">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-white flex items-center justify-center shadow-md">
                    <UserCheck className="h-4 w-4 text-white" />
                  </div>
                </div>
                
                <div className="pt-2">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {getFullName()}
                  </h1>
                  <div className="flex items-center space-x-4 mb-3">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                      <Shield className="mr-1.5 h-4 w-4" />
                      Teacher
                    </span>
                    {profileData.is_form_teacher && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                        <Award className="mr-1.5 h-4 w-4" />
                        Form Teacher
                      </span>
                    )}
                    {profileData.department && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        <Building2 className="mr-1.5 h-4 w-4" />
                        {profileData.department}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">
                    Professional Educator
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </button>
                )}
                <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-8">
              {['overview', 'personal', 'teaching'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Stats Overview - Always visible on overview tab */}
          {activeTab === 'overview' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{allSubjects.length}</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <BookOpen className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Teaching Classes</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{allClasses.length}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <School className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Form Teacher</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{formTeacherClasses.length}</p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <Award className="h-6 w-6 text-purple-600" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Information Card in Overview */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <IdCard className="mr-2 h-5 w-5 text-gray-600" />
                    Contact Information
                  </h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex items-start space-x-3">
                        <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{profileData.email || 'N/A'}</p>
                        </div>
                      </div>
                      {profileData.phone && (
                        <div className="flex items-start space-x-3">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Phone</p>
                            <p className="font-medium text-gray-900">{profileData.phone}</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="space-y-4">
                      {profileData.address && (
                        <div className="flex items-start space-x-3">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <p className="text-sm text-gray-500">Address</p>
                            <p className="font-medium text-gray-900">{profileData.address}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="mr-2 h-5 w-5 text-gray-600" />
                  Personal Information
                </h3>
              </div>
              <div className="p-6">
                {isEditing ? (
                  <div className="max-w-2xl space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={editData.name || ''}
                        onChange={(e) => handleEditChange('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter full name"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username *</label>
                      <input
                        type="text"
                        value={editData.username || ''}
                        onChange={(e) => handleEditChange('username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter username"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address (Optional)</label>
                        <input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => handleEditChange('email', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="teacher@ggkacademy.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number (Optional)</label>
                        <input
                          type="tel"
                          value={editData.phone || ''}
                          onChange={(e) => handleEditChange('phone', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="+234 xxx xxx xxxx"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Address (Optional)</label>
                      <textarea
                        value={editData.address || ''}
                        onChange={(e) => handleEditChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter address"
                      />
                    </div>
                    
                    <div className="flex gap-3 pt-4">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center transition-colors"
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isLoading ? 'Saving...' : 'Save Changes'}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditing(false);
                          setEditData(profileData);
                        }}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-4">BASIC INFORMATION</h4>
                          <div className="space-y-4">
                            <div>
                              <p className="text-sm text-gray-500">Full Name</p>
                              <p className="font-medium text-gray-900">{getFullName()}</p>
                            </div>
                            {profileData.email && (
                              <div>
                                <p className="text-sm text-gray-500">Email</p>
                                <p className="font-medium text-gray-900">{profileData.email}</p>
                              </div>
                            )}
                            {profileData.username && (
                              <div>
                                <p className="text-sm text-gray-500">Username</p>
                                <p className="font-medium text-gray-900">{profileData.username}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500 mb-4">CONTACT DETAILS</h4>
                          <div className="space-y-4">
                            {profileData.phone && (
                              <div>
                                <p className="text-sm text-gray-500">Phone</p>
                                <p className="font-medium text-gray-900">{profileData.phone}</p>
                              </div>
                            )}
                            {profileData.address && (
                              <div>
                                <p className="text-sm text-gray-500">Address</p>
                                <p className="font-medium text-gray-900">{profileData.address}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        
                      </div>
                    </div>
                    
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <button
                        onClick={() => setShowPasswordForm(true)}
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Teaching Details */}
          {(activeTab === 'overview' || activeTab === 'teaching') && activeTab !== 'personal' && (
            <div className="space-y-6">
              {/* Subjects */}
              {allSubjects.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <BookOpen className="mr-2 h-5 w-5 text-gray-600" />
                      Subjects Teaching
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      {allSubjects.map((subject, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200"
                        >
                          <BookMarked className="h-4 w-4 mr-2" />
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Class Assignments */}
              {profileData.assignments && profileData.assignments.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <School className="mr-2 h-5 w-5 text-gray-600" />
                      Class Assignments
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-4">
                      {profileData.assignments.map((assignment, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <h4 className="font-semibold text-gray-900 mb-3">{assignment.name}</h4>
                          {assignment.subjects && assignment.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {assignment.subjects.map((subject, subIndex) => (
                                <span
                                  key={subIndex}
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200"
                                >
                                  {subject.name || subject}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Form Teacher Responsibilities */}
              {formTeacherClasses.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Award className="mr-2 h-5 w-5 text-gray-600" />
                      Form Teacher Responsibilities
                    </h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {formTeacherClasses.map((className, index) => (
                        <div
                          key={index}
                          className="flex items-center p-4 bg-gray-50 rounded-lg border border-gray-200"
                        >
                          <div className="p-2 bg-gray-100 rounded-lg mr-3">
                            <GraduationCap className="h-5 w-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{className}</p>
                            <p className="text-sm text-gray-500">Form Teacher</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Member Since - shown in overview */}
          {activeTab === 'overview' && profileData.date_joined && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="mr-2 h-5 w-5 text-gray-600" />
                  Membership Information
                </h3>
              </div>
              <div className="p-6">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Member Since</p>
                  <p className="text-gray-900">
                    {new Date(profileData.date_joined).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Key className="mr-3 h-5 w-5 text-gray-600" />
                Change Password
              </h3>
              <button
                onClick={() => setShowPasswordForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, current_password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new_password_confirmation}
                  onChange={(e) => setPasswordData(prev => ({ ...prev, new_password_confirmation: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;