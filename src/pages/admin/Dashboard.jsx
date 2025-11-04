import { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import TeacherDashboard from '../teacher/TeacherDashboard';
import AcademicSessionWarningModal from '../../components/AcademicSessionWarningModal';

const Dashboard = () => {
  const { userRole } = useAuth();

  // Route to appropriate dashboard based on user role
  if (userRole === 'teacher') {
    return <TeacherDashboard />;
  }

  // Default to admin dashboard
  return <AdminDashboard />;
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showError } = useNotification();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await API.getAdminDashboard();
      setDashboardData(response.data);
    } catch (error) {
      showError(error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      name: 'Total Students',
      value: dashboardData?.stats?.total_students || '0',
      change: '+12%',
      changeType: 'increase',
      icon: Users,
      color: COLORS.primary.blue
    },
    {
      name: 'Active Classes',
      value: dashboardData?.stats?.total_classes || '0',
      change: '+2',
      changeType: 'increase',
      icon: BookOpen,
      color: COLORS.primary.yellow
    },
    {
      name: 'Total Subjects',
      value: dashboardData?.stats?.total_subjects || '0',
      change: '+8%',
      changeType: 'increase',
      icon: FileText,
      color: COLORS.primary.red
    },
    {
      name: 'Total Teachers',
      value: dashboardData?.stats?.total_teachers || '0',
      change: '+2.1%',
      changeType: 'increase',
      icon: TrendingUp,
      color: COLORS.status.success
    }
  ];

  const recentActivities = dashboardData?.recent_students?.slice(0, 3).map((student, index) => ({
    id: index + 1,
    type: 'student',
    message: `${student.first_name} ${student.last_name} added to ${student.school_class?.name || 'Unknown Class'}`,
    time: 'Recently',
    icon: Users,
    color: COLORS.primary.blue
  })) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AcademicSessionWarningModal />
      {/* Header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Welcome back! Here's what's happening at The Golden Crest Royal Academy.
          </p>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2"
            style={{ '--tw-ring-color': COLORS.primary.red }}
          >
            <Calendar className="mr-2 h-4 w-4" />
            This Term
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div 
                      className="w-8 h-8 rounded-md flex items-center justify-center"
                      style={{ backgroundColor: `${stat.color}20` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: stat.color }} />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {stat.value}
                        </div>
                        <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                          stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stat.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Activities
            </h3>
            <div className="flow-root">
              <ul className="-mb-8">
                {recentActivities.map((activity, activityIdx) => {
                  const Icon = activity.icon;
                  return (
                    <li key={activity.id}>
                      <div className="relative pb-8">
                        {activityIdx !== recentActivities.length - 1 ? (
                          <span
                            className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        ) : null}
                        <div className="relative flex space-x-3">
                          <div>
                            <span 
                              className="h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white"
                              style={{ backgroundColor: `${activity.color}20` }}
                            >
                              <Icon className="w-4 h-4" style={{ color: activity.color }} />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                            <div>
                              <p className="text-sm text-gray-500">
                                {activity.message}
                              </p>
                            </div>
                            <div className="text-right text-sm whitespace-nowrap text-gray-500">
                              {activity.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => navigate('/admin/add-student')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <Users className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Add Student
                </span>
              </button>
              <button 
                onClick={() => navigate('/admin/classes')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  View Class
                </span>
              </button>
              <button 
                onClick={() => navigate('/admin/manage-scores')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  Upload Results
                </span>
              </button>
              <button 
                onClick={() => navigate('/admin/results')}
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors"
                style={{ '--tw-ring-color': COLORS.primary.red }}
              >
                <Award className="mx-auto h-8 w-8 text-gray-400" />
                <span className="mt-2 block text-sm font-medium text-gray-900">
                  View School Result
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
