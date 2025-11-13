import { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  Save, 
  Eye, 
  EyeOff, 
  Edit,
  X,
  Shield,
  Calendar,
  Key,
  UserCircle,
  Settings
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import API from '../../services/API';
import { COLORS } from '../../constants/colors';

const AdminProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const { showError, showSuccess } = useNotification();
  const { user, updateUser } = useAuth();

  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    username: '',
    role: 'admin',
    phone: '',
    address: ''
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
        const response = await API.getAdminProfile();
        
        if (response?.data) {
          const data = response.data;
          const profileInfo = {
            name: data.name || user?.name || '',
            email: data.email || user?.email || '',
            username: data.username || user?.username || '',
            role: data.role || user?.role || 'admin',
            phone: data.phone || user?.phone || '',
            address: data.address || user?.address || ''
          };
          
          setProfileData(profileInfo);
          setEditData(profileInfo);
        } else {
          // Fallback to user data
          const fallbackProfile = {
            name: user?.name || '',
            email: user?.email || '',
            username: user?.username || '',
            role: user?.role || 'admin',
            phone: user?.phone || '',
            address: user?.address || ''
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
          email: user?.email || '',
          username: user?.username || '',
          role: user?.role || 'admin',
          phone: user?.phone || '',
          address: user?.address || ''
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
    
    if (!editData.name?.trim()) {
      errors.push('Name is required');
    }
    
    if (!editData.email?.trim()) {
      errors.push('Email is required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    if (!editData.username?.trim()) {
      errors.push('Username is required');
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
      
      const response = await API.updateAdminProfile(updateData);

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
    } else if (passwordData.new_password.length < 6) {
      errors.push('New password must be at least 6 characters long');
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
      const response = await API.changeAdminPassword(passwordData);

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
      'principal': 'Principal'
    };
    return labels[role] || role;
  };

  const getInitials = () => {
    const name = profileData.name || '';
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
    } else if (nameParts.length === 1) {
      return nameParts[0][0]?.toUpperCase() || 'A';
    }
    return 'A';
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
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                  <UserCircle className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, #111827, ${COLORS.primary.red}, #312e81)` }}>
                    Administrator Profile
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Manage your account information and settings
                  </p>
                </div>
              </div>
            </div>
            {!isEditing && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  style={{ '--tw-ring-color': COLORS.primary.red }}
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
              <div className="relative h-48" style={{ background: `linear-gradient(to bottom right, ${COLORS.primary.red}, ${COLORS.primary.blue}, #9333ea)` }}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                <div className="absolute top-4 right-4">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                </div>
                <div className="absolute bottom-6 left-6">
                  <div className="relative">
                    <div className="w-32 h-32 bg-white rounded-2xl flex items-center justify-center shadow-2xl border-4 border-white backdrop-blur-sm" style={{ '--tw-ring-color': `${COLORS.primary.red}50` }}>
                      <span className="text-4xl font-bold bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
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
                    {profileData.name || 'Administrator'}
                  </h2>
                  <div className="flex flex-col items-center space-y-3 mb-4">
                    <span className="inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow-lg" style={{ background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
                      <Shield className="mr-2 h-4 w-4" />
                      {getRoleLabel(profileData.role)}
                    </span>
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
                  
                  <div className="group flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg mr-3 group-hover:bg-purple-200 transition-colors">
                        <User className="h-4 w-4 text-purple-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-700">Username</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {profileData.username || 'N/A'}
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
                </div>

                {/* Action Buttons */}
                <div className="mt-8 space-y-3">
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
                          e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.blue}, ${COLORS.primary.red})`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})`;
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
              <div className="px-8 py-6 border-b border-gray-200 bg-gradient-to-r from-gray-50" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10, #eef2ff)` }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    <div className="p-2 rounded-xl mr-3" style={{ backgroundColor: `${COLORS.primary.red}20` }}>
                      <User className="h-6 w-6" style={{ color: COLORS.primary.red }} />
                    </div>
                    Personal Information
                  </h3>
                  {isEditing && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: `${COLORS.primary.red}20`, color: COLORS.primary.red }}>
                      <Edit className="mr-1 h-3 w-3" />
                      Editing
                    </span>
                  )}
                </div>
              </div>
              
              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Full Name *
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
                      <div className="p-4 bg-gradient-to-r from-gray-50 rounded-xl border border-gray-100" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                        <p className="text-gray-900 font-medium text-lg">{profileData.name || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Email Address *
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editData.email}
                        onChange={(e) => handleEditChange('email', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                        style={{ '--tw-ring-color': COLORS.primary.red }}
                        placeholder="Enter email address"
                      />
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 rounded-xl border border-gray-100" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                        <p className="text-gray-900 font-medium text-lg">{profileData.email || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  {/* Username */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Username *
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editData.username}
                        onChange={(e) => handleEditChange('username', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                        style={{ '--tw-ring-color': COLORS.primary.red }}
                        placeholder="Enter username"
                      />
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 rounded-xl border border-gray-100" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                        <p className="text-gray-900 font-medium text-lg">{profileData.username || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Role *
                    </label>
                    {isEditing ? (
                      <select
                        value={editData.role}
                        onChange={(e) => handleEditChange('role', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                        style={{ '--tw-ring-color': COLORS.primary.red }}
                      >
                        <option value="admin">Administrator</option>
                        <option value="principal">Principal</option>
                      </select>
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 rounded-xl border border-gray-100" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                        <p className="text-gray-900 font-medium text-lg capitalize">{getRoleLabel(profileData.role)}</p>
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editData.phone}
                        onChange={(e) => handleEditChange('phone', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                        style={{ '--tw-ring-color': COLORS.primary.red }}
                        placeholder="Enter phone number"
                      />
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 rounded-xl border border-gray-100" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                        <p className="text-gray-900 font-medium text-lg">{profileData.phone || 'N/A'}</p>
                      </div>
                    )}
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Address
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editData.address}
                        onChange={(e) => handleEditChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200 shadow-sm"
                        style={{ '--tw-ring-color': COLORS.primary.red }}
                        placeholder="Enter address"
                      />
                    ) : (
                      <div className="p-4 bg-gradient-to-r from-gray-50 rounded-xl border border-gray-100" style={{ background: `linear-gradient(to right, #f9fafb, ${COLORS.primary.red}10)` }}>
                        <p className="text-gray-900 font-medium text-lg">{profileData.address || 'N/A'}</p>
                      </div>
                    )}
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
                      placeholder="Enter new password (min 6 characters)"
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

export default AdminProfile;

