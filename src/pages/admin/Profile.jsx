import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Eye, 
  EyeOff, 
  BookOpen, 
  GraduationCap,
  Edit,
  X,
  Shield,
  Calendar,
  Key,
  Star,
  Briefcase,
  School,
  Clock,
  Award,
  FileText
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../services/API';
import { COLORS } from '../../constants/colors';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: '',
    first_name: '',
    last_name: '',
    middle_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    gender: '',
    qualification: '',
    department: '',
    date_joined: '',
    subjects: [],
    classes: [],
    is_form_teacher: false
  });

  const [editData, setEditData] = useState({ ...profileData });

  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        let response;
        
        console.log('Fetching profile for user role:', user?.role);
        
        if (user?.role === 'admin') {
          response = await API.getAdminProfile();
        } else if (user?.role === 'teacher') {
          response = await API.getTeacherProfile();
        } else if (user?.role === 'student') {
          response = await API.getStudentProfile();
        }

        console.log('Profile API response:', response);

        if (response?.data) {
          const data = response.data;
          console.log('Profile data received:', data);
          
          const profileInfo = {
            name: data.name || user?.name || '',
            first_name: data.first_name || '',
            last_name: data.last_name || '',
            middle_name: data.middle_name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            date_of_birth: data.date_of_birth || '',
            gender: data.gender || '',
            qualification: data.qualification || '',
            department: data.department || '',
            date_joined: data.date_joined || data.created_at || '',
            subjects: data.subjects || [],
            classes: data.classes || [],
            is_form_teacher: data.is_form_teacher || false
          };
          
          console.log('Processed profile info:', profileInfo);
          
          setProfileData(profileInfo);
          setEditData(profileInfo);
        } else {
          console.log('No profile data in response');
          // Fallback to user data if no profile data
          const fallbackProfile = {
            name: user?.name || '',
            first_name: user?.first_name || '',
            last_name: user?.last_name || '',
            middle_name: user?.middle_name || '',
            email: user?.email || '',
            phone: user?.phone || '',
            address: user?.address || '',
            date_of_birth: user?.date_of_birth || '',
            gender: user?.gender || '',
            qualification: user?.qualification || '',
            department: user?.department || '',
            date_joined: user?.created_at || '',
            subjects: user?.subjects || [],
            classes: user?.classes || [],
            is_form_teacher: user?.is_form_teacher || false
          };
          
          setProfileData(fallbackProfile);
          setEditData(fallbackProfile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        showError('Failed to load profile data');
        
        // Fallback to user data on error
        const fallbackProfile = {
          name: user?.name || '',
          first_name: user?.first_name || '',
          last_name: user?.last_name || '',
          middle_name: user?.middle_name || '',
          email: user?.email || '',
          phone: user?.phone || '',
          address: user?.address || '',
          date_of_birth: user?.date_of_birth || '',
          gender: user?.gender || '',
          qualification: user?.qualification || '',
          department: user?.department || '',
          date_joined: user?.created_at || '',
          subjects: user?.subjects || [],
          classes: user?.classes || [],
          is_form_teacher: user?.is_form_teacher || false
        };
        
        setProfileData(fallbackProfile);
        setEditData(fallbackProfile);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfile();
    }
  }, [user]);

  const handleEditChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePasswordChange = (field, value) => {
    setPasswordData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!editData.first_name?.trim()) {
      errors.push('First name is required');
    }
    
    if (!editData.last_name?.trim()) {
      errors.push('Last name is required');
    }
    
    if (!editData.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (editData.phone && !/^[\+]?[1-9][\d]{0,15}$/.test(editData.phone.replace(/\s/g, ''))) {
      errors.push('Please enter a valid phone number');
    }
    
    return errors;
  };

  const handleSaveProfile = async () => {
    const validationErrors = validateForm();
    
    if (validationErrors.length > 0) {
      showError(validationErrors.join(', '));
      return;
    }
    
    setIsLoading(true);
    
    try {
      let response;
      const updateData = { ...editData };
      
      // Clean up the data before sending
      Object.keys(updateData).forEach(key => {
        if (typeof updateData[key] === 'string') {
          updateData[key] = updateData[key].trim();
        }
        if (updateData[key] === '') {
          updateData[key] = null;
        }
      });
      
      if (user?.role === 'admin') {
        response = await API.updateAdminProfile(updateData);
      } else if (user?.role === 'teacher') {
        response = await API.updateTeacherProfile(updateData);
      } else if (user?.role === 'student') {
        response = await API.updateStudentProfile(updateData);
      }

      if (response?.data) {
        setProfileData(updateData);
        setEditData(updateData);
        setIsEditing(false);
        showSuccess('Profile updated successfully!');
        
        if (updateUser) {
          updateUser({ ...user, ...updateData });
        }
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData({ ...profileData });
    setIsEditing(false);
  };

  const validatePassword = () => {
    const errors = [];
    
    if (!passwordData.current_password) {
      errors.push('Current password is required');
    }
    
    if (!passwordData.new_password) {
      errors.push('New password is required');
    } else if (passwordData.new_password.length < 8) {
      errors.push('New password must be at least 8 characters long');
    } else if (!/(?=.*[a-z])/.test(passwordData.new_password)) {
      errors.push('New password must contain at least one lowercase letter');
    } else if (!/(?=.*[A-Z])/.test(passwordData.new_password)) {
      errors.push('New password must contain at least one uppercase letter');
    } else if (!/(?=.*\d)/.test(passwordData.new_password)) {
      errors.push('New password must contain at least one number');
    }
    
    if (!passwordData.confirm_password) {
      errors.push('Confirm password is required');
    } else if (passwordData.new_password !== passwordData.confirm_password) {
      errors.push('New password and confirm password do not match');
    }
    
    return errors;
  };

  const handleChangePassword = async () => {
    const validationErrors = validatePassword();
    
    if (validationErrors.length > 0) {
      showError(validationErrors.join(', '));
      return;
    }

    setPasswordLoading(true);
    
    try {
      let response;
      if (user?.role === 'admin') {
        response = await API.changeAdminPassword(passwordData);
      } else if (user?.role === 'teacher') {
        response = await API.changeTeacherPassword(passwordData);
      } else if (user?.role === 'student') {
        response = await API.changeStudentPassword(passwordData);
      }

      if (response?.data) {
        setPasswordData({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setShowPasswords({
          current: false,
          new: false,
          confirm: false
        });
        setShowPasswordForm(false);
        showSuccess('Password changed successfully!');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'Administrator',
      'teacher': 'Teacher',
      'student': 'Student',
      'principal': 'Principal'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role) => {
    const colors = {
      'admin': 'from-purple-500 to-purple-600',
      'teacher': 'from-blue-500 to-blue-600',
      'student': 'from-green-500 to-green-600',
      'principal': `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  const getFullName = () => {
    if (user?.role === 'teacher') {
      return user?.name || profileData.name || 'Loading...';
    }
    const names = [profileData.first_name, profileData.middle_name, profileData.last_name].filter(Boolean);
    return names.join(' ') || 'Loading...';
  };

  const getInitials = () => {
    if (user?.role === 'teacher') {
      const name = user?.name || profileData.name || '';
      const nameParts = name.split(' ');
      if (nameParts.length >= 2) {
        return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
      } else if (nameParts.length === 1) {
        return nameParts[0][0]?.toUpperCase() || 'U';
      }
      return 'U';
    }
    const first = profileData.first_name?.[0] || '';
    const last = profileData.last_name?.[0] || '';
    return (first + last).toUpperCase();
  };

  const getYearsOfService = () => {
    if (!profileData.date_joined) return 'N/A';
    const joined = new Date(profileData.date_joined);
    const now = new Date();
    const years = now.getFullYear() - joined.getFullYear();
    return `${years}+ years`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.primary.red }}></div>
          <p className="text-gray-600 text-lg">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Please log in to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                    My Profile
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Welcome back, {getFullName()}!
                  </p>
                </div>
              </div>
              <p className="text-xl text-gray-600 max-w-2xl">
                Manage your personal information, account settings, and preferences all in one place.
              </p>
            </div>
            {!isEditing && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Key className="mr-2 h-5 w-5" />
                  Change Password
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{ 
                    background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`,
                    '--tw-ring-color': COLORS.primary.red
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.blue}, ${COLORS.primary.red})`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`;
                  }}
                >
                  <Edit className="mr-2 h-5 w-5" />
                  Edit Profile
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Column - Profile Card */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 hover:shadow-3xl transition-all duration-300">
              {/* Profile Header */}
              <div className="relative h-48 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <div className="relative">
                    <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white ring-4 ring-blue-100/50 backdrop-blur-sm">
                      <span className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                        {getInitials()}
                      </span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                      <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="p-6 pt-28">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-3">
                    {getFullName()}
                  </h2>
                  <div className="flex flex-col items-center space-y-3 mb-4">
                    <span 
                      className={`inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white ${user.role !== 'principal' ? `bg-gradient-to-r ${getRoleColor(user.role)}` : ''} shadow-lg`}
                      style={user.role === 'principal' ? { background: getRoleColor(user.role) } : {}}
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      {getRoleLabel(user.role)}
                    </span>
                    {profileData.is_form_teacher && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200 shadow-sm">
                        <Star className="mr-2 h-4 w-4" />
                        Form Teacher
                      </span>
                    )}
                  </div>
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg mr-3 group-hover:bg-blue-200 transition-colors">
                        <Mail className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Email</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 truncate ml-2 max-w-32">
                      {profileData.email || 'N/A'}
                    </span>
                  </div>
                  
                  {profileData.phone && (
                    <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg mr-3 group-hover:bg-green-200 transition-colors">
                          <Phone className="h-4 w-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Phone</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {profileData.phone}
                      </span>
                    </div>
                  )}

                  {profileData.department && (
                    <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                          <Briefcase className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Department</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {profileData.department}
                      </span>
                    </div>
                  )}

                  {profileData.date_joined && (
                    <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-100 hover:shadow-md transition-all duration-200">
                      <div className="flex items-center">
                        <div className="p-2 bg-orange-100 rounded-lg mr-3 group-hover:bg-orange-200 transition-colors">
                          <Calendar className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="text-sm font-medium text-gray-700">Joined</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {new Date(profileData.date_joined).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
                  {!isEditing && (
                    <button
                      onClick={() => setShowPasswordForm(true)}
                      className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 group"
                    >
                      <div className="p-1 bg-gray-100 rounded-lg mr-3 group-hover:bg-gray-200 transition-colors">
                        <Key className="h-4 w-4 text-gray-600" />
                      </div>
                      Change Password
                    </button>
                  )}
                  
                  {isEditing && (
                    <div className="space-y-3">
                      <button
                        onClick={handleSaveProfile}
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-transparent rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 group"
                        style={{ 
                          background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`,
                          '--tw-ring-color': COLORS.primary.red
                        }}
                        onMouseEnter={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.blue}, ${COLORS.primary.red})`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!e.currentTarget.disabled) {
                            e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`;
                          }
                        }}
                      >
                        {isLoading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Saving...
                          </>
                        ) : (
                          <>
                            <div className="p-1 bg-white/20 rounded-lg mr-2 group-hover:bg-white/30 transition-colors">
                              <Save className="h-4 w-4" />
                            </div>
                            Save Changes
                          </>
                        )}
                      </button>
                      
                      <button
                        onClick={handleCancelEdit}
                        className="w-full inline-flex items-center justify-center px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5 group"
                      >
                        <div className="p-1 bg-gray-100 rounded-lg mr-2 group-hover:bg-gray-200 transition-colors">
                          <X className="h-4 w-4 text-gray-600" />
                        </div>
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Main Content */}
          <div className="xl:col-span-3 space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 hover:shadow-3xl transition-all duration-300">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 via-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <div className="p-2 bg-blue-100 rounded-xl mr-3">
                      <User className="h-6 w-6 text-blue-600" />
                    </div>
                    Personal Information
                  </h3>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {user?.role === 'teacher' ? (
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Full Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => handleEditChange('name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md"
                          style={{ '--tw-ring-color': COLORS.primary.red }}
                          placeholder="Enter full name"
                        />
                      ) : (
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                          <p className="text-gray-900 font-medium text-lg">{profileData.name || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          First Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.first_name}
                            onChange={(e) => handleEditChange('first_name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                            style={{ '--tw-ring-color': COLORS.primary.red }}
                            placeholder="Enter first name"
                          />
                        ) : (
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                            <p className="text-gray-900 font-medium text-lg">{profileData.first_name || 'N/A'}</p>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Last Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.last_name}
                            onChange={(e) => handleEditChange('last_name', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                            style={{ '--tw-ring-color': COLORS.primary.red }}
                            placeholder="Enter last name"
                          />
                        ) : (
                          <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                            <p className="text-gray-900 font-medium text-lg">{profileData.last_name || 'N/A'}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {user?.role !== 'teacher' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Middle Name
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editData.middle_name}
                          onChange={(e) => handleEditChange('middle_name', e.target.value)}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm"
                          placeholder="Enter middle name"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium text-lg">{profileData.middle_name || 'N/A'}</p>
                      )}
                    </div>
                  )}

                  {user?.role !== 'teacher' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Gender
                        </label>
                        {isEditing ? (
                          <select
                            value={editData.gender}
                            onChange={(e) => handleEditChange('gender', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                            style={{ '--tw-ring-color': COLORS.primary.red }}
                          >
                            <option value="">Select gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                          </select>
                        ) : (
                          <p className="text-gray-900 font-medium text-lg capitalize">{profileData.gender || 'N/A'}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Date of Birth
                        </label>
                        {isEditing ? (
                          <input
                            type="date"
                            value={editData.date_of_birth}
                            onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                            style={{ '--tw-ring-color': COLORS.primary.red }}
                          />
                        ) : (
                          <p className="text-gray-900 font-medium text-lg">
                            {profileData.date_of_birth ? new Date(profileData.date_of_birth).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>
                    </>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                        <p className="text-gray-900 font-medium text-lg">{profileData.phone || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        placeholder="Enter email address"
                      />
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                        <p className="text-gray-900 font-medium text-lg">{profileData.email || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editData.address}
                        onChange={(e) => handleEditChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 shadow-sm"
                        placeholder="Enter address"
                      />
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-100">
                        <p className="text-gray-900 font-medium text-lg">{profileData.address || 'N/A'}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            {user?.role !== 'teacher' && (profileData.qualification || profileData.department) && (
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-green-50">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <GraduationCap className="mr-3 h-6 w-6 text-green-600" />
                    Academic Information
                  </h3>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {profileData.qualification && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Qualifications
                        </label>
                        {isEditing ? (
                          <textarea
                            value={editData.qualification}
                            onChange={(e) => handleEditChange('qualification', e.target.value)}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                            style={{ '--tw-ring-color': COLORS.primary.red }}
                            placeholder="Enter qualifications"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium text-lg">{profileData.qualification}</p>
                        )}
                      </div>
                    )}

                    {profileData.department && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Department
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editData.department}
                            onChange={(e) => handleEditChange('department', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                            style={{ '--tw-ring-color': COLORS.primary.red }}
                            placeholder="Enter department"
                          />
                        ) : (
                          <p className="text-gray-900 font-medium text-lg">{profileData.department}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Subjects and Classes Information */}
            {(profileData.subjects?.length > 0 || profileData.classes?.length > 0) && (
              <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
                <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-purple-50">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <BookOpen className="mr-3 h-6 w-6 text-purple-600" />
                    Teaching Information
                  </h3>
                </div>
                
                <div className="p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {profileData.subjects?.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Subjects ({profileData.subjects.length})
                        </label>
                        <div className="space-y-2">
                          {profileData.subjects.map((subject, index) => (
                            <div key={index} className="flex items-center p-3 bg-purple-50 rounded-lg border border-purple-200">
                              <BookOpen className="h-4 w-4 text-purple-600 mr-2" />
                              <span className="text-gray-900 font-medium">{subject.name || subject}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData.classes?.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Classes ({profileData.classes.length})
                        </label>
                        <div className="space-y-2">
                          {profileData.classes.map((cls, index) => (
                            <div key={index} className="flex items-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <School className="h-4 w-4 text-blue-600 mr-2" />
                              <span className="text-gray-900 font-medium">{cls.name || cls}</span>
                              {cls.student_count && (
                                <span className="ml-auto text-sm text-gray-500">
                                  {cls.student_count} students
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-blue-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-blue-100 to-blue-200 rounded-xl group-hover:from-blue-200 group-hover:to-blue-300 transition-all duration-300">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Role</p>
                    <p className="text-lg font-semibold text-gray-900">{getRoleLabel(user.role)}</p>
                  </div>
                </div>
              </div>

              {profileData.subjects?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-green-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-green-100 to-green-200 rounded-xl group-hover:from-green-200 group-hover:to-green-300 transition-all duration-300">
                      <BookOpen className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Subjects</p>
                      <p className="text-lg font-semibold text-gray-900">{profileData.subjects.length}</p>
                    </div>
                  </div>
                </div>
              )}

              {profileData.classes?.length > 0 && (
                <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-purple-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                  <div className="flex items-center">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-purple-200 rounded-xl group-hover:from-purple-200 group-hover:to-purple-300 transition-all duration-300">
                      <School className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Classes</p>
                      <p className="text-lg font-semibold text-gray-900">{profileData.classes.length}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white rounded-2xl shadow-xl p-6 border-l-4 border-orange-500 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 group">
                <div className="flex items-center">
                  <div className="p-3 bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl group-hover:from-orange-200 group-hover:to-orange-300 transition-all duration-300">
                    <Clock className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Service</p>
                    <p className="text-lg font-semibold text-gray-900">{getYearsOfService()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Profile Information */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-indigo-50">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Shield className="mr-3 h-6 w-6 text-indigo-600" />
                  Account Information
                </h3>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      User ID
                    </label>
                    <p className="text-gray-900 font-medium text-lg">{user?.id || 'N/A'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Status
                    </label>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Last Login
                    </label>
                    <p className="text-gray-900 font-medium text-lg">
                      {user?.last_login ? new Date(user.last_login).toLocaleString() : 'N/A'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Member Since
                    </label>
                    <p className="text-gray-900 font-medium text-lg">
                      {profileData.date_joined ? new Date(profileData.date_joined).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-yellow-50">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Key className="mr-3 h-6 w-6 text-yellow-600" />
                  Quick Actions
                </h3>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button
                    onClick={() => setShowPasswordForm(true)}
                    className="flex items-center justify-center p-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl hover:border-yellow-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="text-center">
                      <Key className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Change Password</h4>
                      <p className="text-sm text-gray-600">Update your account password</p>
                    </div>
                  </button>

                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center justify-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl hover:border-blue-300 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1"
                  >
                    <div className="text-center">
                      <Edit className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                      <h4 className="text-lg font-semibold text-gray-900 mb-2">Edit Profile</h4>
                      <p className="text-sm text-gray-600">Update your personal information</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Profile Summary */}
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-emerald-50">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Award className="mr-3 h-6 w-6 text-emerald-600" />
                  Profile Summary
                </h3>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="text-2xl font-bold text-emerald-600 mb-2">
                      {profileData.first_name && profileData.last_name ? '100%' : '0%'}
                    </div>
                    <p className="text-sm text-gray-600">Profile Complete</p>
                  </div>
                  
                  <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="text-2xl font-bold text-blue-600 mb-2">
                      {profileData.phone ? 'Yes' : 'No'}
                    </div>
                    <p className="text-sm text-gray-600">Phone Added</p>
                  </div>
                  
                  <div className="text-center p-4 bg-purple-50 rounded-xl border border-purple-200">
                    <div className="text-2xl font-bold text-purple-600 mb-2">
                      {profileData.address ? 'Yes' : 'No'}
                    </div>
                    <p className="text-sm text-gray-600">Address Added</p>
                  </div>
                </div>
              </div>
            </div>

        
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative mx-auto p-8 w-full max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                  <Lock className="mr-3 h-6 w-6" style={{ color: COLORS.primary.red }} />
                  Change Password
                </h3>
              </div>
              
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      value={passwordData.current_password}
                      onChange={(e) => handlePasswordChange('current_password', e.target.value)}
                      className="w-full pr-12 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                      style={{ '--tw-ring-color': COLORS.primary.red }}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => togglePasswordVisibility('current')}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      value={passwordData.new_password}
                      onChange={(e) => handlePasswordChange('new_password', e.target.value)}
                      className="w-full pr-12 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                      style={{ '--tw-ring-color': COLORS.primary.red }}
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => togglePasswordVisibility('new')}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      value={passwordData.confirm_password}
                      onChange={(e) => handlePasswordChange('confirm_password', e.target.value)}
                      className="w-full pr-12 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                      style={{ '--tw-ring-color': COLORS.primary.red }}
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center"
                      onClick={() => togglePasswordVisibility('confirm')}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 px-8 py-6 bg-gradient-to-r from-gray-50" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                <button
                  onClick={() => setShowPasswordForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 hover:shadow-md transform hover:-translate-y-0.5"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  disabled={passwordLoading || !passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password}
                  className="px-8 py-3 border border-transparent rounded-xl text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={{ 
                    background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`,
                    '--tw-ring-color': COLORS.primary.red
                  }}
                  onMouseEnter={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.blue}, ${COLORS.primary.red})`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.disabled) {
                      e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`;
                    }
                  }}
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
