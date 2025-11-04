import { useState, useEffect } from 'react';
import { COLORS } from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import API from '../../services/API';

const StudentProgress = () => {
  const { user } = useAuth();
  const { showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [progressData, setProgressData] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchProgressData();
    }
  }, [user]);

  const [currentSession, setCurrentSession] = useState(null);
  const [admissionSession, setAdmissionSession] = useState(null);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await API.getStudentResults();
      const responseData = response.data || response;
      const results = responseData.results || {};
      
      // Set current session and admission info
      if (responseData.current_session) {
        setCurrentSession(responseData.current_session);
      }
      if (responseData.admission_session) {
        setAdmissionSession(responseData.admission_session);
      }
      
      // Process the data to create progress information
      const processedData = processProgressData(results);
      setProgressData(processedData);
      
      // Set default selected term to the first available term
      if (processedData.terms.length > 0) {
        setSelectedTerm(processedData.terms[0]);
      }
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const processProgressData = (results) => {
    // Results now grouped by session then term: { "2024/2025": { "First Term": [...], "Second Term": [...] } }
    // Flatten to get all terms across all sessions
    const allTerms = [];
    const termData = {};
    
    Object.entries(results).forEach(([session, sessionResults]) => {
      Object.entries(sessionResults).forEach(([term, termResults]) => {
        const termKey = `${session} - ${term}`;
        allTerms.push(termKey);
        termData[termKey] = termResults || [];
      });
    });
    
    const terms = allTerms;
    
    const processedData = {
      terms,
      termData: {},
      overallStats: {
        totalSubjects: user?.student_subjects?.length || 0,
        completedAssessments: 0,
        averageScore: 0,
        totalScore: 0
      }
    };

    let totalScore = 0;
    let totalAssessments = 0;

    terms.forEach(term => {
      const termResults = results[term] || [];
      let termTotal = 0;
      let termCount = 0;

      const subjectBreakdown = termResults.map(result => {
        const firstCA = parseFloat(result.first_ca) || 0;
        const secondCA = parseFloat(result.second_ca) || 0;
        const exam = parseFloat(result.exam_score) || 0;
        const total = firstCA + secondCA + exam;
        
        termTotal += total;
        termCount++;
        totalScore += total;
        totalAssessments++;

        // Calculate grade
        let grade = 'F';
        if (total >= 80) grade = 'A';
        else if (total >= 70) grade = 'B';
        else if (total >= 60) grade = 'C';
        else if (total >= 50) grade = 'D';
        else if (total >= 40) grade = 'E';

        return {
          subject: result.subject?.name || 'Unknown Subject',
          score: total,
          percentage: total,
          grade: grade,
          firstCA,
          secondCA,
          exam
        };
      });

      processedData.termData[term] = {
        totalScore: termTotal,
        average: termCount > 0 ? Math.round(termTotal / termCount) : 0,
        grade: termCount > 0 ? calculateOverallGrade(termTotal / termCount) : 'N/A',
        subjects: termCount,
        subjectBreakdown
      };
    });

    processedData.overallStats.completedAssessments = totalAssessments;
    processedData.overallStats.totalScore = totalScore;
    processedData.overallStats.averageScore = totalAssessments > 0 ? Math.round(totalScore / totalAssessments) : 0;

    return processedData;
  };

  const calculateOverallGrade = (average) => {
    if (average >= 80) return 'A';
    if (average >= 70) return 'B';
    if (average >= 60) return 'C';
    if (average >= 50) return 'D';
    if (average >= 40) return 'E';
    return 'F';
  };

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-800 bg-green-100 border-green-200';
      case 'B': return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'C': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'E': return 'text-purple-700 bg-purple-50 border-purple-200';
      case 'F': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getImprovementColor = (improvement) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: COLORS.primary.red }}></div>
      </div>
    );
  }

  if (!progressData || progressData.terms.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Progress Data Available</h3>
        <p className="text-gray-500">Your academic progress will appear here once results are recorded</p>
      </div>
    );
  }

  const currentTermData = selectedTerm ? progressData.termData[selectedTerm] : null;
  const previousTerm = progressData.terms[progressData.terms.indexOf(selectedTerm) - 1];
  const previousTermData = previousTerm ? progressData.termData[previousTerm] : null;
  const overallImprovement = previousTermData ? currentTermData.average - previousTermData.average : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Academic Progress</h1>
              <p className="mt-1 text-lg text-gray-600">
                Comprehensive academic performance and growth tracking
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Student Info Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8 border border-blue-200">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900">
                {user ? `${user.first_name} ${user.last_name}` : 'Loading...'}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Admission No:</span>
                  <span className="text-sm text-gray-900 font-semibold">{user?.admission_number || 'Loading...'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Class:</span>
                  <span className="text-sm text-gray-900 font-semibold">{user?.school_class?.name || 'Loading...'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-600">Current Session:</span>
                  <span className="text-sm text-gray-900 font-semibold">{currentSession?.name || 'Not Set'}</span>
                </div>
                {admissionSession && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span className="text-xs text-gray-500">Admitted:</span>
                    <span className="text-xs text-gray-700">{admissionSession.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Term Selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Select Term:</label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {progressData.terms.map(term => (
                <option key={term} value={term}>{term}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Key Performance Indicators */}
        {currentTermData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Current Average</p>
                  <p className="text-3xl font-bold text-gray-900">{currentTermData.average}%</p>
                  {previousTermData && (
                    <p className={`text-sm ${getImprovementColor(overallImprovement)} flex items-center mt-1`}>
                      {overallImprovement > 0 ? '↗' : overallImprovement < 0 ? '↘' : '→'} 
                      {Math.abs(overallImprovement).toFixed(1)}% from {previousTerm}
                    </p>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 00-2-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Score</p>
                  <p className="text-3xl font-bold text-gray-900">{currentTermData.totalScore}</p>
                  <p className="text-sm text-gray-500 mt-1">out of {currentTermData.subjects * 100} possible</p>
                </div>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-3xl font-bold text-gray-900">{currentTermData.subjects}</p>
                  <p className="text-sm text-green-600 mt-1">All subjects assessed</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Grade</p>
                  <p className="text-3xl font-bold text-gray-900">{currentTermData.grade}</p>
                  <p className="text-sm text-blue-600 mt-1">
                    {currentTermData.grade === 'A' ? 'Excellent' : 
                     currentTermData.grade === 'B' ? 'Very Good' : 
                     currentTermData.grade === 'C' ? 'Good' : 
                     currentTermData.grade === 'D' ? 'Fair' : 
                     currentTermData.grade === 'E' ? 'Pass' : 'Needs Improvement'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subject Breakdown */}
        {currentTermData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Subject Performance - {selectedTerm}</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentTermData.subjectBreakdown.map((subject, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{subject.subject}</h4>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getGradeColor(subject.grade)}`}>
                        {subject.grade}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">1st Test:</span>
                        <span className="font-medium">{subject.firstCA}/20</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">2nd Test:</span>
                        <span className="font-medium">{subject.secondCA}/20</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Exam:</span>
                        <span className="font-medium">{subject.exam}/60</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between text-sm font-semibold">
                          <span className="text-gray-900">Total:</span>
                          <span className="text-blue-600">{subject.score}/100</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Progress Timeline */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Academic Timeline</h3>
            <p className="text-sm text-gray-600 mt-1">Track your academic journey across terms</p>
          </div>
          <div className="p-6">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>
              <div className="space-y-8">
                {progressData.terms.map((term, index) => {
                  const termData = progressData.termData[term];
                  return (
                    <div key={term} className="relative flex items-start space-x-4">
                      <div className={`w-4 h-4 rounded-full border-2 ${termData.average > 0 ? 'bg-blue-600 border-blue-600' : 'bg-gray-300 border-gray-300'} relative z-10`}></div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="text-lg font-semibold text-gray-900">{term}</h4>
                          {termData.average > 0 && (
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getGradeColor(termData.grade)}`}>
                              {termData.grade}
                            </span>
                          )}
                        </div>
                        {termData.average > 0 ? (
                          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-600">Average:</span>
                              <span className="ml-2 font-semibold text-gray-900">{termData.average}%</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Total Score:</span>
                              <span className="ml-2 font-semibold text-gray-900">{termData.totalScore}</span>
                            </div>
                            <div>
                              <span className="text-gray-600">Subjects:</span>
                              <span className="ml-2 font-semibold text-gray-900">{termData.subjects}</span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm mt-2">Results pending</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProgress; 