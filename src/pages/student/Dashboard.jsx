import { 
  FileText, 
  TrendingUp, 
  Award, 
  Calendar,
  Download,
  Eye,
  Star,
  BookOpen
} from 'lucide-react';
import { COLORS } from '../../constants/colors';

const StudentDashboard = () => {
  const studentInfo = {
    name: 'John Doe',
    admissionNumber: 'ADM/2024/001',
    class: 'SS 2A',
    session: '2023/2024',
    term: 'Second Term'
  };

  const stats = [
    {
      name: 'Current GPA',
      value: '3.45',
      change: '+0.12',
      changeType: 'increase',
      icon: TrendingUp,
      color: COLORS.primary.blue
    },
    {
      name: 'Class Position',
      value: '5th',
      change: '+2',
      changeType: 'increase',
      icon: Award,
      color: COLORS.primary.yellow
    },
    {
      name: 'Subjects Passed',
      value: '8/9',
      change: '89%',
      changeType: 'neutral',
      icon: BookOpen,
      color: COLORS.status.success
    },
    {
      name: 'Attendance',
      value: '95%',
      change: '+3%',
      changeType: 'increase',
      icon: Calendar,
      color: COLORS.primary.red
    }
  ];

  const recentResults = [
    {
      id: 1,
      subject: 'Mathematics',
      score: 85,
      grade: 'A',
      term: 'Second Term',
      date: '2024-03-15',
      status: 'published'
    },
    {
      id: 2,
      subject: 'English Language',
      score: 78,
      grade: 'B+',
      term: 'Second Term',
      date: '2024-03-14',
      status: 'published'
    },
    {
      id: 3,
      subject: 'Physics',
      score: 92,
      grade: 'A+',
      term: 'Second Term',
      date: '2024-03-13',
      status: 'published'
    },
    {
      id: 4,
      subject: 'Chemistry',
      score: 76,
      grade: 'B',
      term: 'Second Term',
      date: '2024-03-12',
      status: 'published'
    }
  ];

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return COLORS.status.success;
    if (grade.startsWith('B')) return COLORS.primary.blue;
    if (grade.startsWith('C')) return COLORS.primary.yellow;
    return COLORS.status.error;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Welcome back to G-LOVE ACADEMY, {studentInfo.name}!
            </h2>
            <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Admission Number: {studentInfo.admissionNumber}</span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Class: {studentInfo.class}</span>
              </div>
              <div className="mt-2 flex items-center text-sm text-gray-500">
                <span>Session: {studentInfo.session} - {studentInfo.term}</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:shadow-lg transition-all"
              style={{ backgroundColor: COLORS.primary.blue }}
            >
              <Download className="mr-2 h-4 w-4" />
              Download Report Card
            </button>
          </div>
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
                        {stat.changeType !== 'neutral' && (
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stat.change}
                          </div>
                        )}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Results */}
        <div className="lg:col-span-2 bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Recent Results
              </h3>
              <button 
                className="text-sm font-medium hover:underline"
                style={{ color: COLORS.primary.blue }}
              >
                View All Results
              </button>
            </div>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Score
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentResults.map((result) => (
                    <tr key={result.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {result.subject}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {result.score}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span 
                          className="inline-flex px-2 py-1 text-xs font-semibold rounded-full text-white"
                          style={{ backgroundColor: getGradeColor(result.grade) }}
                        >
                          {result.grade}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Quick Actions & Achievements */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button 
                  className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <FileText className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">View All Results</span>
                </button>
                <button 
                  className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Download className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Download Transcripts</span>
                </button>
                <button 
                  className="w-full flex items-center p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Academic Calendar</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Achievements */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                Recent Achievements
              </h3>
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <Star className="h-5 w-5 text-yellow-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Top 5 in Class</p>
                    <p className="text-xs text-gray-500">Second Term 2024</p>
                  </div>
                </div>
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <Award className="h-5 w-5 text-green-500 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Perfect Attendance</p>
                    <p className="text-xs text-gray-500">January 2024</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
