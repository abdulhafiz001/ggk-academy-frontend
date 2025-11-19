import { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/API';
import debug from '../utils/debug';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      debug.error('Error parsing user from localStorage:', error);
      localStorage.removeItem('user');
      return null;
    }
  });
  
  const [student, setStudent] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (error) {
      debug.error('Error parsing student from localStorage:', error);
      localStorage.removeItem('user');
      return null;
    }
  });
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        if (parsedUser.role === 'student') {
          setStudent(parsedUser);
        }
        
        // If user is a teacher, refresh their form teacher status
        if (parsedUser.role === 'teacher') {
          refreshUserData();
        }
        
        setLoading(false);
      } catch (error) {
        debug.error('Error parsing saved user:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await API.login(username, password);
      
      const { token, user, role } = response.data;
      
      // Check if teacher is a form teacher
      if (user.role === 'teacher') {
        try {
          const formTeacherResponse = await API.checkFormTeacherStatus();
          user.is_form_teacher = formTeacherResponse.data?.is_form_teacher || false;
          debug.component('AuthContext', 'Login - Form teacher status set', { isFormTeacher: user.is_form_teacher });
        } catch (error) {
          debug.error('Error checking form teacher status during login:', error);
          user.is_form_teacher = false;
        }
      }
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      setUser(user);
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const studentLogin = async (admissionNumber, password) => {
    try {
      const response = await API.studentLogin(admissionNumber, password);
      
      const { token, student, role } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(student));
      
      setUser(student);
      setStudent(student);
      
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    setUser(null);
    setStudent(null);
  };

  const refreshFormTeacherStatus = async () => {
    if (user?.role === 'teacher') {
      try {
        const response = await API.checkFormTeacherStatus();
        const formTeacherStatus = response.data?.is_form_teacher || false;
        const updatedUser = { ...user, is_form_teacher: formTeacherStatus };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        debug.component('AuthContext', 'refreshFormTeacherStatus - Status updated', { isFormTeacher: formTeacherStatus });
        return formTeacherStatus;
      } catch (error) {
        debug.error('Error refreshing form teacher status:', error);
        return false;
      }
    }
    return false;
  };

  const refreshUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        debug.component('AuthContext', 'refreshUserData - No token found');
        return false;
      }
      
      debug.component('AuthContext', 'refreshUserData - Starting');
      
      // Get current user data from backend
      const response = await API.getCurrentUser();
      
      const updatedUser = response.data?.user || response.data;
      
      debug.component('AuthContext', 'refreshUserData - User data received', { 
        userId: updatedUser?.id,
        role: updatedUser?.role,
        isFormTeacher: updatedUser?.is_form_teacher
      });
      
      // Update localStorage and state
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      debug.component('AuthContext', 'refreshUserData - User data updated');
      return updatedUser; // Return the updated user object
    } catch (error) {
      debug.error('Error refreshing user data:', error);
      return false;
    }
  };

  const getCurrentUserWithFreshStatus = async () => {
    debug.component('AuthContext', 'getCurrentUserWithFreshStatus called', { 
      userRole: user?.role,
      isFormTeacher: user?.is_form_teacher
    });
    
    if (user?.role === 'teacher') {
      try {
        debug.component('AuthContext', 'getCurrentUserWithFreshStatus - Refreshing teacher data');
        const updatedUser = await refreshUserData();
        debug.component('AuthContext', 'getCurrentUserWithFreshStatus - Teacher data refreshed', { 
          isFormTeacher: updatedUser?.is_form_teacher
        });
        return updatedUser;
      } catch (error) {
        debug.error('Error getting fresh user status:', error);
        return user; // Return current user if refresh fails
      }
    }
    
    debug.component('AuthContext', 'getCurrentUserWithFreshStatus - Not a teacher, returning current user');
    return user;
  };

  const value = {
    user,
    student,
    loading,
    login,
    studentLogin,
    logout,
    refreshFormTeacherStatus,
    refreshUserData,
    getCurrentUserWithFreshStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 