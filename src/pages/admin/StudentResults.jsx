import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  Trophy, 
  TrendingUp,
  Award,
  BookOpen,
  Target,
  AlertCircle,
  Loader2,
  Download
} from 'lucide-react';
import { COLORS } from '../../constants/colors';
import API from '../../services/API';
import { useNotification } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';

const StudentResults = () => {
  const { studentId } = useParams();
  const navigate = useNavigate();
  const { showError } = useNotification();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedTerm, setSelectedTerm] = useState(null);
  const [availableTerms, setAvailableTerms] = useState([]);

  useEffect(() => {
    fetchStudentResults();
  }, [studentId]);

  const fetchStudentResults = async () => {
    try {
      setLoading(true);
      
      let response;
      if (user?.role === 'admin') {
        // Admins can see all student results
        response = await API.getAdminStudentResults(studentId);
      } else if (user?.role === 'teacher' && user?.is_form_teacher) {
        // Form teachers can see results for students in their classes
        response = await API.getTeacherStudentResults(studentId);
      } else {
        showError('Access denied. You do not have permission to view student results.');
        setLoading(false);
        return;
      }

      const { student: studentData, results: resultsData } = response.data;
      
      setStudent(studentData);
      setResults(resultsData);
      
      // Extract available terms and set default
      if (resultsData && Object.keys(resultsData).length > 0) {
        const terms = Object.keys(resultsData).sort();
        setAvailableTerms(terms);
        setSelectedTerm(terms[0]); // Set first term as default
      }
      
    } catch (error) {
      console.error('Error fetching student results:', error);
      if (error.response?.status === 403) {
        showError('You do not have permission to view this student\'s results');
      } else if (error.response?.status === 404) {
        showError('Student or results not found');
      } else {
        showError('Failed to load student results');
      }
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade?.includes('A')) return 'bg-green-100 text-green-800';
    if (grade?.includes('B')) return 'bg-blue-100 text-blue-800';
    if (grade?.includes('C')) return 'bg-yellow-100 text-yellow-800';
    if (grade?.includes('D')) return 'bg-orange-100 text-orange-800';
    if (grade?.includes('E')) return 'bg-red-100 text-red-800';
    if (grade?.includes('F')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const getGradeRemark = (grade) => {
    if (grade?.includes('A')) return 'Excellent';
    if (grade?.includes('B')) return 'Very Good';
    if (grade?.includes('C')) return 'Good';
    if (grade?.includes('D')) return 'Pass';
    if (grade?.includes('E')) return 'Fair';
    if (grade?.includes('F')) return 'Fail';
    return 'N/A';
  };

  const getPositionSuffix = (position) => {
    if (!position) return '';
    if (position % 10 === 1 && position % 100 !== 11) return 'st';
    if (position % 10 === 2 && position % 100 !== 12) return 'nd';
    if (position % 10 === 3 && position % 100 !== 13) return 'rd';
    return 'th';
  };

  const calculateSummary = (termResults) => {
    if (!termResults || termResults.length === 0) return null;

    const totalScore = termResults.reduce((sum, result) => sum + (parseFloat(result.total_score) || 0), 0);
    const average = totalScore / termResults.length;
    const bestSubject = termResults.reduce((best, current) => 
      (parseFloat(current.total_score) || 0) > (parseFloat(best.total_score) || 0) ? current : best
    );
    const worstSubject = termResults.reduce((worst, current) => 
      (parseFloat(current.total_score) || 0) < (parseFloat(worst.total_score) || 0) ? current : worst
    );

    return {
      totalScore: totalScore.toFixed(1),
      average: average.toFixed(1),
      bestSubject: bestSubject.subject?.name || 'N/A',
      worstSubject: worstSubject.subject?.name || 'N/A',
      totalSubjects: termResults.length
    };
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/students')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-2 text-gray-600">Loading student results...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!student || !results) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/admin/students')}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Students
          </button>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No results found for this student</p>
          <p className="text-gray-400 text-sm mt-2">The student may not have any recorded scores yet.</p>
        </div>
      </div>
    );
  }

  const currentTermResults = selectedTerm ? results[selectedTerm] : [];
  const summary = calculateSummary(currentTermResults);

  const handleDownloadPDF = async () => {
    if (!selectedTerm || !student) {
      showError('Please select a term to generate report card');
      return;
    }

    try {
      const termMapping = {
        'First Term': 'first',
        'Second Term': 'second',
        'Third Term': 'third',
      };
      
      const term = termMapping[selectedTerm] || 'first';
      
      await API.generateStudentReportCard(student.id, {
        term: term,
      });
    } catch (error) {
      showError(error.message || 'Failed to generate PDF report card');
      console.error('PDF generation error:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/admin/students')}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Students
        </button>
        {selectedTerm && (
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            style={{ backgroundColor: COLORS.primary.red }}
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report Card (PDF)
          </button>
        )}
      </div>

      {/* Student Info Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            {student.avatar ? (
              <img src={student.avatar} alt={student.first_name} className="w-full h-full rounded-full object-cover" />
            ) : (
              <User className="w-8 h-8 text-white" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-gray-600">
              {student.admission_number} • {student.schoolClass?.name || 'No Class Assigned'}
            </p>
            <p className="text-sm text-gray-500">{student.email || 'No email provided'}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Available Terms</div>
            <div className="font-semibold text-lg">{availableTerms.length}</div>
            <div className="text-sm text-gray-500 mt-1">Terms</div>
          </div>
        </div>
      </div>

      {/* Term Selection */}
      {availableTerms.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Term</h3>
          <div className="flex flex-wrap gap-2">
            {availableTerms.map((term) => (
              <button
                key={term}
                onClick={() => setSelectedTerm(term)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedTerm === term
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Score</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.primary.blue }}>
                  {summary.totalScore}
                </p>
                <p className="text-xs text-gray-500">{summary.totalSubjects} subjects</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${COLORS.primary.blue}20` }}>
                <Target className="h-6 w-6" style={{ color: COLORS.primary.blue }} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average</p>
                <p className="text-2xl font-bold" style={{ color: COLORS.status.success }}>
                  {summary.average}%
                </p>
                <p className="text-xs text-gray-500">Overall performance</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${COLORS.status.success}20` }}>
                <TrendingUp className="h-6 w-6" style={{ color: COLORS.status.success }} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Best Subject</p>
                <p className="text-lg font-bold" style={{ color: COLORS.primary.red }}>
                  {summary.bestSubject}
                </p>
                <p className="text-xs text-gray-500">Highest score</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${COLORS.primary.red}20` }}>
                <Trophy className="h-6 w-6" style={{ color: COLORS.primary.red }} />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Current Term</p>
                <p className="text-lg font-bold" style={{ color: COLORS.primary.yellow }}>
                  {selectedTerm}
                </p>
                <p className="text-xs text-gray-500">Active term</p>
              </div>
              <div className="p-3 rounded-full" style={{ backgroundColor: `${COLORS.primary.yellow}20` }}>
                <Award className="h-6 w-6" style={{ color: COLORS.primary.yellow }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Results Table */}
      {currentTermResults.length > 0 ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  {selectedTerm} Results
                </h3>
              </div>
              <span className="text-sm text-gray-500">
                {currentTermResults.length} subject{currentTermResults.length !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    1st CA (20)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    2nd CA (20)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Exam (60)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total (100)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Grade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Remark
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTermResults.map((result, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.subject?.name || 'Unknown Subject'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.first_ca ? parseFloat(result.first_ca).toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.second_ca ? parseFloat(result.second_ca).toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {result.exam_score ? parseFloat(result.exam_score).toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {result.total_score ? parseFloat(result.total_score).toFixed(1) : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                        {result.grade || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {result.remark || getGradeRemark(result.grade)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No results for {selectedTerm}</p>
          <p className="text-gray-400 text-sm mt-2">This student has no recorded scores for the selected term.</p>
        </div>
      )}

      {/* Performance Insights */}
      {summary && currentTermResults.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800">Best Subjects</h4>
              <div className="mt-2 space-y-1">
                {currentTermResults
                  .sort((a, b) => (parseFloat(b.total_score) || 0) - (parseFloat(a.total_score) || 0))
                  .slice(0, 2)
                  .map((subject, index) => (
                    <div key={index} className="text-sm text-green-700">
                      {subject.subject?.name || 'Unknown'} ({parseFloat(subject.total_score || 0).toFixed(1)}%)
                    </div>
                  ))}
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-800">Grade Distribution</h4>
              <div className="mt-2 space-y-1">
                {['A', 'B', 'C', 'D', 'E', 'F'].map(grade => {
                  const count = currentTermResults.filter(r => r.grade === grade).length;
                  return count > 0 ? (
                    <div key={grade} className="text-sm text-blue-700">
                      {grade}: {count} subject{count > 1 ? 's' : ''}
                    </div>
                  ) : null;
                })}
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-medium text-yellow-800">Areas for Improvement</h4>
              <div className="mt-2 space-y-1">
                {currentTermResults
                  .sort((a, b) => (parseFloat(a.total_score) || 0) - (parseFloat(b.total_score) || 0))
                  .slice(0, 2)
                  .map((subject, index) => (
                    <div key={index} className="text-sm text-yellow-700">
                      {subject.subject?.name || 'Unknown'} ({parseFloat(subject.total_score || 0).toFixed(1)}%)
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResults; 