import { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  FileText, 
  TrendingUp,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
  Clock,
  GraduationCap,
  UserCheck,
  BarChart3,
  Plus,
  Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [formTeacherClasses, setFormTeacherClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch both dashboard data and form teacher classes
      const [dashboardResponse, formTeacherResponse] = await Promise.all([
        API.getTeacherDashboard(),
        API.getFormTeacherClasses()
      ]);
      
      setDashboardData(dashboardResponse.data);
      setFormTeacherClasses(formTeacherResponse.data || formTeacherResponse);
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      showError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
   };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 mx-auto mb-4" style={{ borderColor: COLORS.primary.red }}></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Form Teacher Classes',
      value: formTeacherClasses.length || '0',
      change: 'Active',
      changeType: 'neutral',
      icon: GraduationCap,
      color: COLORS.primary.red,
      description: 'Classes you manage'
    },
    {
      name: 'Teaching Assignments',
      value: dashboardData?.stats?.total_classes || '0',
      change: 'Active',
      changeType: 'neutral',
      icon: BookOpen,
      color: COLORS.primary.blue,
      description: 'Subject assignments'
    },
    {
      name: 'Total Students',
      value: dashboardData?.stats?.total_students || '0',
      change: 'Enrolled',
      changeType: 'neutral',
      icon: Users,
      color: COLORS.primary.yellow,
      description: 'Across all classes'
    },
    {
      name: 'Recent Scores',
      value: dashboardData?.recent_scores?.length || '0',
      change: 'This week',
      changeType: 'neutral',
      icon: TrendingUp,
      color: COLORS.status.success,
      description: 'Score entries'
    }
  ];

  const getChangeColor = (type) => {
    switch (type) {
      case 'increase':
        return 'text-green-600 bg-green-100';
      case 'decrease':
        return ''; // Will use inline styles
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getChangeColorStyle = (type) => {
    if (type === 'decrease') {
      return {
        color: COLORS.primary.red,
        backgroundColor: `${COLORS.primary.red}20`
      };
    }
    return {};
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'increase':
        return <TrendingUp className="h-4 w-4" />;
      case 'decrease':
        return <TrendingUp className="h-4 w-4 transform rotate-180" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Welcome Message */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 rounded-full flex items-center justify-center mb-4" style={{ background: `linear-gradient(to right, ${COLORS.primary.red}, ${COLORS.primary.blue})` }}>
              <GraduationCap className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {user?.name || 'Teacher'}! 👋
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Here's your personalized overview. Manage your classes, record scores, and track student progress all in one place.
          </p>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
              <div key={item.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon className="h-6 w-6" style={{ color: item.color }} />
                  </div>
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChangeColor(item.changeType)}`}
                    style={getChangeColorStyle(item.changeType)}
                  >
                          {getChangeIcon(item.changeType)}
                          <span className="ml-1">{item.change}</span>
                  </span>
                        </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{item.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{item.value}</p>
                  <p className="text-xs text-gray-500">{item.description}</p>
              </div>
            </div>
          );
        })}
      </div>

        {/* Form Teacher Classes - Prominent Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">My Form Teacher Classes</h2>
                <p className="text-gray-600 mt-1">Classes where you are the form teacher</p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/admin/add-student')}
                  className="inline-flex items-center px-4 py-2 text-white text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                  style={{ 
                    backgroundColor: COLORS.primary.red
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = COLORS.primary.blue}
                  onMouseLeave={(e) => e.target.style.backgroundColor = COLORS.primary.red}
                  onFocus={(e) => e.target.style.boxShadow = `0 0 0 2px ${COLORS.primary.red}40`}
                  onBlur={(e) => e.target.style.boxShadow = ''}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Student
                </button>
                      </div>
                      </div>
                    </div>
          
          <div className="p-8">
            {formTeacherClasses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {formTeacherClasses.map((classItem) => (
                  <div key={classItem.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100 hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <GraduationCap className="h-6 w-6 text-blue-600" />
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Form Teacher
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{classItem.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{classItem.description}</p>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Students:</span>
                        <span className="font-semibold text-gray-900">{classItem.students_count || 0}</span>
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          onClick={() => navigate('/admin/students')}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View Students
                        </button>
                        <button
                          onClick={() => navigate('/admin/manage-scores')}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-white text-blue-600 text-xs font-medium rounded-lg border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          Record Scores
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Form Teacher Classes</h3>
                <p className="text-gray-600 max-w-md mx-auto">
                  You haven't been assigned as a form teacher to any class yet. Contact the administrator to be assigned to a class.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Teaching Assignments and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Teaching Assignments */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Teaching Assignments</h3>
              <p className="text-gray-600 text-sm">Subjects and classes you're teaching</p>
            </div>
            <div className="p-6">
              {dashboardData?.assignments && dashboardData.assignments.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.assignments.slice(0, 5).map((assignment, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="p-2 bg-blue-100 rounded-lg mr-4">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{assignment.subject?.name}</p>
                        <p className="text-sm text-gray-600">{assignment.school_class?.name}</p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No teaching assignments yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Scores */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">Recent Score Entries</h3>
              <p className="text-gray-600 text-sm">Latest student scores recorded</p>
            </div>
            <div className="p-6">
            {dashboardData?.recent_scores && dashboardData.recent_scores.length > 0 ? (
                <div className="space-y-4">
                {dashboardData.recent_scores.map((score, index) => (
                    <div key={index} className="flex items-center p-4 bg-gray-50 rounded-xl">
                      <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {score.student?.first_name} {score.student?.last_name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {score.subject?.name} - {score.school_class?.name}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="font-bold text-gray-900">{score.total_score || score.score}%</p>
                        <p className="text-xs text-gray-500">{score.term}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">No recent scores recorded</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-6 py-5 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
            <p className="text-gray-600 text-sm">Access frequently used features</p>
          </div>
          <div className="p-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <button 
              onClick={() => navigate('/admin/manage-scores')}
                className="group p-6 border-2 border-dashed border-gray-200 rounded-xl focus:outline-none transition-all duration-200"
                onMouseEnter={(e) => {
                  e.target.style.borderColor = `${COLORS.primary.red}80`;
                  e.target.style.backgroundColor = `${COLORS.primary.red}10`;
                  const textSpan = e.target.querySelector('span');
                  if (textSpan) textSpan.style.color = COLORS.primary.red;
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '';
                  e.target.style.backgroundColor = '';
                  const textSpan = e.target.querySelector('span');
                  if (textSpan) textSpan.style.color = '';
                }}
                onFocus={(e) => {
                  e.target.style.boxShadow = `0 0 0 2px ${COLORS.primary.red}40`;
                }}
                onBlur={(e) => {
                  e.target.style.boxShadow = '';
                }}
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 rounded-lg flex items-center justify-center mb-3 transition-colors" style={{ backgroundColor: `${COLORS.primary.red}20` }}>
                    <FileText className="h-6 w-6" style={{ color: COLORS.primary.red }} />
                  </div>
                  <span className="block text-sm font-medium text-gray-900">
                Record Scores
              </span>
                </div>
            </button>
              
            <button 
              onClick={() => navigate('/admin/students')}
                className="group p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200"
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-blue-200 transition-colors">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <span className="block text-sm font-medium text-gray-900 group-hover:text-blue-700">
                View Students
              </span>
                </div>
            </button>
              
            <button 
              onClick={() => navigate('/teacher/attendance')}
                className="group p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-green-300 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200"
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <span className="block text-sm font-medium text-gray-900 group-hover:text-green-700">
                Attendance
              </span>
                </div>
            </button>
              
            <button 
              onClick={() => navigate('/admin/profile')}
                className="group p-6 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200"
              >
                <div className="text-center">
                  <div className="mx-auto h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                    <UserCheck className="h-6 w-6 text-purple-600" />
                  </div>
                  <span className="block text-sm font-medium text-gray-900 group-hover:text-purple-700">
                My Profile
              </span>
                </div>
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
